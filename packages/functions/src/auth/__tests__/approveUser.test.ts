import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HttpsError } from "firebase-functions/v2/https";
import {
  InMemoryUserRepository,
  InMemoryRoleRepository,
  InMemoryAuditRepository,
} from "@vet/shared/testing";
import type { User } from "@vet/shared";
import type { Role } from "@vet/shared";

const setCustomUserClaims = vi.fn().mockResolvedValue(undefined);
const revokeRefreshTokens = vi.fn().mockResolvedValue(undefined);

vi.mock("../../admin/firebaseAdmin.js", () => ({
  adminAuth: { setCustomUserClaims, revokeRefreshTokens },
  adminDb: {},
}));

let users: InMemoryUserRepository;
let roles: InMemoryRoleRepository;
let audit: InMemoryAuditRepository;

vi.mock("../../infrastructure/composition.js", () => ({
  getRepositories: () => {
    const repos = { users, roles, audit };
    return {
      ...repos,
      run: async (work: (tx: typeof repos) => Promise<unknown>) => work(repos),
    };
  },
}));

const { approveUser } = await import("../approveUser.js");

const NOW_SECONDS = 1_700_000_000;

function makeUser(uid: string, overrides: Partial<User> = {}): User {
  const now = new Date(NOW_SECONDS * 1000);
  return {
    uid,
    email: `${uid}@example.com`,
    displayName: "Pending Vet",
    roleId: "in_attesa",
    approved: false,
    disabled: false,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    ...overrides,
  };
}

function makeRole(id: string, capabilities: Role["capabilities"]): Role {
  const now = new Date(NOW_SECONDS * 1000);
  return {
    id,
    name: id,
    capabilities,
    locked: false,
    createdAt: now,
    updatedAt: now,
    createdBy: "system",
    updatedBy: "system",
    schemaVersion: 1,
  };
}

function callerRequest(
  data: unknown,
  opts: { uid?: string; caps?: string[]; email?: string; authTime?: number } = {}
) {
  const caps = opts.caps ?? ["uap"];
  return {
    data,
    auth: {
      uid: opts.uid ?? "actor-1",
      token: {
        email: opts.email ?? "actor@example.com",
        caps,
        auth_time: opts.authTime ?? NOW_SECONDS - 10,
      },
    },
    rawRequest: {},
    acceptsStreaming: false,
  } as never;
}

function run(request: ReturnType<typeof callerRequest>) {
  return (approveUser as unknown as { run: (r: unknown) => Promise<unknown> }).run(
    request
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW_SECONDS * 1000));
  users = new InMemoryUserRepository(() => new Date(NOW_SECONDS * 1000));
  roles = new InMemoryRoleRepository();
  audit = new InMemoryAuditRepository(() => new Date(NOW_SECONDS * 1000));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("approveUser authorization guards", () => {
  it("denies when the actor lacks users.approve", async () => {
    await expect(
      run(
        callerRequest(
          { uid: "target-1", roleId: "veterinario" },
          { caps: ["ara"] }
        )
      )
    ).rejects.toMatchObject({ code: "permission-denied" });
    expect(setCustomUserClaims).not.toHaveBeenCalled();
  });

  it("denies self-approval (targetUid === actorUid)", async () => {
    await expect(
      run(
        callerRequest(
          { uid: "actor-1", roleId: "veterinario" },
          { uid: "actor-1" }
        )
      )
    ).rejects.toMatchObject({ code: "permission-denied" });
    expect(setCustomUserClaims).not.toHaveBeenCalled();
  });

  it("denies the bare 'admin' roleId", async () => {
    await expect(
      run(callerRequest({ uid: "target-1", roleId: "admin" }))
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("denies a privileged target role when the actor lacks roles.manage", async () => {
    users.setForTest("target-1", makeUser("target-1"));
    await roles.seed(makeRole("titolare", ["users.approve"]));
    await expect(
      run(
        callerRequest(
          { uid: "target-1", roleId: "titolare" },
          { caps: ["uap"] }
        )
      )
    ).rejects.toMatchObject({ code: "permission-denied" });
    expect(setCustomUserClaims).not.toHaveBeenCalled();
    const stored = await users.getById("target-1");
    expect(stored?.approved).toBe(false);
  });

  it("allows a privileged target role when the actor holds roles.manage", async () => {
    users.setForTest("target-1", makeUser("target-1"));
    await roles.seed(makeRole("titolare", ["users.approve"]));
    await run(
      callerRequest(
        { uid: "target-1", roleId: "titolare" },
        { caps: ["uap", "rm"] }
      )
    );
    const stored = await users.getById("target-1");
    expect(stored?.approved).toBe(true);
    expect(stored?.roleId).toBe("titolare");
  });
});

describe("approveUser not-found handling", () => {
  it("rejects not-found when the user is missing", async () => {
    await roles.seed(makeRole("veterinario", ["activities.read.all"]));
    await expect(
      run(callerRequest({ uid: "ghost", roleId: "veterinario" }))
    ).rejects.toMatchObject({ code: "not-found" });
  });

  it("rejects not-found when the role is missing", async () => {
    users.setForTest("target-1", makeUser("target-1"));
    await expect(
      run(callerRequest({ uid: "target-1", roleId: "missing-role" }))
    ).rejects.toMatchObject({ code: "not-found" });
  });
});

describe("approveUser success path", () => {
  beforeEach(async () => {
    users.setForTest("target-1", makeUser("target-1", { displayName: "Mario" }));
    await roles.seed(makeRole("veterinario", ["activities.read.all"]));
  });

  it("writes the approve patch and a session-revoke floor at the current capsVer", async () => {
    await run(callerRequest({ uid: "target-1", roleId: "veterinario" }));
    const stored = await users.getById("target-1");
    expect(stored?.approved).toBe(true);
    expect(stored?.roleId).toBe("veterinario");
    expect(stored?.approvedBy).toBe("actor-1");
    expect(stored?.minCapsVer).toBe(NOW_SECONDS * 1000);
  });

  it("records a user.approve audit event with the target and roleId", async () => {
    await run(callerRequest({ uid: "target-1", roleId: "veterinario" }));
    const events = await audit.list({ action: "user.approve" });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      actorUid: "actor-1",
      actorEmail: "actor@example.com",
      action: "user.approve",
      targetType: "user",
      targetId: "target-1",
      details: { roleId: "veterinario" },
    });
  });

  it("sets custom claims with vet/roleId/caps/capsVer and the display name", async () => {
    await run(callerRequest({ uid: "target-1", roleId: "veterinario" }));
    expect(setCustomUserClaims).toHaveBeenCalledTimes(1);
    expect(setCustomUserClaims).toHaveBeenCalledWith("target-1", {
      vet: true,
      roleId: "veterinario",
      caps: ["ara"],
      capsVer: NOW_SECONDS * 1000,
      name: "Mario",
    });
  });

  it("omits the name claim when the user has no display name", async () => {
    users.setForTest("target-1", makeUser("target-1", { displayName: "" }));
    await run(callerRequest({ uid: "target-1", roleId: "veterinario" }));
    const claims = setCustomUserClaims.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(claims).not.toHaveProperty("name");
  });

  it("revokes the target's refresh tokens", async () => {
    await run(callerRequest({ uid: "target-1", roleId: "veterinario" }));
    expect(revokeRefreshTokens).toHaveBeenCalledWith("target-1");
  });

  it("uses a wall-clock-millis capsVer in the unified capsVer space", async () => {
    await run(callerRequest({ uid: "target-1", roleId: "veterinario" }));
    const claims = setCustomUserClaims.mock.calls[0]?.[1] as { capsVer: number };
    const stored = await users.getById("target-1");
    expect(claims.capsVer).toBe(NOW_SECONDS * 1000);
    expect(stored?.minCapsVer).toBe(claims.capsVer);
  });
});

describe("approveUser recent-auth gate", () => {
  it("rejects when the caller's sign-in is stale", async () => {
    users.setForTest("target-1", makeUser("target-1"));
    await roles.seed(makeRole("veterinario", ["activities.read.all"]));
    await expect(
      run(
        callerRequest(
          { uid: "target-1", roleId: "veterinario" },
          { authTime: NOW_SECONDS - 60 * 60 }
        )
      )
    ).rejects.toBeInstanceOf(HttpsError);
    expect(setCustomUserClaims).not.toHaveBeenCalled();
  });
});

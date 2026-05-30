import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  InMemoryUserRepository,
  InMemoryRoleRepository,
  InMemoryAuditRepository,
} from "@vet/shared/testing";
import type { Capability, Role, User } from "@vet/shared";

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
  getRepositories: () => ({ users, roles, audit }),
}));

const { onRoleChange } = await import("../onRoleChange.js");

const NOW_MILLIS = 1_700_000_000_000;

function makeUser(uid: string, roleId: string, displayName = ""): User {
  const now = new Date(NOW_MILLIS);
  return {
    uid,
    email: `${uid}@example.com`,
    displayName,
    roleId,
    approved: true,
    disabled: false,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  };
}

function makeChange(
  before: { capabilities?: Capability[]; capsVer?: number } | undefined,
  after: { capabilities: Capability[]; capsVer?: number } | undefined
) {
  return {
    before: { data: () => before },
    after: { data: () => after },
  };
}

function run(roleId: string, change: ReturnType<typeof makeChange>) {
  const event = { params: { roleId }, data: change };
  return (
    onRoleChange as unknown as { run: (e: unknown) => Promise<unknown> }
  ).run(event);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW_MILLIS));
  users = new InMemoryUserRepository(() => new Date(NOW_MILLIS));
  roles = new InMemoryRoleRepository();
  audit = new InMemoryAuditRepository(() => new Date(NOW_MILLIS));
});

afterEach(() => {
  vi.useRealTimers();
});

async function seedRole(id: string, capabilities: Capability[]): Promise<Role> {
  const now = new Date(NOW_MILLIS);
  const role: Role = {
    id,
    name: id,
    capabilities,
    locked: false,
    capsVer: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: "system",
    updatedBy: "system",
    schemaVersion: 1,
  };
  await roles.seed(role);
  return role;
}

describe("onRoleChange loop guard", () => {
  it("short-circuits when the write is the trigger's own capsVer bump", async () => {
    await seedRole("veterinario", ["activities.read.all"]);
    users.setForTest("u1", makeUser("u1", "veterinario"));
    const bumpSpy = vi.spyOn(roles, "bumpCapsVer");

    await run(
      "veterinario",
      makeChange(
        { capabilities: ["activities.read.all"], capsVer: 4 },
        { capabilities: ["activities.read.all"], capsVer: 5 }
      )
    );

    expect(bumpSpy).not.toHaveBeenCalled();
    expect(setCustomUserClaims).not.toHaveBeenCalled();
    expect(revokeRefreshTokens).not.toHaveBeenCalled();
  });

  it("does nothing when the document was deleted (no after data)", async () => {
    await seedRole("veterinario", ["activities.read.all"]);
    await run("veterinario", makeChange({ capabilities: [] }, undefined));
    expect(setCustomUserClaims).not.toHaveBeenCalled();
  });
});

describe("onRoleChange propagation", () => {
  it("bumps the role capsVer and propagates claims to each member", async () => {
    await seedRole("veterinario", ["activities.read.all"]);
    users.setForTest("u1", makeUser("u1", "veterinario", "Anna"));
    users.setForTest("u2", makeUser("u2", "veterinario"));
    users.setForTest("other", makeUser("other", "titolare"));
    const bumpSpy = vi.spyOn(roles, "bumpCapsVer");

    await run(
      "veterinario",
      makeChange(
        { capabilities: [] },
        { capabilities: ["activities.read.all"] }
      )
    );

    expect(bumpSpy).toHaveBeenCalledExactlyOnceWith("veterinario");
    const role = await roles.getById("veterinario");
    expect(role?.capsVer).toBe(2);

    expect(setCustomUserClaims).toHaveBeenCalledTimes(2);
    expect(revokeRefreshTokens).toHaveBeenCalledTimes(2);
    expect(revokeRefreshTokens).toHaveBeenCalledWith("u1");
    expect(revokeRefreshTokens).toHaveBeenCalledWith("u2");
    expect(revokeRefreshTokens).not.toHaveBeenCalledWith("other");
  });

  it("sets claims with roleId/caps/capsVer and includes name only when present", async () => {
    await seedRole("veterinario", ["activities.read.all"]);
    users.setForTest("u1", makeUser("u1", "veterinario", "Anna"));
    users.setForTest("u2", makeUser("u2", "veterinario"));

    await run(
      "veterinario",
      makeChange(
        { capabilities: [] },
        { capabilities: ["activities.read.all"] }
      )
    );

    const byUid = new Map(
      setCustomUserClaims.mock.calls.map(
        (c) => [c[0] as string, c[1] as Record<string, unknown>]
      )
    );
    expect(byUid.get("u1")).toEqual({
      vet: true,
      roleId: "veterinario",
      caps: ["ara"],
      capsVer: NOW_MILLIS,
      name: "Anna",
    });
    expect(byUid.get("u2")).toEqual({
      vet: true,
      roleId: "veterinario",
      caps: ["ara"],
      capsVer: NOW_MILLIS,
    });
    expect(byUid.get("u2")).not.toHaveProperty("name");
  });

  it("writes a session-revoke floor in wall-clock millis for each member", async () => {
    await seedRole("veterinario", ["activities.read.all"]);
    users.setForTest("u1", makeUser("u1", "veterinario"));

    await run(
      "veterinario",
      makeChange(
        { capabilities: [] },
        { capabilities: ["activities.read.all"] }
      )
    );

    const stored = await users.getById("u1");
    expect(stored?.minCapsVer).toBe(NOW_MILLIS);
  });

  it("records a role.update.propagate audit event per member", async () => {
    await seedRole("veterinario", ["activities.read.all"]);
    users.setForTest("u1", makeUser("u1", "veterinario"));
    users.setForTest("u2", makeUser("u2", "veterinario"));

    await run(
      "veterinario",
      makeChange(
        { capabilities: [] },
        { capabilities: ["activities.read.all"] }
      )
    );

    const events = await audit.list({ action: "role.update.propagate" });
    expect(events).toHaveLength(2);
    for (const event of events) {
      expect(event).toMatchObject({
        actorUid: "system:onRoleChange",
        action: "role.update.propagate",
        targetType: "user",
        details: { roleId: "veterinario", capsVer: NOW_MILLIS },
      });
    }
    const targets = events.map((e) => e.targetId).sort();
    expect(targets).toEqual(["u1", "u2"]);
  });

  it("chunks members larger than the chunk size and propagates to all", async () => {
    await seedRole("veterinario", ["activities.read.all"]);
    for (let i = 0; i < 23; i++) {
      users.setForTest(`u${i}`, makeUser(`u${i}`, "veterinario"));
    }

    await run(
      "veterinario",
      makeChange(
        { capabilities: [] },
        { capabilities: ["activities.read.all"] }
      )
    );

    expect(setCustomUserClaims).toHaveBeenCalledTimes(23);
    expect(revokeRefreshTokens).toHaveBeenCalledTimes(23);
    const events = await audit.list({
      action: "role.update.propagate",
      limit: 100,
    });
    expect(events).toHaveLength(23);
  });

  it("propagates the unified wall-clock capsVer space (claim, floor, and audit agree)", async () => {
    await seedRole("veterinario", ["activities.read.all"]);
    users.setForTest("u1", makeUser("u1", "veterinario"));

    await run(
      "veterinario",
      makeChange(
        { capabilities: [] },
        { capabilities: ["activities.read.all"] }
      )
    );

    const claims = setCustomUserClaims.mock.calls[0]?.[1] as { capsVer: number };
    const stored = await users.getById("u1");
    const events = await audit.list({ action: "role.update.propagate" });
    expect(claims.capsVer).toBe(NOW_MILLIS);
    expect(stored?.minCapsVer).toBe(claims.capsVer);
    expect((events[0]?.details as { capsVer: number }).capsVer).toBe(
      claims.capsVer
    );
  });
});

import { describe, expect, it, beforeEach } from "vitest";
import {
  InMemoryUserRepository,
  InMemoryRoleRepository,
  InMemoryAllowlistRepository,
  InMemoryAuthService,
} from "../index.js";
import type { Role } from "../../domain/entities/Role.js";

describe("InMemoryUserRepository", () => {
  let repo: InMemoryUserRepository;
  beforeEach(() => { repo = new InMemoryUserRepository(); });

  function seedUser(uid: string, overrides: Partial<{ roleId: string; approved: boolean }> = {}) {
    const now = new Date();
    repo.setForTest(uid, {
      uid,
      email: `${uid}@example.com`,
      displayName: uid,
      roleId: overrides.roleId ?? "vet",
      approved: overrides.approved ?? true,
      disabled: false,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    });
  }

  it("returns null when user not found", async () => {
    expect(await repo.getById("missing")).toBeNull();
  });

  it("returns a seeded user", async () => {
    seedUser("uid-1");
    const u = await repo.getById("uid-1");
    expect(u?.email).toBe("uid-1@example.com");
    expect(u?.disabled).toBe(false);
  });

  it("lists by role", async () => {
    seedUser("vet-1", { roleId: "vet" });
    seedUser("admin-1", { roleId: "admin" });
    const vets = await repo.listByRole("vet");
    expect(vets.map((u) => u.uid)).toEqual(["vet-1"]);
  });

  it("lists pending", async () => {
    seedUser("pending-1", { approved: false });
    seedUser("approved-1", { approved: true });
    const pending = await repo.listPending();
    expect(pending.map((u) => u.uid)).toEqual(["pending-1"]);
  });
});

describe("InMemoryRoleRepository", () => {
  let repo: InMemoryRoleRepository;
  beforeEach(() => { repo = new InMemoryRoleRepository(); });

  it("returns null when role not found", async () => {
    expect(await repo.getById("missing")).toBeNull();
  });

  it("seeds and retrieves a role", async () => {
    const role: Role = {
      id: "vet",
      name: "Veterinario",
      capabilities: ["activities.read.all", "activities.create"],
      locked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "seed",
      updatedBy: "seed",
      schemaVersion: 1,
    };
    await repo.seed(role);
    const r = await repo.getById("vet");
    expect(r?.name).toBe("Veterinario");
    expect(r?.capabilities).toContain("activities.create");
  });
});

describe("InMemoryAllowlistRepository", () => {
  let repo: InMemoryAllowlistRepository;
  beforeEach(() => { repo = new InMemoryAllowlistRepository(); });

  it("normalizes email when adding and reading", async () => {
    await repo.add({ email: "  StEf@Example.COM  ", defaultRoleId: "admin" }, "actor-uid");
    const e = await repo.getByEmail("stef@example.com");
    expect(e).not.toBeNull();
    expect(e?.email).toBe("  StEf@Example.COM  ");
    expect(e?.emailNorm).toBe("stef@example.com");
    expect(e?.invitedBy).toBe("actor-uid");
  });

  it("removes by normalized email", async () => {
    await repo.add({ email: "x@y.com", defaultRoleId: "vet" }, "actor-uid");
    await repo.remove("x@y.com");
    expect(await repo.getByEmail("x@y.com")).toBeNull();
  });
});

describe("InMemoryAuthService", () => {
  let auth: InMemoryAuthService;
  beforeEach(() => { auth = new InMemoryAuthService(); });

  it("starts signed out", () => {
    expect(auth.getCurrentUser()).toBeNull();
  });

  it("emits state on subscribe", () => {
    let received: unknown = "untouched";
    const unsub = auth.subscribe((u) => { received = u; });
    expect(received).toBeNull();
    unsub();
  });

  it("simulates sign-in via setSimulatedUser", () => {
    auth.setSimulatedUser({
      uid: "uid-1",
      email: "a@b.com",
      displayName: "A",
      roleId: "vet",
      caps: new Set(["activities.read.all"]),
    });
    expect(auth.getCurrentUser()?.uid).toBe("uid-1");
  });

  it("signOut clears current user and notifies subscribers", async () => {
    auth.setSimulatedUser({
      uid: "uid-1",
      email: "a@b.com",
      displayName: "A",
      roleId: "vet",
      caps: new Set(),
    });
    const events: Array<unknown> = [];
    auth.subscribe((u) => events.push(u));
    await auth.signOut();
    expect(auth.getCurrentUser()).toBeNull();
    expect(events.at(-1)).toBeNull();
  });
});

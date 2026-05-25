import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryAuditRepository } from "../InMemoryAuditRepository.js";

describe("InMemoryAuditRepository.record", () => {
  let repo: InMemoryAuditRepository;
  const fixed = new Date("2026-04-15T09:00:00Z");
  beforeEach(() => {
    repo = new InMemoryAuditRepository(() => fixed);
  });

  it("appends a typed event with auto id and clock-stamped at", async () => {
    await repo.record({
      actorUid: "vet-1",
      actorEmail: "vet@example.com",
      action: "user.approve",
      targetType: "user",
      targetId: "target-1",
    });
    const events = await repo.list();
    expect(events).toHaveLength(1);
    const e = events[0]!;
    expect(e.id).toBe("audit-1");
    expect(e.at.getTime()).toBe(fixed.getTime());
    expect(e.actorUid).toBe("vet-1");
    expect(e.actorEmail).toBe("vet@example.com");
    expect(e.action).toBe("user.approve");
    expect(e.targetType).toBe("user");
    expect(e.targetId).toBe("target-1");
    expect(e.details).toBeUndefined();
  });

  it("preserves details when supplied", async () => {
    await repo.record({
      actorUid: "vet-1",
      actorEmail: "vet@example.com",
      action: "access_request.accept",
      targetType: "access_request",
      targetId: "ar-1",
      details: { roleId: "vet" },
    });
    const e = (await repo.list())[0]!;
    expect(e.details).toEqual({ roleId: "vet" });
  });

  it("increments ids monotonically", async () => {
    await repo.record({
      actorUid: "u",
      actorEmail: "e",
      action: "attivita.purge",
      targetType: "attivita",
      targetId: "x",
    });
    await repo.record({
      actorUid: "u",
      actorEmail: "e",
      action: "attivita.purge",
      targetType: "attivita",
      targetId: "y",
    });
    const events = await repo.list();
    expect(events.map((e) => e.id).sort()).toEqual(["audit-1", "audit-2"]);
  });

  it("filters by action and targetType in list", async () => {
    await repo.record({
      actorUid: "u",
      actorEmail: "e",
      action: "user.approve",
      targetType: "user",
      targetId: "a",
    });
    await repo.record({
      actorUid: "u",
      actorEmail: "e",
      action: "attivita.purge",
      targetType: "attivita",
      targetId: "b",
    });
    const onlyUsers = await repo.list({ targetType: "user" });
    expect(onlyUsers).toHaveLength(1);
    expect(onlyUsers[0]!.targetId).toBe("a");
    const onlyPurge = await repo.list({ action: "attivita.purge" });
    expect(onlyPurge).toHaveLength(1);
    expect(onlyPurge[0]!.targetId).toBe("b");
  });
});

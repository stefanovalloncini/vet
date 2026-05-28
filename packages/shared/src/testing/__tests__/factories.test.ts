import { describe, expect, it } from "vitest";
import {
  makeActorContext,
  makeAttivita,
  makeAzienda,
  makeActivityType,
  makeConto,
  makeReminder,
  makeRole,
  makeUser,
  makeAllowlistEntry,
  makeAuditEvent,
} from "../factories.js";

describe("makeAttivita", () => {
  it("produces a valid Attivita with sensible defaults", () => {
    const a = makeAttivita();
    expect(a.id).toMatch(/^att-/);
    expect(a.tariffa).toBeGreaterThan(0);
    expect(a.totale).toBe(a.tariffa);
    expect(a.isDeleted).toBe(false);
    expect(a.schemaVersion).toBe(1);
    expect(a.data).toBeInstanceOf(Date);
    expect(a.createdAt).toBeInstanceOf(Date);
  });

  it("applies overrides without mutating defaults", () => {
    const a = makeAttivita({ id: "x", totale: 999, ownerUid: "u9" });
    expect(a.id).toBe("x");
    expect(a.totale).toBe(999);
    expect(a.ownerUid).toBe("u9");
    expect(makeAttivita().ownerUid).not.toBe("u9");
  });

  it("returns distinct ids on successive calls", () => {
    expect(makeAttivita().id).not.toBe(makeAttivita().id);
  });

  it("does not inject undefined optional keys", () => {
    expect("ore" in makeAttivita()).toBe(false);
    expect("note" in makeAttivita()).toBe(false);
  });
});

describe("makeUser", () => {
  it("produces an approved enabled user by default", () => {
    const u = makeUser();
    expect(u.approved).toBe(true);
    expect(u.disabled).toBe(false);
    expect(u.uid).toMatch(/^usr-/);
    expect(u.schemaVersion).toBe(1);
  });

  it("applies overrides", () => {
    expect(makeUser({ approved: false }).approved).toBe(false);
  });
});

describe("makeActorContext", () => {
  it("defaults to an approved actor with an empty cap set", () => {
    const actor = makeActorContext();
    expect(actor.approved).toBe(true);
    expect(actor.caps.size).toBe(0);
  });

  it("accepts caps as an array and exposes them as a set", () => {
    const actor = makeActorContext({ caps: ["activities.create", "aziende.read"] });
    expect(actor.caps.has("activities.create")).toBe(true);
    expect(actor.caps.has("aziende.read")).toBe(true);
    expect(actor.caps.size).toBe(2);
  });

  it("accepts caps as a ReadonlySet", () => {
    const actor = makeActorContext({ caps: new Set(["audit.read"]) });
    expect(actor.caps.has("audit.read")).toBe(true);
  });
});

describe("makeAzienda", () => {
  it("derives nomeNorm from nome by default", () => {
    const az = makeAzienda({ nome: "Cascina Bella" });
    expect(az.nomeNorm).toBe("cascina bella");
    expect(az.isDeleted).toBe(false);
  });

  it("respects an explicit nomeNorm override", () => {
    expect(makeAzienda({ nomeNorm: "custom" }).nomeNorm).toBe("custom");
  });
});

describe("makeActivityType", () => {
  it("produces an active type with ordering", () => {
    const t = makeActivityType();
    expect(t.attivo).toBe(true);
    expect(typeof t.ordine).toBe("number");
  });
});

describe("makeConto", () => {
  it("produces an unpaid proforma by default", () => {
    const c = makeConto();
    expect(c.saldato).toBe(false);
    expect(c.modalita).toBe("proforma");
    expect(c.totaleConto).toBeGreaterThanOrEqual(0);
    expect(c.attivitaIds.length).toBeGreaterThan(0);
  });
});

describe("makeReminder", () => {
  it("produces an open reminder", () => {
    const r = makeReminder();
    expect(r.done).toBe(false);
    expect(r.dueAt).toBeInstanceOf(Date);
  });
});

describe("makeRole", () => {
  it("produces an unlocked role with no caps by default", () => {
    const r = makeRole();
    expect(r.locked).toBe(false);
    expect(r.capabilities).toEqual([]);
  });
});

describe("makeAllowlistEntry", () => {
  it("derives emailNorm from email", () => {
    const e = makeAllowlistEntry({ email: "Mario.Rossi@Example.IT" });
    expect(e.emailNorm).toBe("mario.rossi@example.it");
  });
});

describe("makeAuditEvent", () => {
  it("produces a plausible audit row", () => {
    const e = makeAuditEvent();
    expect(e.actorUid).toBeTruthy();
    expect(e.at).toBeInstanceOf(Date);
  });
});

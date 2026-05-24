import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryContiRepository } from "../InMemoryContiRepository.js";
import type { ActorContext } from "../../domain/entities/ActorContext.js";
import type {
  ContoEmitInput,
  ContoSaldoInput,
} from "../../domain/schemas/conto.js";

const actor: ActorContext = {
  uid: "vet-1",
  email: "vet@example.com",
  displayName: "Vet One",
  roleId: "vet",
  caps: new Set(["conti.emit", "conti.proforma", "conti.saldo"]),
  approved: true,
};

const otherActor: ActorContext = {
  uid: "vet-2",
  email: "vet2@example.com",
  displayName: "Vet Two",
  roleId: "vet",
  caps: new Set(["conti.saldo"]),
  approved: true,
};

function emitInput(
  overrides: Partial<ContoEmitInput> = {}
): ContoEmitInput {
  return {
    aziendaId: "az1",
    periodoFrom: new Date("2026-01-01T00:00:00Z"),
    periodoTo: new Date("2026-03-31T23:59:59Z"),
    modalita: "emesso",
    ...overrides,
  };
}

const denorm = (overrides: Partial<{
  aziendaNome: string;
  attivitaIds: string[];
  totaleConto: number;
}> = {}) => ({
  aziendaNome: "Cascina Verdi",
  attivitaIds: ["a1", "a2"],
  totaleConto: 250,
  ...overrides,
});

describe("InMemoryContiRepository.emit", () => {
  let repo: InMemoryContiRepository;
  beforeEach(() => {
    repo = new InMemoryContiRepository();
  });

  it("creates a conto with the input fields and denormalized data", async () => {
    const id = await repo.emit(emitInput(), denorm(), actor);
    const c = await repo.getById(id);
    expect(c?.aziendaId).toBe("az1");
    expect(c?.aziendaNome).toBe("Cascina Verdi");
    expect(c?.attivitaIds).toEqual(["a1", "a2"]);
    expect(c?.totaleConto).toBe(250);
    expect(c?.modalita).toBe("emesso");
    expect(c?.periodoFrom.toISOString()).toBe(
      "2026-01-01T00:00:00.000Z"
    );
    expect(c?.periodoTo.toISOString()).toBe(
      "2026-03-31T23:59:59.000Z"
    );
    expect(c?.schemaVersion).toBe(1);
  });

  it("defaults saldato=false and isDeleted=false", async () => {
    const id = await repo.emit(emitInput(), denorm(), actor);
    const c = await repo.getById(id);
    expect(c?.saldato).toBe(false);
    expect(c?.isDeleted).toBe(false);
  });

  it("assigns the actor as emittedBy/emittedByName", async () => {
    const id = await repo.emit(emitInput(), denorm(), actor);
    const c = await repo.getById(id);
    expect(c?.emittedBy).toBe("vet-1");
    expect(c?.emittedByName).toBe("Vet One");
  });

  it("stamps emittedAt using the supplied clock", async () => {
    const fixed = new Date("2026-04-15T08:30:00Z");
    repo = new InMemoryContiRepository(() => fixed);
    const id = await repo.emit(emitInput(), denorm(), actor);
    const c = await repo.getById(id);
    expect(c?.emittedAt.getTime()).toBe(fixed.getTime());
  });

  it("clones attivitaIds so later caller mutation doesn't leak", async () => {
    const ids = ["a1", "a2"];
    const id = await repo.emit(emitInput(), denorm({ attivitaIds: ids }), actor);
    ids.push("a3");
    const c = await repo.getById(id);
    expect(c?.attivitaIds).toEqual(["a1", "a2"]);
  });
});

describe("InMemoryContiRepository.listForAzienda", () => {
  let repo: InMemoryContiRepository;
  beforeEach(() => {
    repo = new InMemoryContiRepository();
  });

  it("returns only conti for the requested azienda", async () => {
    await repo.emit(
      emitInput({ aziendaId: "az1" }),
      denorm({ aziendaNome: "Cascina A" }),
      actor
    );
    await repo.emit(
      emitInput({ aziendaId: "az2" }),
      denorm({ aziendaNome: "Cascina B" }),
      actor
    );
    await repo.emit(
      emitInput({ aziendaId: "az1", modalita: "proforma" }),
      denorm({ aziendaNome: "Cascina A" }),
      actor
    );
    const az1 = await repo.listForAzienda("az1");
    expect(az1).toHaveLength(2);
    expect(az1.every((c) => c.aziendaId === "az1")).toBe(true);
  });

  it("returns an empty array when no conti match", async () => {
    await repo.emit(
      emitInput({ aziendaId: "az1" }),
      denorm(),
      actor
    );
    expect(await repo.listForAzienda("missing")).toEqual([]);
  });
});

describe("InMemoryContiRepository.listUnsaldati", () => {
  let repo: InMemoryContiRepository;
  beforeEach(() => {
    repo = new InMemoryContiRepository();
  });

  it("returns only modalita=emesso with saldato=false", async () => {
    const emessoUnsaldato = await repo.emit(
      emitInput({ modalita: "emesso" }),
      denorm(),
      actor
    );
    const emessoSaldato = await repo.emit(
      emitInput({ modalita: "emesso" }),
      denorm(),
      actor
    );
    await repo.saldo({ contoId: emessoSaldato }, actor);
    await repo.emit(
      emitInput({ modalita: "proforma" }),
      denorm(),
      actor
    );

    const out = await repo.listUnsaldati();
    expect(out.map((c) => c.id)).toEqual([emessoUnsaldato]);
  });

  it("excludes pro forma even when saldato=false", async () => {
    await repo.emit(
      emitInput({ modalita: "proforma" }),
      denorm(),
      actor
    );
    expect(await repo.listUnsaldati()).toEqual([]);
  });
});

describe("InMemoryContiRepository.saldo", () => {
  let repo: InMemoryContiRepository;
  beforeEach(() => {
    repo = new InMemoryContiRepository();
  });

  it("flips saldato and writes saldatoAt/saldatoBy/saldatoByName", async () => {
    const fixed = new Date("2026-04-20T12:00:00Z");
    repo = new InMemoryContiRepository(() => fixed);
    const id = await repo.emit(emitInput(), denorm(), actor);
    await repo.saldo({ contoId: id }, otherActor);
    const c = await repo.getById(id);
    expect(c?.saldato).toBe(true);
    expect(c?.saldatoAt?.getTime()).toBe(fixed.getTime());
    expect(c?.saldatoBy).toBe("vet-2");
    expect(c?.saldatoByName).toBe("Vet Two");
  });

  it("stores optional importoSaldato, metodoPagamento and note", async () => {
    const id = await repo.emit(emitInput(), denorm(), actor);
    const input: ContoSaldoInput = {
      contoId: id,
      importoSaldato: 250,
      metodoPagamento: "bonifico",
      note: "ricevuta n. 7",
    };
    await repo.saldo(input, actor);
    const c = await repo.getById(id);
    expect(c?.importoSaldato).toBe(250);
    expect(c?.metodoPagamento).toBe("bonifico");
    expect(c?.note).toBe("ricevuta n. 7");
  });

  it("leaves optional fields undefined when not supplied", async () => {
    const id = await repo.emit(emitInput(), denorm(), actor);
    await repo.saldo({ contoId: id }, actor);
    const c = await repo.getById(id);
    expect(c?.importoSaldato).toBeUndefined();
    expect(c?.metodoPagamento).toBeUndefined();
    expect(c?.note).toBeUndefined();
  });

  it("throws when the conto is already saldato", async () => {
    const id = await repo.emit(emitInput(), denorm(), actor);
    await repo.saldo({ contoId: id }, actor);
    await expect(repo.saldo({ contoId: id }, actor)).rejects.toThrow(
      /already-saldato/
    );
  });

  it("throws when the conto is a pro forma", async () => {
    const id = await repo.emit(
      emitInput({ modalita: "proforma" }),
      denorm(),
      actor
    );
    await expect(repo.saldo({ contoId: id }, actor)).rejects.toThrow(
      /only-emesso-can-be-saldato/
    );
  });

  it("throws when the conto does not exist", async () => {
    await expect(
      repo.saldo({ contoId: "missing" }, actor)
    ).rejects.toThrow(/not-found/);
  });
});

describe("InMemoryContiRepository.annulla", () => {
  let repo: InMemoryContiRepository;
  beforeEach(() => {
    repo = new InMemoryContiRepository();
  });

  it("soft-deletes the conto setting isDeleted, deletedAt and deletedBy", async () => {
    const fixed = new Date("2026-04-22T09:00:00Z");
    repo = new InMemoryContiRepository(() => fixed);
    const id = await repo.emit(emitInput(), denorm(), actor);
    await repo.annulla(id, otherActor);
    // Direct map access via getById returns null for deleted; assert via list:
    expect(await repo.getById(id)).toBeNull();
    const all = await repo.list();
    expect(all).toEqual([]);
  });

  it("is a no-op when the conto is already deleted", async () => {
    const id = await repo.emit(emitInput(), denorm(), actor);
    await repo.annulla(id, actor);
    await expect(repo.annulla(id, actor)).resolves.toBeUndefined();
    expect(await repo.getById(id)).toBeNull();
  });

  it("is a no-op when the conto does not exist", async () => {
    await expect(repo.annulla("missing", actor)).resolves.toBeUndefined();
  });
});

describe("InMemoryContiRepository soft-delete visibility", () => {
  let repo: InMemoryContiRepository;
  beforeEach(() => {
    repo = new InMemoryContiRepository();
  });

  it("getById returns null for soft-deleted conti", async () => {
    const id = await repo.emit(emitInput(), denorm(), actor);
    await repo.annulla(id, actor);
    expect(await repo.getById(id)).toBeNull();
  });

  it("list excludes soft-deleted conti", async () => {
    const keep = await repo.emit(emitInput(), denorm(), actor);
    const drop = await repo.emit(emitInput(), denorm(), actor);
    await repo.annulla(drop, actor);
    const all = await repo.list();
    expect(all.map((c) => c.id)).toEqual([keep]);
  });

  it("listForAzienda excludes soft-deleted conti", async () => {
    await repo.emit(emitInput({ aziendaId: "az1" }), denorm(), actor);
    const toDelete = await repo.emit(
      emitInput({ aziendaId: "az1" }),
      denorm(),
      actor
    );
    await repo.annulla(toDelete, actor);
    expect(await repo.listForAzienda("az1")).toHaveLength(1);
  });

  it("listUnsaldati excludes soft-deleted conti", async () => {
    const toDelete = await repo.emit(
      emitInput({ modalita: "emesso" }),
      denorm(),
      actor
    );
    await repo.annulla(toDelete, actor);
    expect(await repo.listUnsaldati()).toEqual([]);
  });

  it("list sorts by emittedAt descending (most recent first)", async () => {
    let now = new Date("2026-01-01T00:00:00Z").getTime();
    const tickRepo = new InMemoryContiRepository(() => {
      const d = new Date(now);
      now += 1_000;
      return d;
    });
    const first = await tickRepo.emit(emitInput(), denorm(), actor);
    const second = await tickRepo.emit(emitInput(), denorm(), actor);
    const third = await tickRepo.emit(emitInput(), denorm(), actor);
    const out = await tickRepo.list();
    expect(out.map((c) => c.id)).toEqual([third, second, first]);
  });
});

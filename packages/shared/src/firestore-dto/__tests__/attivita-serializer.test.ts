import { describe, expect, it } from "vitest";
import {
  attivitaDtoSchema,
  buildAttivitaCreateDoc,
  buildAttivitaSoftDeletePatch,
  buildAttivitaUpdatePatch,
  parseAttivita,
} from "../attivita.js";
import type { SerializerStampDeps } from "../_shared.js";
import type { AttivitaInput } from "../../domain/schemas/attivita.js";
import { makeActorContext, makeAttivita } from "../../testing/factories.js";

const actor = makeActorContext({
  uid: "vet-1",
  email: "vet@example.it",
  displayName: "Vet One",
  caps: ["activities.create"],
});

const denorm = { aziendaNome: "Cascina Verdi", tipoNome: "Visita" };

const baseInput: AttivitaInput = {
  data: new Date("2026-03-02T09:00:00.000Z"),
  aziendaId: "az-1",
  tipoId: "tipo-visita",
  oraria: false,
  adElemento: false,
  tariffa: 50,
};

class TsStamp {
  constructor(readonly date: Date) {}
  toDate() {
    return this.date;
  }
}
class ServerStamp {
  constructor(readonly at: Date) {}
  toDate() {
    return this.at;
  }
}
class DeleteSentinel {}

const now = new Date("2026-04-15T08:30:00.000Z");
const deps: SerializerStampDeps<TsStamp, ServerStamp> = {
  fromDate: (d) => new TsStamp(d),
  serverTimestamp: () => new ServerStamp(now),
};
const updateDeps = { ...deps, deleteField: () => new DeleteSentinel() };

describe("buildAttivitaCreateDoc", () => {
  it("takes ownership from the actor, never the input", () => {
    const payload = buildAttivitaCreateDoc({ input: baseInput, denorm, actor }, deps);
    expect(payload.ownerUid).toBe("vet-1");
    expect(payload.ownerEmail).toBe("vet@example.it");
    expect(payload.ownerName).toBe("Vet One");
  });

  it("forces isDeleted=false and schemaVersion=1 on create", () => {
    const payload = buildAttivitaCreateDoc({ input: baseInput, denorm, actor }, deps);
    expect(payload.isDeleted).toBe(false);
    expect(payload.schemaVersion).toBe(1);
  });

  it("denormalizes aziendaNome and tipoNome from denorm", () => {
    const payload = buildAttivitaCreateDoc({ input: baseInput, denorm, actor }, deps);
    expect(payload.aziendaNome).toBe("Cascina Verdi");
    expect(payload.tipoNome).toBe("Visita");
  });

  it("computes totale for a flat-rate entry", () => {
    const payload = buildAttivitaCreateDoc({ input: baseInput, denorm, actor }, deps);
    expect(payload.totale).toBe(50);
  });

  it("computes totale = tariffa * ore for an hourly entry", () => {
    const input: AttivitaInput = { ...baseInput, oraria: true, ore: 3 };
    const payload = buildAttivitaCreateDoc({ input, denorm, actor }, deps);
    expect(payload.totale).toBe(150);
    expect(payload.ore).toBe(3);
  });

  it("omits optional keys when absent (no undefined leakage)", () => {
    const payload = buildAttivitaCreateDoc({ input: baseInput, denorm, actor }, deps);
    expect("ore" in payload).toBe(false);
    expect("elementi" in payload).toBe(false);
    expect("note" in payload).toBe(false);
  });

  it("server-stamps createdAt and updatedAt", () => {
    const payload = buildAttivitaCreateDoc({ input: baseInput, denorm, actor }, deps);
    expect(payload.createdAt).toBeInstanceOf(ServerStamp);
    expect(payload.updatedAt).toBeInstanceOf(ServerStamp);
  });

  it("round-trips through the strict DTO schema and parseAttivita", () => {
    const payload = buildAttivitaCreateDoc({ input: baseInput, denorm, actor }, deps);
    expect(attivitaDtoSchema.safeParse(payload).success).toBe(true);
    const entity = parseAttivita("att-1", payload);
    expect(entity.id).toBe("att-1");
    expect(entity.ownerUid).toBe("vet-1");
    expect(entity.totale).toBe(50);
    expect(entity.createdAt.getTime()).toBe(now.getTime());
  });

  it("produces a payload rejected by .strict() when an extra key is added", () => {
    const payload = buildAttivitaCreateDoc({ input: baseInput, denorm, actor }, deps);
    expect(
      attivitaDtoSchema.safeParse({ ...payload, ownerRole: "admin" }).success
    ).toBe(false);
  });
});

describe("buildAttivitaUpdatePatch", () => {
  it("records the updating actor as updatedBy", () => {
    const patch = buildAttivitaUpdatePatch(
      { input: baseInput, denorm, actor },
      updateDeps
    );
    expect(patch.updatedBy).toBe("vet-1");
    expect(patch.updatedByName).toBe("Vet One");
  });

  it("clears cleared optionals with the delete sentinel", () => {
    const patch = buildAttivitaUpdatePatch(
      { input: baseInput, denorm, actor },
      updateDeps
    );
    expect(patch.ore).toBeInstanceOf(DeleteSentinel);
    expect(patch.elementi).toBeInstanceOf(DeleteSentinel);
    expect(patch.note).toBeInstanceOf(DeleteSentinel);
  });

  it("keeps provided optionals as values, not sentinels", () => {
    const input: AttivitaInput = {
      ...baseInput,
      oraria: true,
      ore: 2,
      note: "controllo mandria",
    };
    const patch = buildAttivitaUpdatePatch({ input, denorm, actor }, updateDeps);
    expect(patch.ore).toBe(2);
    expect(patch.note).toBe("controllo mandria");
    expect(patch.totale).toBe(100);
  });

  it("does not touch ownership fields on update", () => {
    const patch = buildAttivitaUpdatePatch(
      { input: baseInput, denorm, actor },
      updateDeps
    );
    expect("ownerUid" in patch).toBe(false);
    expect("createdAt" in patch).toBe(false);
  });
});

describe("buildAttivitaSoftDeletePatch", () => {
  it("marks the doc deleted and stamps the deleting actor", () => {
    const patch = buildAttivitaSoftDeletePatch({ actor }, deps);
    expect(patch.isDeleted).toBe(true);
    expect(patch.deletedBy).toBe("vet-1");
    expect(patch.deletedAt).toBeInstanceOf(ServerStamp);
    expect(patch.updatedAt).toBeInstanceOf(ServerStamp);
  });
});

describe("parseAttivita", () => {
  it("rejects a document missing the required ownerUid", () => {
    const valid = buildAttivitaCreateDoc({ input: baseInput, denorm, actor }, deps);
    const { ownerUid: _omit, ...withoutOwner } = valid as Record<string, unknown>;
    void _omit;
    expect(() => parseAttivita("x", withoutOwner)).toThrow();
  });

  it("rejects a tariffa with more than two decimals", () => {
    const valid = buildAttivitaCreateDoc({ input: baseInput, denorm, actor }, deps);
    expect(() => parseAttivita("x", { ...valid, tariffa: 50.123 })).toThrow();
  });

  it("rejects an oversize note beyond the cap", () => {
    const valid = buildAttivitaCreateDoc({ input: baseInput, denorm, actor }, deps);
    expect(() =>
      parseAttivita("x", { ...valid, note: "n".repeat(2001) })
    ).toThrow();
  });

  it("accepts a Date in place of a Firestore Timestamp for stamped fields", () => {
    const { id: _docId, ...doc } = makeAttivita({ ownerUid: "vet-9" });
    void _docId;
    const entity = parseAttivita("att-9", doc);
    expect(entity.id).toBe("att-9");
    expect(entity.ownerUid).toBe("vet-9");
    expect(entity.data).toBeInstanceOf(Date);
  });
});

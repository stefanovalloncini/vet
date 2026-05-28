import { describe, expect, it } from "vitest";
import {
  aziendaDtoSchema,
  buildAziendaCreateDoc,
  buildAziendaSoftDeletePatch,
  buildAziendaUpdatePatch,
  parseAzienda,
} from "../azienda.js";
import type { AziendaInput } from "../../domain/schemas/azienda.js";
import { makeActorContext } from "../../testing/factories.js";

const actor = makeActorContext({
  uid: "vet-1",
  displayName: "Vet One",
  caps: ["aziende.create"],
});

const baseInput: AziendaInput = { nome: "Cascina  San   Marco" };

class ServerStamp {
  constructor(readonly at: Date) {}
  toDate() {
    return this.at;
  }
}
class DeleteSentinel {}

const now = new Date("2026-04-15T08:30:00.000Z");
const deps = { serverTimestamp: () => new ServerStamp(now) };
const updateDeps = { ...deps, deleteField: () => new DeleteSentinel() };

describe("buildAziendaCreateDoc", () => {
  it("takes createdBy/updatedBy from the actor", () => {
    const payload = buildAziendaCreateDoc({ input: baseInput, actor }, deps);
    expect(payload.createdBy).toBe("vet-1");
    expect(payload.updatedBy).toBe("vet-1");
    expect(payload.createdByName).toBe("Vet One");
    expect(payload.updatedByName).toBe("Vet One");
  });

  it("normalizes nomeNorm (trim, lowercase, collapse spaces)", () => {
    const payload = buildAziendaCreateDoc({ input: baseInput, actor }, deps);
    expect(payload.nome).toBe("Cascina  San   Marco");
    expect(payload.nomeNorm).toBe("cascina san marco");
  });

  it("forces isDeleted=false and schemaVersion=1", () => {
    const payload = buildAziendaCreateDoc({ input: baseInput, actor }, deps);
    expect(payload.isDeleted).toBe(false);
    expect(payload.schemaVersion).toBe(1);
  });

  it("omits optional keys when absent", () => {
    const payload = buildAziendaCreateDoc({ input: baseInput, actor }, deps);
    expect("piva" in payload).toBe(false);
    expect("emailFatturazione" in payload).toBe(false);
    expect("numeroCapi" in payload).toBe(false);
  });

  it("carries through provided optional fields", () => {
    const input: AziendaInput = {
      nome: "Cascina Verdi",
      piva: "12345678901",
      numeroCapi: 120,
      emailFatturazione: "fatture@cascina.it",
    };
    const payload = buildAziendaCreateDoc({ input, actor }, deps);
    expect(payload.piva).toBe("12345678901");
    expect(payload.numeroCapi).toBe(120);
    expect(payload.emailFatturazione).toBe("fatture@cascina.it");
  });

  it("round-trips through the strict DTO schema and parseAzienda", () => {
    const payload = buildAziendaCreateDoc({ input: baseInput, actor }, deps);
    expect(aziendaDtoSchema.safeParse(payload).success).toBe(true);
    const entity = parseAzienda("az-1", payload);
    expect(entity.id).toBe("az-1");
    expect(entity.createdBy).toBe("vet-1");
    expect(entity.nomeNorm).toBe("cascina san marco");
    expect(entity.createdAt.getTime()).toBe(now.getTime());
  });

  it("is rejected by .strict() when an extra key is added", () => {
    const payload = buildAziendaCreateDoc({ input: baseInput, actor }, deps);
    expect(
      aziendaDtoSchema.safeParse({ ...payload, ghost: true }).success
    ).toBe(false);
  });
});

describe("buildAziendaUpdatePatch", () => {
  it("records the updating actor and never createdBy", () => {
    const patch = buildAziendaUpdatePatch({ input: baseInput, actor }, updateDeps);
    expect(patch.updatedBy).toBe("vet-1");
    expect(patch.updatedByName).toBe("Vet One");
    expect("createdBy" in patch).toBe(false);
  });

  it("clears omitted optionals with the delete sentinel", () => {
    const patch = buildAziendaUpdatePatch({ input: baseInput, actor }, updateDeps);
    expect(patch.piva).toBeInstanceOf(DeleteSentinel);
    expect(patch.numeroCapi).toBeInstanceOf(DeleteSentinel);
    expect(patch.note).toBeInstanceOf(DeleteSentinel);
  });

  it("keeps provided optionals as values", () => {
    const input: AziendaInput = { nome: "Cascina Verdi", telefono: "+39 333 1112233" };
    const patch = buildAziendaUpdatePatch({ input, actor }, updateDeps);
    expect(patch.telefono).toBe("+39 333 1112233");
  });
});

describe("buildAziendaSoftDeletePatch", () => {
  it("marks deleted and stamps the deleting actor", () => {
    const patch = buildAziendaSoftDeletePatch({ actor }, deps);
    expect(patch.isDeleted).toBe(true);
    expect(patch.updatedBy).toBe("vet-1");
    expect(patch.deletedAt).toBeInstanceOf(ServerStamp);
  });
});

describe("parseAzienda", () => {
  it("rejects a document missing createdBy", () => {
    const valid = buildAziendaCreateDoc({ input: baseInput, actor }, deps);
    const { createdBy: _omit, ...without } = valid as Record<string, unknown>;
    void _omit;
    expect(() => parseAzienda("x", without)).toThrow();
  });

  it("rejects an invalid piva (not 11 digits)", () => {
    const valid = buildAziendaCreateDoc({ input: baseInput, actor }, deps);
    expect(() => parseAzienda("x", { ...valid, piva: "123" })).toThrow();
  });

  it("rejects an oversize note beyond the cap", () => {
    const valid = buildAziendaCreateDoc({ input: baseInput, actor }, deps);
    expect(() =>
      parseAzienda("x", { ...valid, note: "n".repeat(1001) })
    ).toThrow();
  });
});

describe("azienda serializer — armadiettoCanoneAnnuo", () => {
  it("includes armadiettoCanoneAnnuo on create when present", () => {
    const input: AziendaInput = { nome: "Cascina", armadiettoCanoneAnnuo: 800 };
    const payload = buildAziendaCreateDoc({ input, actor }, deps);
    expect(payload.armadiettoCanoneAnnuo).toBe(800);
  });

  it("omits armadiettoCanoneAnnuo on create when absent", () => {
    const payload = buildAziendaCreateDoc(
      { input: { nome: "Cascina" }, actor },
      deps
    );
    expect("armadiettoCanoneAnnuo" in payload).toBe(false);
  });

  it("parses armadiettoCanoneAnnuo back into the entity", () => {
    const payload = buildAziendaCreateDoc(
      { input: { nome: "Cascina", armadiettoCanoneAnnuo: 800 }, actor },
      deps
    );
    const entity = parseAzienda("az-1", payload);
    expect(entity.armadiettoCanoneAnnuo).toBe(800);
  });

  it("sets armadiettoCanoneAnnuo on update when present", () => {
    const patch = buildAziendaUpdatePatch(
      { input: { nome: "Cascina", armadiettoCanoneAnnuo: 900 }, actor },
      updateDeps
    );
    expect(patch.armadiettoCanoneAnnuo).toBe(900);
  });

  it("clears armadiettoCanoneAnnuo via deleteField when absent on update", () => {
    const patch = buildAziendaUpdatePatch(
      { input: { nome: "Cascina" }, actor },
      updateDeps
    );
    expect(patch.armadiettoCanoneAnnuo).toBeInstanceOf(DeleteSentinel);
  });
});

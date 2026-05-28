import { describe, expect, it } from "vitest";
import {
  buildAziendaCreateDoc,
  buildAziendaUpdatePatch,
  parseAzienda,
} from "../azienda.js";
import type { ActorContext } from "../../domain/entities/ActorContext.js";
import type { AziendaInput } from "../../domain/schemas/azienda.js";

const actor: ActorContext = {
  uid: "vet-1",
  email: "vet@example.com",
  displayName: "Vet One",
  roleId: "vet",
  caps: new Set(),
  approved: true,
};

class ServerStamp {
  constructor(readonly at: Date) {}
  toDate() {
    return this.at;
  }
}
class DeleteSentinel {}

const now = new Date("2026-04-15T08:30:00Z");
const createDeps = { serverTimestamp: () => new ServerStamp(now) };
const updateDeps = {
  serverTimestamp: () => new ServerStamp(now),
  deleteField: () => new DeleteSentinel(),
};

describe("azienda serializer — armadiettoCanoneAnnuo", () => {
  it("includes armadiettoCanoneAnnuo on create when present", () => {
    const input: AziendaInput = { nome: "Cascina", armadiettoCanoneAnnuo: 800 };
    const doc = buildAziendaCreateDoc({ input, actor }, createDeps);
    expect(doc.armadiettoCanoneAnnuo).toBe(800);
  });

  it("omits armadiettoCanoneAnnuo on create when absent", () => {
    const doc = buildAziendaCreateDoc(
      { input: { nome: "Cascina" }, actor },
      createDeps
    );
    expect("armadiettoCanoneAnnuo" in doc).toBe(false);
  });

  it("parses armadiettoCanoneAnnuo back into the entity", () => {
    const doc = buildAziendaCreateDoc(
      { input: { nome: "Cascina", armadiettoCanoneAnnuo: 800 }, actor },
      createDeps
    );
    const entity = parseAzienda("az-1", doc);
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

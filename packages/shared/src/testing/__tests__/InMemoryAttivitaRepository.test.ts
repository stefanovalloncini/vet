import { describe, it, expect } from "vitest";
import { InMemoryAttivitaRepository } from "../InMemoryAttivitaRepository.js";
import type { AttivitaInput } from "../../domain/schemas/attivita.js";

const denorm = { aziendaNome: "Cascina", tipoNome: "Visita" };
const input: AttivitaInput = {
  data: new Date("2026-03-01T00:00:00.000Z"),
  aziendaId: "az-1",
  tipoId: "tipo-1",
  oraria: false,
  adElemento: false,
  tariffa: 50,
};
const owner = { uid: "owner", email: "o@x.com", displayName: "Owner" };
const editor = { uid: "editor", email: "e@x.com", displayName: "Editor B" };

describe("InMemoryAttivitaRepository.hasAnyActive", () => {
  it("is false when empty and true once a non-deleted attivita exists", async () => {
    const repo = new InMemoryAttivitaRepository();
    expect(await repo.hasAnyActive()).toBe(false);
    const a = await repo.create(input, denorm, owner);
    expect(await repo.hasAnyActive()).toBe(true);
    await repo.softDelete(a.id, owner);
    expect(await repo.hasAnyActive()).toBe(false);
  });
});

describe("InMemoryAttivitaRepository editor tracking", () => {
  it("update() records the editor as updatedBy/updatedByName (prod fidelity)", async () => {
    const repo = new InMemoryAttivitaRepository();
    const a = await repo.create(input, denorm, owner);
    await repo.update(a.id, input, denorm, editor);
    const after = await repo.getById(a.id);
    expect(after?.updatedBy).toBe("editor");
    expect(after?.updatedByName).toBe("Editor B");
  });
});

describe("InMemoryAttivitaRepository.anonymizeOwnerReferences", () => {
  it("anonymizes editor refs without touching the owner", async () => {
    const repo = new InMemoryAttivitaRepository();
    const a = await repo.create(input, denorm, owner);
    await repo.update(a.id, input, denorm, editor);

    const count = await repo.anonymizeOwnerReferences("editor", {
      anonUid: "deleted-user",
      anonName: "—",
    });

    expect(count).toBe(1);
    const after = await repo.getById(a.id);
    expect(after?.updatedBy).toBe("deleted-user");
    expect(after?.updatedByName).toBe("—");
    expect(after?.ownerUid).toBe("owner");
    expect(after?.ownerName).toBe("Owner");
  });

  it("leaves docs the user never edited untouched", async () => {
    const repo = new InMemoryAttivitaRepository();
    await repo.create(input, denorm, owner);
    const count = await repo.anonymizeOwnerReferences("editor", {
      anonUid: "deleted-user",
      anonName: "—",
    });
    expect(count).toBe(0);
  });
});

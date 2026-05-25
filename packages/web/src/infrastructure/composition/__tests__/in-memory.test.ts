import { describe, expect, it } from "vitest";
import { createInMemoryRepositories } from "../in-memory";
import type { ActorContext } from "@vet/shared";

const actor: ActorContext = {
  uid: "vet-1",
  email: "vet@example.com",
  displayName: "Vet One",
  roleId: "vet",
  caps: new Set(),
  approved: true,
};

describe("in-memory Repositories.run", () => {
  it("invokes work with the tx surface and returns its result", async () => {
    const repos = createInMemoryRepositories();
    const result = await repos.run(async (tx) => {
      const azienda = await tx.aziende.create({ nome: "Cascina A" }, actor);
      return azienda.id;
    });
    expect(typeof result).toBe("string");
    const list = await repos.aziende.list();
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(result);
  });

  it("runs work sequentially with no rollback semantics on error", async () => {
    const repos = createInMemoryRepositories();
    await expect(
      repos.run(async (tx) => {
        await tx.aziende.create({ nome: "Persisted" }, actor);
        throw new Error("boom");
      })
    ).rejects.toThrow(/boom/);
    const list = await repos.aziende.list();
    expect(list).toHaveLength(1);
    expect(list[0]?.nome).toBe("Persisted");
  });

  it("exposes the same repo instances inside and outside the tx", async () => {
    const repos = createInMemoryRepositories();
    await repos.run(async (tx) => {
      expect(tx.aziende).toBe(repos.aziende);
      expect(tx.audit).toBe(repos.audit);
    });
  });
});

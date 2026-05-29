import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActorContext, AziendaInput } from "@vet/shared";

const h = vi.hoisted(() => ({
  setDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({ id: "new-id" })),
  collection: vi.fn(() => ({})),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  setDoc: h.setDoc,
  updateDoc: h.updateDoc,
  serverTimestamp: vi.fn(() => "SERVER_TS"),
  deleteField: vi.fn(() => "DELETE_FIELD"),
}));

import { FirestoreAziendeRepository } from "../FirestoreAziendeRepository";

const actor: ActorContext = {
  uid: "u1",
  email: "vet@example.com",
  displayName: "Vet One",
  roleId: "vet",
  caps: new Set(["aziende.create", "aziende.update"]),
  approved: true,
};
const db = {} as never;
const validInput: AziendaInput = { nome: "Allevamento Rossi" };

describe("FirestoreAziendeRepository input validation", () => {
  beforeEach(() => {
    h.setDoc.mockClear();
    h.updateDoc.mockClear();
  });

  it("create rejects an unknown extra field and does not write", async () => {
    const repo = new FirestoreAziendeRepository(db);
    await expect(
      repo.create({ ...validInput, bogus: true } as never, actor)
    ).rejects.toThrow();
    expect(h.setDoc).not.toHaveBeenCalled();
  });

  it("create rejects an empty nome and does not write", async () => {
    const repo = new FirestoreAziendeRepository(db);
    await expect(repo.create({ nome: "" } as never, actor)).rejects.toThrow();
    expect(h.setDoc).not.toHaveBeenCalled();
  });

  it("update rejects a negative numeroCapi and does not write", async () => {
    const repo = new FirestoreAziendeRepository(db);
    await expect(
      repo.update("az1", { nome: "Ok", numeroCapi: -5 } as never, actor)
    ).rejects.toThrow();
    expect(h.updateDoc).not.toHaveBeenCalled();
  });

  it("update writes for valid input", async () => {
    const repo = new FirestoreAziendeRepository(db);
    await repo.update("az1", validInput, actor);
    expect(h.updateDoc).toHaveBeenCalledTimes(1);
  });
});

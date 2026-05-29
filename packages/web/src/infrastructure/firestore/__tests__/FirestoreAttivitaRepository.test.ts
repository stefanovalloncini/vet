import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActorContext, AttivitaInput } from "@vet/shared";

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
  orderBy: vi.fn(),
  limit: vi.fn(),
  setDoc: h.setDoc,
  updateDoc: h.updateDoc,
  serverTimestamp: vi.fn(() => "SERVER_TS"),
  deleteField: vi.fn(() => "DELETE_FIELD"),
  Timestamp: { fromDate: vi.fn((d: Date) => ({ __ts: d.getTime() })) },
}));

import { FirestoreAttivitaRepository } from "../FirestoreAttivitaRepository";

const actor: ActorContext = {
  uid: "u1",
  email: "vet@example.com",
  displayName: "Vet One",
  roleId: "vet",
  caps: new Set(["activities.create", "activities.update.own"]),
  approved: true,
};
const db = {} as never;
const denorm = { aziendaNome: "Allevamento Rossi", tipoNome: "Visita" };
const validInput: AttivitaInput = {
  data: new Date("2026-05-01T00:00:00Z"),
  aziendaId: "az1",
  tipoId: "tipo1",
  oraria: false,
  adElemento: false,
  tariffa: 80,
};

describe("FirestoreAttivitaRepository input validation", () => {
  beforeEach(() => {
    h.setDoc.mockClear();
    h.updateDoc.mockClear();
  });

  it("create rejects an unknown extra field and does not write", async () => {
    const repo = new FirestoreAttivitaRepository(db);
    await expect(
      repo.create({ ...validInput, bogus: true } as never, denorm, actor)
    ).rejects.toThrow();
    expect(h.setDoc).not.toHaveBeenCalled();
  });

  it("create rejects oraria=true without ore and does not write", async () => {
    const repo = new FirestoreAttivitaRepository(db);
    await expect(
      repo.create({ ...validInput, oraria: true } as never, denorm, actor)
    ).rejects.toThrow();
    expect(h.setDoc).not.toHaveBeenCalled();
  });

  it("update rejects a tariffa with more than two decimals and does not write", async () => {
    const repo = new FirestoreAttivitaRepository(db);
    await expect(
      repo.update("a1", { ...validInput, tariffa: 80.123 } as never, denorm, actor)
    ).rejects.toThrow();
    expect(h.updateDoc).not.toHaveBeenCalled();
  });

  it("update writes for valid input", async () => {
    const repo = new FirestoreAttivitaRepository(db);
    await repo.update("a1", validInput, denorm, actor);
    expect(h.updateDoc).toHaveBeenCalledTimes(1);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActivityTypeInput } from "@vet/shared";

const h = vi.hoisted(() => ({
  setDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({ id: "t1" })),
  collection: vi.fn(() => ({})),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
  getDocs: vi.fn(),
  setDoc: h.setDoc,
  updateDoc: h.updateDoc,
  serverTimestamp: vi.fn(() => "SERVER_TS"),
  deleteField: vi.fn(() => "DELETE_FIELD"),
  query: vi.fn(),
  orderBy: vi.fn(),
  where: vi.fn(),
  Timestamp: { fromDate: vi.fn((d: Date) => ({ __ts: d.getTime() })) },
}));

import { FirestoreActivityTypesRepository } from "../FirestoreActivityTypesRepository";

const db = {} as never;
const validInput: ActivityTypeInput = {
  nome: "Visita generica",
  ordine: 1,
  attivo: true,
};

describe("FirestoreActivityTypesRepository input validation", () => {
  beforeEach(() => {
    h.setDoc.mockClear();
    h.updateDoc.mockClear();
  });

  it("upsert rejects an unknown extra field and does not write", async () => {
    const repo = new FirestoreActivityTypesRepository(db);
    await expect(
      repo.upsert("t1", { ...validInput, bogus: true } as never)
    ).rejects.toThrow();
    expect(h.setDoc).not.toHaveBeenCalled();
    expect(h.updateDoc).not.toHaveBeenCalled();
  });

  it("upsert rejects a negative ordine and does not write", async () => {
    const repo = new FirestoreActivityTypesRepository(db);
    await expect(
      repo.upsert("t1", { ...validInput, ordine: -1 } as never)
    ).rejects.toThrow();
    expect(h.setDoc).not.toHaveBeenCalled();
  });

  it("upsert creates a new type (setDoc) for valid input", async () => {
    const repo = new FirestoreActivityTypesRepository(db);
    await repo.upsert("t1", validInput);
    expect(h.setDoc).toHaveBeenCalledTimes(1);
  });
});

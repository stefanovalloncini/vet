import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActorContext, ReminderInput } from "@vet/shared";

const h = vi.hoisted(() => ({ setDoc: vi.fn(() => Promise.resolve()) }));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({ id: "new-id" })),
  collection: vi.fn(() => ({})),
  getDocs: vi.fn(),
  setDoc: h.setDoc,
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(() => "SERVER_TS"),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  Timestamp: { fromDate: vi.fn((d: Date) => ({ __ts: d.getTime() })) },
}));

import { FirestoreRemindersRepository } from "../FirestoreRemindersRepository";

const actor: ActorContext = {
  uid: "u1",
  email: "vet@example.com",
  displayName: "Vet One",
  roleId: "vet",
  caps: new Set(["reminders.create"]),
  approved: true,
};
const db = {} as never;
const denorm = { aziendaNome: "Allevamento Rossi" };
const validInput: ReminderInput = {
  aziendaId: "az1",
  titolo: "Richiamo vaccini",
  dueAt: new Date("2026-06-01T00:00:00Z"),
};

describe("FirestoreRemindersRepository input validation", () => {
  beforeEach(() => h.setDoc.mockClear());

  it("create rejects an unknown extra field and does not write", async () => {
    const repo = new FirestoreRemindersRepository(db);
    await expect(
      repo.create({ ...validInput, bogus: true } as never, denorm, actor)
    ).rejects.toThrow();
    expect(h.setDoc).not.toHaveBeenCalled();
  });

  it("create rejects an empty titolo and does not write", async () => {
    const repo = new FirestoreRemindersRepository(db);
    await expect(
      repo.create({ ...validInput, titolo: "" } as never, denorm, actor)
    ).rejects.toThrow();
    expect(h.setDoc).not.toHaveBeenCalled();
  });
});

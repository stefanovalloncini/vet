import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActorContext } from "@vet/shared";

const h = vi.hoisted(() => ({
  setDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({ id: "new-id" })),
  collection: vi.fn(() => ({})),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: h.setDoc,
  updateDoc: h.updateDoc,
  serverTimestamp: vi.fn(() => "SERVER_TS"),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  Timestamp: { fromDate: vi.fn((d: Date) => ({ __ts: d.getTime() })) },
}));

import { FirestoreContiRepository } from "../FirestoreContiRepository";

const actor: ActorContext = {
  uid: "u1",
  email: "vet@example.com",
  displayName: "Vet One",
  roleId: "vet",
  caps: new Set(["conti.emit", "conti.saldo"]),
  approved: true,
};
const db = {} as never;

describe("FirestoreContiRepository input validation", () => {
  beforeEach(() => {
    h.setDoc.mockClear();
    h.updateDoc.mockClear();
  });

  it("emit rejects an inverted period and does not write", async () => {
    const repo = new FirestoreContiRepository(db);
    await expect(
      repo.emit(
        {
          aziendaId: "a1",
          periodoFrom: new Date("2026-05-31T00:00:00Z"),
          periodoTo: new Date("2026-05-01T00:00:00Z"),
          modalita: "emesso",
        },
        { aziendaNome: "Az", attivitaIds: [], totaleConto: 10 },
        actor
      )
    ).rejects.toThrow();
    expect(h.setDoc).not.toHaveBeenCalled();
  });

  it("saldo rejects an unknown extra field and does not write", async () => {
    const repo = new FirestoreContiRepository(db);
    await expect(
      repo.saldo({ contoId: "c1", bogus: true } as never, actor)
    ).rejects.toThrow();
    expect(h.updateDoc).not.toHaveBeenCalled();
  });

  it("emit writes once for valid input", async () => {
    const repo = new FirestoreContiRepository(db);
    const id = await repo.emit(
      {
        aziendaId: "a1",
        periodoFrom: new Date("2026-05-01T00:00:00Z"),
        periodoTo: new Date("2026-05-31T00:00:00Z"),
        modalita: "proforma",
      },
      { aziendaNome: "Az", attivitaIds: ["x"], totaleConto: 10 },
      actor
    );
    expect(id).toBe("new-id");
    expect(h.setDoc).toHaveBeenCalledTimes(1);
  });
});

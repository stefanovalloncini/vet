import { describe, it, expect } from "vitest";
import type { Attivita, Conto } from "@vet/shared";
import { collectBilledAttivitaIds, hasUnbilledAttivita } from "../unbilled";

function att(id: string, isoDate: string): Attivita {
  return { id, data: new Date(isoDate), isDeleted: false } as unknown as Attivita;
}

function conto(p: {
  attivitaIds: string[];
  emittedAt: string;
  modalita?: "emesso" | "proforma";
  isDeleted?: boolean;
}): Conto {
  return {
    modalita: p.modalita ?? "emesso",
    isDeleted: p.isDeleted ?? false,
    attivitaIds: p.attivitaIds,
    emittedAt: new Date(p.emittedAt),
  } as unknown as Conto;
}

describe("collectBilledAttivitaIds", () => {
  it("collects ids only from non-deleted emesso conti", () => {
    const billed = collectBilledAttivitaIds([
      conto({ attivitaIds: ["a1"], emittedAt: "2026-05-05T09:00:00Z" }),
      conto({
        attivitaIds: ["a2"],
        emittedAt: "2026-05-05T09:00:00Z",
        modalita: "proforma",
      }),
      conto({
        attivitaIds: ["a3"],
        emittedAt: "2026-05-05T09:00:00Z",
        isDeleted: true,
      }),
    ]);
    expect(billed.has("a1")).toBe(true);
    expect(billed.has("a2")).toBe(false);
    expect(billed.has("a3")).toBe(false);
  });
});

describe("hasUnbilledAttivita", () => {
  it("flags an activity not on any emesso conto, even if dated before the last emission", () => {
    // Conto emitted 5 May (for April) does not cover a 2 May activity. The old
    // emittedAt-vs-data heuristic wrongly treated it as billed; the id set does not.
    const billed = collectBilledAttivitaIds([
      conto({ attivitaIds: ["a-april"], emittedAt: "2026-05-05T09:00:00Z" }),
    ]);
    const list = [att("a-2-may", "2026-05-02T00:00:00")];
    expect(hasUnbilledAttivita(list, billed)).toBe(true);
  });

  it("returns false when every activity is already on an emesso conto", () => {
    const billed = collectBilledAttivitaIds([
      conto({ attivitaIds: ["a1", "a2"], emittedAt: "2026-05-05T09:00:00Z" }),
    ]);
    const list = [att("a1", "2026-04-10T00:00:00"), att("a2", "2026-05-02T00:00:00")];
    expect(hasUnbilledAttivita(list, billed)).toBe(false);
  });

  it("returns false for an empty or undefined list", () => {
    expect(hasUnbilledAttivita([], new Set())).toBe(false);
    expect(hasUnbilledAttivita(undefined, new Set())).toBe(false);
  });
});

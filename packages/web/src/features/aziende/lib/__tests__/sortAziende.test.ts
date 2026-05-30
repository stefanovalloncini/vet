import { describe, expect, it } from "vitest";
import type { Azienda } from "@vet/shared";
import { sortAziendeByPinned } from "../sortAziende";

function az(id: string, nomeNorm: string): Azienda {
  return { id, nomeNorm } as unknown as Azienda;
}

describe("sortAziendeByPinned", () => {
  it("floats pinned aziende to the top regardless of name", () => {
    const items = [az("a", "alfa"), az("z", "zeta")];
    const out = sortAziendeByPinned(items, new Set(["z"]));
    expect(out.map((a) => a.id)).toEqual(["z", "a"]);
  });

  it("sorts alphabetically within the pinned and unpinned groups", () => {
    const items = [
      az("1", "delta"),
      az("2", "bravo"),
      az("3", "echo"),
      az("4", "alfa"),
    ];
    const out = sortAziendeByPinned(items, new Set(["1", "3"]));
    expect(out.map((a) => a.nomeNorm)).toEqual(["delta", "echo", "alfa", "bravo"]);
  });

  it("falls back to pure alphabetical order when nothing is pinned", () => {
    const items = [az("1", "zeta"), az("2", "alfa")];
    const out = sortAziendeByPinned(items, new Set());
    expect(out.map((a) => a.nomeNorm)).toEqual(["alfa", "zeta"]);
  });

  it("does not mutate the input array", () => {
    const items = [az("1", "zeta"), az("2", "alfa")];
    const snapshot = items.map((a) => a.id);
    sortAziendeByPinned(items, new Set());
    expect(items.map((a) => a.id)).toEqual(snapshot);
  });
});

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Attivita } from "@vet/shared";
import { useTrashSelection } from "../useTrashSelection";

function item(id: string): Attivita {
  return { id } as unknown as Attivita;
}

describe("useTrashSelection", () => {
  it("starts with an empty selection", () => {
    const { result } = renderHook(() =>
      useTrashSelection([item("a"), item("b")])
    );
    expect(result.current.selectionCount).toBe(0);
    expect(result.current.allSelected).toBe(false);
  });

  it("toggles a single id on and off", () => {
    const { result } = renderHook(() =>
      useTrashSelection([item("a"), item("b")])
    );
    act(() => result.current.toggleOne("a", true));
    expect(result.current.selected.has("a")).toBe(true);
    expect(result.current.selectionCount).toBe(1);
    expect(result.current.allSelected).toBe(false);
    act(() => result.current.toggleOne("a", false));
    expect(result.current.selected.has("a")).toBe(false);
    expect(result.current.selectionCount).toBe(0);
  });

  it("selects and clears every actionable item", () => {
    const { result } = renderHook(() =>
      useTrashSelection([item("a"), item("b")])
    );
    act(() => result.current.toggleAll(true));
    expect(result.current.selectionCount).toBe(2);
    expect(result.current.allSelected).toBe(true);
    act(() => result.current.toggleAll(false));
    expect(result.current.selectionCount).toBe(0);
    expect(result.current.allSelected).toBe(false);
  });

  it("clear() empties the selection", () => {
    const { result } = renderHook(() => useTrashSelection([item("a")]));
    act(() => result.current.toggleAll(true));
    expect(result.current.selectionCount).toBe(1);
    act(() => result.current.clear());
    expect(result.current.selectionCount).toBe(0);
  });

  it("prunes ids that are no longer actionable (e.g. after a purge)", () => {
    const { result, rerender } = renderHook(
      ({ items }) => useTrashSelection(items),
      { initialProps: { items: [item("a"), item("b")] } }
    );
    act(() => result.current.toggleAll(true));
    expect(result.current.selectionCount).toBe(2);

    rerender({ items: [item("a")] });

    expect(result.current.selected.has("b")).toBe(false);
    expect(result.current.selected.has("a")).toBe(true);
    expect(result.current.selectionCount).toBe(1);
  });
});

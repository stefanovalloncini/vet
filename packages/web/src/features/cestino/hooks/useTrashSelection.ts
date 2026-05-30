import { useCallback, useEffect, useState } from "react";
import type { Attivita } from "@vet/shared";

export interface TrashSelection {
  selected: ReadonlySet<string>;
  selectedItems: Attivita[];
  selectionCount: number;
  allSelected: boolean;
  toggleOne: (id: string, next: boolean) => void;
  toggleAll: (next: boolean) => void;
  clear: () => void;
}

export function useTrashSelection(actionableItems: Attivita[]): TrashSelection {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (selected.size === 0) return;
    const validIds = new Set(actionableItems.map((a) => a.id));
    const next = new Set<string>();
    for (const id of selected) if (validIds.has(id)) next.add(id);
    if (next.size !== selected.size) setSelected(next);
  }, [actionableItems, selected]);

  const toggleOne = useCallback((id: string, next: boolean): void => {
    setSelected((prev) => {
      const out = new Set(prev);
      if (next) out.add(id);
      else out.delete(id);
      return out;
    });
  }, []);

  const toggleAll = useCallback(
    (next: boolean): void => {
      setSelected(next ? new Set(actionableItems.map((a) => a.id)) : new Set());
    },
    [actionableItems]
  );

  const clear = useCallback((): void => setSelected(new Set()), []);

  const selectedItems = actionableItems.filter((a) => selected.has(a.id));
  const allSelected =
    actionableItems.length > 0 && selectedItems.length === actionableItems.length;

  return {
    selected,
    selectedItems,
    selectionCount: selectedItems.length,
    allSelected,
    toggleOne,
    toggleAll,
    clear,
  };
}

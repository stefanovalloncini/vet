import { useMemo } from "react";
import { useAttivita } from "./useAttivita";

export interface VetOption {
  readonly uid: string;
  readonly nome: string;
}

export function useVetOptions(): VetOption[] {
  const { items } = useAttivita({});
  return useMemo(() => {
    const map = new Map<string, VetOption>();
    for (const a of items) {
      if (!map.has(a.ownerUid)) {
        map.set(a.ownerUid, { uid: a.ownerUid, nome: a.ownerName });
      }
    }
    return [...map.values()].sort((a, b) => a.nome.localeCompare(b.nome, "it"));
  }, [items]);
}

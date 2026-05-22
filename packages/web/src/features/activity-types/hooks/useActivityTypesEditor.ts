import { useCallback, useMemo, useState } from "react";
import type { ActivityType } from "@vet/shared";
import {
  useSaveTipoTariffa,
  useTipiAttivita,
  useToggleTipoAttivitaActive,
} from "./useActivityTypes";

export interface ActivityTypesEditor {
  items: ActivityType[];
  active: ActivityType[];
  inactive: ActivityType[];
  loading: boolean;
  loadError: boolean;
  busyId: string | null;
  globalError: string | null;
  refresh: () => Promise<void>;
  toggleActive: (tipo: ActivityType) => Promise<void>;
  saveTariffa: (tipo: ActivityType, value: string) => Promise<void>;
  clearError: () => void;
}

const ERROR_SAVE = "Operazione non riuscita.";
const ERROR_TARIFFA = "Tariffa non valida";

export function useActivityTypesEditor(): ActivityTypesEditor {
  const tipiQuery = useTipiAttivita();
  const toggle = useToggleTipoAttivitaActive();
  const tariffa = useSaveTipoTariffa();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const items = useMemo(() => tipiQuery.data ?? [], [tipiQuery.data]);
  const [active, inactive] = useMemo(() => splitByActive(items), [items]);

  const refresh = useCallback(async () => {
    await tipiQuery.refetch();
  }, [tipiQuery]);

  const toggleActive = useCallback(
    async (tipo: ActivityType) => {
      setBusyId(tipo.id);
      setGlobalError(null);
      try {
        await toggle.mutateAsync({ id: tipo.id, attivo: !tipo.attivo });
      } catch {
        setGlobalError(ERROR_SAVE);
      } finally {
        setBusyId(null);
      }
    },
    [toggle]
  );

  const saveTariffa = useCallback(
    async (tipo: ActivityType, value: string) => {
      const parsed = parseTariffa(value);
      if (parsed.kind === "invalid") {
        setGlobalError(ERROR_TARIFFA);
        return;
      }
      setBusyId(tipo.id);
      setGlobalError(null);
      try {
        await tariffa.mutateAsync({ id: tipo.id, tariffa: parsed.value });
      } catch {
        setGlobalError(ERROR_SAVE);
      } finally {
        setBusyId(null);
      }
    },
    [tariffa]
  );

  const clearError = useCallback(() => setGlobalError(null), []);

  return {
    items,
    active,
    inactive,
    loading: tipiQuery.isPending,
    loadError: tipiQuery.isError,
    busyId,
    globalError,
    refresh,
    toggleActive,
    saveTariffa,
    clearError,
  };
}

function splitByActive(types: ActivityType[]): [ActivityType[], ActivityType[]] {
  const a: ActivityType[] = [];
  const i: ActivityType[] = [];
  for (const t of types) (t.attivo ? a : i).push(t);
  return [a, i];
}

type ParsedTariffa =
  | { kind: "ok"; value: number | null }
  | { kind: "invalid" };

export function parseTariffa(value: string): ParsedTariffa {
  const trimmed = value.trim();
  if (trimmed === "") return { kind: "ok", value: null };
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0) return { kind: "invalid" };
  return { kind: "ok", value: num };
}

import { useCallback, useMemo, useState } from "react";
import type { ActivityType } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useActivityTypes } from "./useActivityTypes";

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
  const { activityTypes: repo } = useRepositories();
  const { types, loading, error, refresh } = useActivityTypes();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [active, inactive] = useMemo(() => splitByActive(types), [types]);

  const toggleActive = useCallback(
    async (tipo: ActivityType) => {
      setBusyId(tipo.id);
      setGlobalError(null);
      try {
        await repo.setActive(tipo.id, !tipo.attivo);
        await refresh();
      } catch {
        setGlobalError(ERROR_SAVE);
      } finally {
        setBusyId(null);
      }
    },
    [repo, refresh]
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
        await repo.setStandardTariff(tipo.id, parsed.value);
        await refresh();
      } catch {
        setGlobalError(ERROR_SAVE);
      } finally {
        setBusyId(null);
      }
    },
    [repo, refresh]
  );

  const clearError = useCallback(() => setGlobalError(null), []);

  return {
    items: types,
    active,
    inactive,
    loading,
    loadError: Boolean(error),
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

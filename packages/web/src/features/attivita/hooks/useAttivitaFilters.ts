import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { AttivitaFilters } from "@vet/shared";
import { parseDateInput } from "../../../shared/lib/format";
import type { GroupKey } from "../lib/totals";

export interface AttivitaFiltersState {
  from: string;
  to: string;
  aziendaId: string;
  tipoId: string;
  vetUid: string;
  group: GroupKey;
  filters: AttivitaFilters;
  setParam: (key: string, value: string) => void;
  setRange: (from: string, to: string) => void;
  clearAll: () => void;
}

const PARAM_KEYS = ["from", "to", "azienda", "tipo", "vet", "group"] as const;

function parseGroup(value: string | null): GroupKey {
  if (value === "azienda") return "azienda";
  if (value === "giorno") return "giorno";
  if (value === "vet") return "vet";
  return "none";
}

function buildFilters(
  from: string,
  to: string,
  aziendaId: string,
  tipoId: string,
  vetUid: string
): AttivitaFilters {
  const f: AttivitaFilters = {};
  const fromDate = parseDateInput(from);
  const toDate = parseDateInput(to);
  if (fromDate) f.from = fromDate;
  if (toDate) {
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
    f.to = end;
  }
  if (aziendaId) f.aziendaId = aziendaId;
  if (tipoId) f.tipoId = tipoId;
  if (vetUid) f.ownerUid = vetUid;
  return f;
}

export function useAttivitaFilters(): AttivitaFiltersState {
  const [params, setParams] = useSearchParams();

  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const aziendaId = params.get("azienda") ?? "";
  const tipoId = params.get("tipo") ?? "";
  const vetUid = params.get("vet") ?? "";
  const group = parseGroup(params.get("group"));

  const filters = useMemo(
    () => buildFilters(from, to, aziendaId, tipoId, vetUid),
    [from, to, aziendaId, tipoId, vetUid]
  );

  const setParam = useCallback(
    (key: string, value: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  const setRange = useCallback(
    (nextFrom: string, nextTo: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (nextFrom) next.set("from", nextFrom);
          else next.delete("from");
          if (nextTo) next.set("to", nextTo);
          else next.delete("to");
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  const clearAll = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const k of PARAM_KEYS) next.delete(k);
        return next;
      },
      { replace: true }
    );
  }, [setParams]);

  return {
    from,
    to,
    aziendaId,
    tipoId,
    vetUid,
    group,
    filters,
    setParam,
    setRange,
    clearAll,
  };
}

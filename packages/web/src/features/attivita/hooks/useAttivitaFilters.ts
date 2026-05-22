import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { AttivitaFilters } from "@vet/shared";
import { parseDateInput } from "../lib/format";
import type { GroupKey } from "../lib/totals";

export interface UseAttivitaFiltersOptions {
  ownerUid?: string | undefined;
}

export interface AttivitaFiltersState {
  from: string;
  to: string;
  aziendaId: string;
  tipoId: string;
  group: GroupKey;
  mineOnly: boolean;
  filters: AttivitaFilters;
  setParam: (key: string, value: string) => void;
}

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
  mineOnly: boolean,
  ownerUid: string | undefined
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
  if (mineOnly && ownerUid) f.ownerUid = ownerUid;
  return f;
}

export function useAttivitaFilters(
  options: UseAttivitaFiltersOptions = {}
): AttivitaFiltersState {
  const { ownerUid } = options;
  const [params, setParams] = useSearchParams();

  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const aziendaId = params.get("azienda") ?? "";
  const tipoId = params.get("tipo") ?? "";
  const group = parseGroup(params.get("group"));
  const mineOnly = params.get("mine") === "1";

  const filters = useMemo(
    () => buildFilters(from, to, aziendaId, tipoId, mineOnly, ownerUid),
    [from, to, aziendaId, tipoId, mineOnly, ownerUid]
  );

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params);
      if (value) next.set(key, value);
      else next.delete(key);
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  return { from, to, aziendaId, tipoId, group, mineOnly, filters, setParam };
}

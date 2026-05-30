import { useMemo } from "react";
import { roundCents } from "../../../shared/lib/money";
import type { Attivita, Azienda, Conto } from "@vet/shared";
import { useAziende } from "../../aziende/hooks/useAziende";
import { useConti } from "../../conti/hooks/useConti";
import { useAttivita } from "../../attivita/hooks/useAttivita";
import { collectBilledAttivitaIds } from "../lib/unbilled";
import { needsNewContoForAzienda } from "../lib/contoPeriodPolicy";

export interface PagamentoOverview {
  readonly azienda: Azienda;
  readonly totaleAperto: number;
  readonly ultimoContoAt: Date | null;
  readonly hasUnpaid: boolean;
  readonly needsNewConto: boolean;
}

interface Aggregate {
  totaleAperto: number;
  ultimoContoAt: Date | null;
  hasUnpaid: boolean;
}

function aggregateConti(conti: ReadonlyArray<Conto>): Map<string, Aggregate> {
  const out = new Map<string, Aggregate>();
  for (const c of conti) {
    if (c.isDeleted) continue;
    const cur =
      out.get(c.aziendaId) ?? {
        totaleAperto: 0,
        ultimoContoAt: null as Date | null,
        hasUnpaid: false,
      };
    if (c.modalita === "emesso") {
      if (!cur.ultimoContoAt || c.emittedAt.getTime() > cur.ultimoContoAt.getTime()) {
        cur.ultimoContoAt = c.emittedAt;
      }
      if (!c.saldato) {
        cur.totaleAperto += c.totaleConto;
        cur.hasUnpaid = true;
      }
    }
    out.set(c.aziendaId, cur);
  }
  for (const v of out.values()) {
    v.totaleAperto = roundCents(v.totaleAperto);
  }
  return out;
}

function buildAttivitaByAzienda(
  attivita: ReadonlyArray<Attivita>
): Map<string, ReadonlyArray<Attivita>> {
  const out = new Map<string, Attivita[]>();
  for (const a of attivita) {
    if (a.isDeleted) continue;
    const arr = out.get(a.aziendaId);
    if (arr) arr.push(a);
    else out.set(a.aziendaId, [a]);
  }
  return out as ReadonlyMap<string, ReadonlyArray<Attivita>> as Map<
    string,
    ReadonlyArray<Attivita>
  >;
}

export interface UsePagamentiOverviewResult {
  rows: ReadonlyArray<PagamentoOverview>;
  loading: boolean;
  error: string | null;
}

export function usePagamentiOverview(now: Date = new Date()): UsePagamentiOverviewResult {
  const aziendeQuery = useAziende();
  const contiQuery = useConti();
  const attivitaQuery = useAttivita();

  const rows = useMemo<ReadonlyArray<PagamentoOverview>>(() => {
    const aziende = aziendeQuery.data ?? [];
    if (aziende.length === 0) return [];
    const conti = contiQuery.data ?? [];
    const attivita = attivitaQuery.items;
    const contiAgg = aggregateConti(conti);
    const billedIds = collectBilledAttivitaIds(conti);
    const attivitaByAzienda = buildAttivitaByAzienda(attivita);
    const out: PagamentoOverview[] = aziende.map((azienda) => {
      const agg = contiAgg.get(azienda.id);
      const totaleAperto = agg?.totaleAperto ?? 0;
      const ultimoContoAt = agg?.ultimoContoAt ?? null;
      const hasUnpaid = agg?.hasUnpaid ?? false;
      const needsNewConto = needsNewContoForAzienda({
        azienda,
        conti,
        attivita: attivitaByAzienda.get(azienda.id),
        billedIds,
        now,
      });
      return { azienda, totaleAperto, ultimoContoAt, hasUnpaid, needsNewConto };
    });
    out.sort((a, b) => a.azienda.nomeNorm.localeCompare(b.azienda.nomeNorm, "it"));
    return out;
  }, [aziendeQuery.data, contiQuery.data, attivitaQuery.items, now]);

  const loading =
    aziendeQuery.isLoading || contiQuery.isLoading || attivitaQuery.loading;
  const error =
    aziendeQuery.isError || contiQuery.isError || attivitaQuery.isError
      ? "load-failed"
      : null;

  return { rows, loading, error };
}

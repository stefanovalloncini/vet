import type { Azienda, CadenzaFatturazione } from "@vet/shared";
import type { ContiByAziendaMap } from "./groupContiByAzienda";

const MONTHS_BY_CADENZA: Record<CadenzaFatturazione, number> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
};

/**
 * Returns the set of aziendaIds where the last conto emission is older than
 * the azienda's billing cadence — i.e. it's time to issue a new conto.
 * Aziende without `cadenzaFatturazione` or without any emitted conto are not flagged.
 */
export function aziendeNeedingNewConto(
  aziende: ReadonlyArray<Azienda>,
  contiByAzienda: ContiByAziendaMap,
  now: Date = new Date()
): ReadonlySet<string> {
  const out = new Set<string>();
  for (const a of aziende) {
    if (!a.cadenzaFatturazione) continue;
    const bucket = contiByAzienda.get(a.id);
    if (!bucket) continue;
    const months = MONTHS_BY_CADENZA[a.cadenzaFatturazione];
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
    if (bucket.lastEmittedAt.getTime() < cutoff.getTime()) {
      out.add(a.id);
    }
  }
  return out;
}

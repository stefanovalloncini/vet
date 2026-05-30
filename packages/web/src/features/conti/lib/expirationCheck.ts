import type { Azienda, Conto } from "@vet/shared";
import type { ContiByAziendaMap } from "./groupContiByAzienda";
import { previousFor, rangeForSelection } from "./periodSelection";

function isEmittedConto(conto: Conto): boolean {
  return !conto.isDeleted && conto.modalita === "emesso";
}

function coversPeriod(conto: Conto, from: Date, to: Date): boolean {
  return (
    conto.periodoFrom.getTime() <= to.getTime() &&
    conto.periodoTo.getTime() >= from.getTime()
  );
}

/**
 * Returns the set of aziendaIds whose previous full calendar period (for their
 * billing cadence) is not covered by any emitted conto — i.e. it's time to
 * issue a new conto for that period. Aziende without `cadenzaFatturazione` or
 * without any conto are not flagged.
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
    const { from, to } = rangeForSelection(previousFor(a.cadenzaFatturazione, now));
    if (to.getTime() >= now.getTime()) continue;
    const covered = bucket.conti.some(
      (c) => isEmittedConto(c) && coversPeriod(c, from, to)
    );
    if (!covered) out.add(a.id);
  }
  return out;
}

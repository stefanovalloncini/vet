import type { Attivita, Azienda, CadenzaFatturazione, Conto } from "@vet/shared";
import { previousFor, rangeForSelection } from "../../conti";

const DEFAULT_CADENZA: CadenzaFatturazione = "quarterly";

function cadenzaFor(azienda: Pick<Azienda, "cadenzaFatturazione">): CadenzaFatturazione {
  return azienda.cadenzaFatturazione ?? DEFAULT_CADENZA;
}

export function defaultPeriodForAzienda(
  azienda: Azienda,
  today: Date
): { from: Date; to: Date } {
  return rangeForSelection(previousFor(cadenzaFor(azienda), today));
}

function inRange(d: Date, from: Date, to: Date): boolean {
  const t = d.getTime();
  return t >= from.getTime() && t <= to.getTime();
}

function overlaps(
  conto: Pick<Conto, "periodoFrom" | "periodoTo">,
  from: Date,
  to: Date
): boolean {
  return (
    conto.periodoFrom.getTime() <= to.getTime() &&
    conto.periodoTo.getTime() >= from.getTime()
  );
}

function isEmittedConto(conto: Conto): boolean {
  return !conto.isDeleted && conto.modalita === "emesso";
}

export interface NeedsNewContoArgs {
  readonly azienda: Azienda;
  readonly conti: ReadonlyArray<Conto>;
  readonly attivita: ReadonlyArray<Attivita> | undefined;
  readonly billedIds: ReadonlySet<string>;
  readonly now: Date;
}

export function needsNewContoForAzienda(args: NeedsNewContoArgs): boolean {
  const { azienda, conti, attivita, billedIds, now } = args;
  if (!azienda.cadenzaFatturazione) return false;
  if (!attivita || attivita.length === 0) return false;

  const { from, to } = rangeForSelection(previousFor(azienda.cadenzaFatturazione, now));
  if (to.getTime() >= now.getTime()) return false;

  const hasUnbilledInPeriod = attivita.some(
    (a) =>
      a.aziendaId === azienda.id &&
      !a.isDeleted &&
      !billedIds.has(a.id) &&
      inRange(a.data, from, to)
  );
  if (!hasUnbilledInPeriod) return false;

  const covered = conti.some(
    (c) =>
      c.aziendaId === azienda.id && isEmittedConto(c) && overlaps(c, from, to)
  );
  return !covered;
}

import type { CadenzaFatturazione, Conto } from "@vet/shared";
import { defaultPeriodoFor, expectedLastPeriodoTo } from "./periodSelection";

export interface ContoPeriod {
  from: Date;
  to: Date;
}

function endOfDay(d: Date): Date {
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    23,
    59,
    59,
    999
  );
}

function dayAfter(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
}

function lastEmittedPeriodoTo(conti: ReadonlyArray<Conto>): Date | null {
  let latest: Date | null = null;
  for (const c of conti) {
    if (c.modalita !== "emesso" || c.isDeleted) continue;
    if (!latest || c.periodoTo.getTime() > latest.getTime()) {
      latest = c.periodoTo;
    }
  }
  return latest;
}

export function contoDefaultPeriod(
  conti: ReadonlyArray<Conto>,
  cadenza: CadenzaFatturazione | undefined,
  now: Date = new Date()
): ContoPeriod {
  const fallback = defaultPeriodoFor(
    cadenza ? { cadenzaFatturazione: cadenza } : undefined,
    now
  );
  const lastTo = lastEmittedPeriodoTo(conti);
  const from = lastTo ? dayAfter(lastTo) : fallback.from;
  const cadenceEnd = cadenza ? expectedLastPeriodoTo(cadenza, now) : null;
  const today = endOfDay(now);
  const to =
    cadenceEnd && cadenceEnd.getTime() >= from.getTime() ? cadenceEnd : today;
  return { from, to: to.getTime() < from.getTime() ? endOfDay(from) : to };
}

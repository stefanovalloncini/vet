import type { Attivita, Azienda } from "@vet/shared";
import type { CadenzaFatturazione } from "@vet/shared";

export interface ContoPreview {
  attivitaIds: string[];
  totaleConto: number;
  count: number;
}

export function computeContoPreview(
  items: ReadonlyArray<Attivita>,
  aziendaId: string,
  periodoFrom: Date,
  periodoTo: Date
): ContoPreview {
  const fromMs = periodoFrom.getTime();
  const toMs = periodoTo.getTime();
  const matching = items.filter(
    (a) =>
      a.aziendaId === aziendaId &&
      !a.isDeleted &&
      a.data.getTime() >= fromMs &&
      a.data.getTime() <= toMs
  );
  const totale = matching.reduce((s, a) => s + a.totale, 0);
  return {
    attivitaIds: matching.map((a) => a.id),
    totaleConto: Math.round(totale * 100) / 100,
    count: matching.length,
  };
}

export function defaultPeriodoFor(
  azienda: Pick<Azienda, "cadenzaFatturazione"> | undefined,
  now: Date = new Date()
): { from: Date; to: Date } {
  const cadenza: CadenzaFatturazione | undefined = azienda?.cadenzaFatturazione;
  if (cadenza === "monthly") return previousCalendarMonth(now);
  if (cadenza === "quarterly") return previousCalendarQuarter(now);
  if (cadenza === "semiannual") return previousCalendarSemester(now);
  return rollingLastMonths(now, 3);
}

function previousCalendarMonth(now: Date): { from: Date; to: Date } {
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  return { from, to };
}

function previousCalendarQuarter(now: Date): { from: Date; to: Date } {
  const currentQuarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const fromMonth = currentQuarterStartMonth - 3;
  const from = new Date(now.getFullYear(), fromMonth, 1);
  const to = new Date(
    now.getFullYear(),
    currentQuarterStartMonth,
    0,
    23,
    59,
    59,
    999
  );
  return { from, to };
}

function previousCalendarSemester(now: Date): { from: Date; to: Date } {
  const inH1 = now.getMonth() < 6;
  const from = inH1
    ? new Date(now.getFullYear() - 1, 6, 1)
    : new Date(now.getFullYear(), 0, 1);
  const to = inH1
    ? new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
    : new Date(now.getFullYear(), 5, 30, 23, 59, 59, 999);
  return { from, to };
}

function rollingLastMonths(
  now: Date,
  monthsBack: number
): { from: Date; to: Date } {
  const from = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  return { from, to };
}


import type { Azienda, CadenzaFatturazione } from "@vet/shared";

const MONTHS_BY_CADENZA: Record<CadenzaFatturazione, number> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
};

const DEFAULT_MONTHS = 3;

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  // Day 0 of next month = last day of current month.
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/**
 * Returns the default conto period for an azienda relative to `today`.
 *
 * - monthly    → previous full calendar month
 * - quarterly  → previous 3 full calendar months
 * - semiannual → previous 6 full calendar months
 * - unset      → previous 3 months (sensible default)
 *
 * `from` is the first day of the earliest month in the window, `to` is the
 * last day of the most-recent fully-elapsed month. The current month is
 * never included.
 */
export function defaultPeriodForAzienda(
  azienda: Azienda,
  today: Date
): { from: Date; to: Date } {
  const months = azienda.cadenzaFatturazione
    ? MONTHS_BY_CADENZA[azienda.cadenzaFatturazione]
    : DEFAULT_MONTHS;
  // The most recent fully-elapsed calendar month is `today - 1 month`.
  const lastMonthAnchor = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const to = endOfMonth(lastMonthAnchor);
  const firstMonthAnchor = new Date(
    today.getFullYear(),
    today.getMonth() - months,
    1
  );
  const from = startOfMonth(firstMonthAnchor);
  return { from, to };
}

export type Cadenza = "monthly" | "quarterly" | "semiannual";

export interface Period {
  start: Date;
  end: Date;
  label: string;
}

const ITALIAN_MONTHS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

const MONTHS_BY_CADENZA: Record<Cadenza, number> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
};

export function isCadenzaDue(cadenza: Cadenza, runAt: Date): boolean {
  const m = runAt.getUTCMonth() + 1;
  if (cadenza === "monthly") return true;
  if (cadenza === "quarterly") return m === 1 || m === 4 || m === 7 || m === 10;
  if (cadenza === "semiannual") return m === 1 || m === 7;
  return false;
}

export function periodFor(cadenza: Cadenza, runAt: Date): Period {
  const months = MONTHS_BY_CADENZA[cadenza];
  const year = runAt.getUTCFullYear();
  const month = runAt.getUTCMonth();
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  const start = new Date(Date.UTC(year, month - months, 1, 0, 0, 0, 0));
  const label =
    cadenza === "monthly"
      ? `${ITALIAN_MONTHS[start.getUTCMonth()]} ${start.getUTCFullYear()}`
      : `${ITALIAN_MONTHS[start.getUTCMonth()]} – ${ITALIAN_MONTHS[end.getUTCMonth()]} ${end.getUTCFullYear()}`;
  return { start, end, label };
}

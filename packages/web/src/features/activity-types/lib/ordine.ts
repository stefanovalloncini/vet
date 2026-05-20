import type { ActivityType } from "@vet/shared";

const ORDINE_STEP = 10;

export function nextOrdine(tipi: readonly ActivityType[]): number {
  const max = tipi.reduce((m, t) => Math.max(m, t.ordine), 0);
  return max + ORDINE_STEP;
}

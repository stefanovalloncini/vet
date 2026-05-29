import { ALTRO_TIPO_ID, type ActivityType } from "@vet/shared";

const ORDINE_STEP = 10;
const MAX_ORDINE = 1000;

export function nextOrdine(tipi: readonly ActivityType[]): number {
  const max = tipi.reduce(
    (m, t) => (t.id === ALTRO_TIPO_ID ? m : Math.max(m, t.ordine)),
    0
  );
  return Math.min(max + ORDINE_STEP, MAX_ORDINE);
}

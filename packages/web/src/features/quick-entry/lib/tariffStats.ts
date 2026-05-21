import type { Attivita } from "@vet/shared";

const MIN_SAMPLE = 3;
const RANGE_LO = 0.5;
const RANGE_HI = 2;

export function meanTariffaByTipo(items: ReadonlyArray<Attivita>): Map<string, number> {
  const sums = new Map<string, { sum: number; n: number }>();
  for (const a of items) {
    if (a.tariffa <= 0) continue;
    const cur = sums.get(a.tipoId) ?? { sum: 0, n: 0 };
    cur.sum += a.tariffa;
    cur.n += 1;
    sums.set(a.tipoId, cur);
  }
  const out = new Map<string, number>();
  for (const [k, { sum, n }] of sums) {
    if (n >= MIN_SAMPLE) out.set(k, sum / n);
  }
  return out;
}

export interface RangeCheckInput {
  tariffa: number | null;
  tipoId: string;
  meanByTipo: Map<string, number>;
}

export function isTariffaOutOfRange({
  tariffa,
  tipoId,
  meanByTipo,
}: RangeCheckInput): number | null {
  if (tariffa === null || !Number.isFinite(tariffa) || tariffa <= 0) return null;
  if (!tipoId) return null;
  const mean = meanByTipo.get(tipoId);
  if (mean === undefined) return null;
  if (tariffa < mean * RANGE_LO || tariffa > mean * RANGE_HI) return mean;
  return null;
}

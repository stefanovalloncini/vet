export type DosaggioInput = number | "";

/**
 * ml = (peso_kg * dose_mg/kg) / concentrazione_mg/ml, rounded to cents.
 * Returns null for any empty, non-finite, or non-positive input (so a zero
 * concentration can never divide-by-zero into a bogus dose).
 */
export function computeMl(
  peso: DosaggioInput,
  dose: DosaggioInput,
  conc: DosaggioInput
): number | null {
  if (peso === "" || dose === "" || conc === "") return null;
  if (!isFinite(peso) || !isFinite(dose) || !isFinite(conc)) return null;
  if (peso <= 0 || dose <= 0 || conc <= 0) return null;
  const value = (peso * dose) / conc;
  if (!isFinite(value)) return null;
  return Math.round(value * 100) / 100;
}

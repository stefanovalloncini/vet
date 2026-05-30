/**
 * Rounds a monetary amount to whole cents. Single source for the app's cent
 * rounding so a future rounding-mode change (e.g. banker's rounding) lives in
 * one place. Uses Math.round on value*100, so results are subject to IEEE-754
 * fragility at exact half-cents — pinned by the tests.
 */
export function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

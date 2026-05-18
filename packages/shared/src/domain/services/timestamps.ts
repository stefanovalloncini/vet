import type { Clock } from "../ports/Clock";

export function isoNow(clock: Clock): string {
  return clock.now().toISOString();
}

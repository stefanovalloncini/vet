import type { Clock } from "../ports/Clock.js";

export function isoNow(clock: Clock): string {
  return clock.now().toISOString();
}

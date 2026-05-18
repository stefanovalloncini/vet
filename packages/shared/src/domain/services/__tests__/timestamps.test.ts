import { describe, expect, it } from "vitest";
import { FixedClock } from "../../../infrastructure/FixedClock";
import { SystemClock } from "../../../infrastructure/SystemClock";
import { isoNow } from "../timestamps";

describe("isoNow", () => {
  it("uses the injected clock, not Date.now", () => {
    const clock = new FixedClock(new Date("2026-05-18T10:00:00.000Z"));
    expect(isoNow(clock)).toBe("2026-05-18T10:00:00.000Z");
  });

  it("returns current time when given SystemClock", () => {
    const clock = new SystemClock();
    const before = Date.now();
    const result = isoNow(clock);
    const after = Date.now();
    const parsed = new Date(result).getTime();
    expect(parsed).toBeGreaterThanOrEqual(before);
    expect(parsed).toBeLessThanOrEqual(after);
  });
});

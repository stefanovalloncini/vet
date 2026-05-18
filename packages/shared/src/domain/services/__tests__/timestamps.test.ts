import { describe, expect, it } from "vitest";
import { FixedClock } from "../../../testing/FixedClock.js";
import { isoNow } from "../timestamps.js";

describe("isoNow", () => {
  it("uses the injected clock, not Date.now", () => {
    const clock = new FixedClock(new Date("2026-05-18T10:00:00.000Z"));
    expect(isoNow(clock)).toBe("2026-05-18T10:00:00.000Z");
  });
});

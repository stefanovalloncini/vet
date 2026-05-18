import { describe, expect, it } from "vitest";
import { computeTrashCutoff } from "../dailyCleanup.js";

describe("computeTrashCutoff", () => {
  it("subtracts the default 7 days", () => {
    const now = new Date("2026-03-10T03:00:00.000Z");
    const cutoff = computeTrashCutoff(now);
    expect(cutoff.toISOString()).toBe("2026-03-03T03:00:00.000Z");
  });

  it("honors a custom ttl", () => {
    const now = new Date("2026-03-10T03:00:00.000Z");
    const cutoff = computeTrashCutoff(now, 30);
    expect(cutoff.toISOString()).toBe("2026-02-08T03:00:00.000Z");
  });

  it("returns a new Date instance (no mutation)", () => {
    const now = new Date("2026-03-10T03:00:00.000Z");
    const original = now.toISOString();
    computeTrashCutoff(now);
    expect(now.toISOString()).toBe(original);
  });
});

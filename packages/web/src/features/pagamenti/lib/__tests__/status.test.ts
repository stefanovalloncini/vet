import { describe, expect, it } from "vitest";
import { statoFor, statoForKey } from "../status";

describe("statoFor", () => {
  it("prioritizes unpaid over a needed new conto", () => {
    expect(statoFor({ hasUnpaid: true, needsNewConto: true }).key).toBe("unpaid");
    expect(statoFor({ hasUnpaid: true, needsNewConto: false }).key).toBe("unpaid");
  });

  it("returns todo when only a new conto is needed", () => {
    expect(statoFor({ hasUnpaid: false, needsNewConto: true }).key).toBe("todo");
  });

  it("returns ok when nothing is pending", () => {
    expect(statoFor({ hasUnpaid: false, needsNewConto: false }).key).toBe("ok");
  });

  it("maps each state to the expected tone", () => {
    expect(statoFor({ hasUnpaid: true, needsNewConto: false }).tone).toBe("danger");
    expect(statoFor({ hasUnpaid: false, needsNewConto: true }).tone).toBe("warning");
    expect(statoFor({ hasUnpaid: false, needsNewConto: false }).tone).toBe("success");
  });
});

describe("statoForKey", () => {
  it("returns the matching meta with a non-empty label for each key", () => {
    for (const key of ["ok", "unpaid", "todo"] as const) {
      const meta = statoForKey(key);
      expect(meta.key).toBe(key);
      expect(meta.label.length).toBeGreaterThan(0);
    }
  });
});

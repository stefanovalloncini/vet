import { describe, expect, it } from "vitest";
import {
  buildKillSwitchEmail,
  parseNotification,
  shouldKill,
} from "../killSwitch.js";

describe("shouldKill", () => {
  it("returns false below threshold", () => {
    expect(shouldKill(2, 5)).toBe(false);
  });

  it("returns true at threshold", () => {
    expect(shouldKill(5, 5)).toBe(true);
  });

  it("returns true above threshold", () => {
    expect(shouldKill(10, 5)).toBe(true);
  });

  it("returns false for non-finite cost", () => {
    expect(shouldKill(Number.NaN, 5)).toBe(false);
    expect(shouldKill(Number.POSITIVE_INFINITY, 5)).toBe(false);
  });
});

describe("parseNotification", () => {
  it("accepts a valid budget payload", () => {
    const out = parseNotification({
      budgetDisplayName: "vet monthly",
      costAmount: 7.5,
      costIntervalStart: "2026-05-01T00:00:00Z",
      budgetAmount: 1,
      budgetAmountType: "SPECIFIED_AMOUNT",
      currencyCode: "USD",
    });
    expect(out).not.toBeNull();
    expect(out?.costAmount).toBe(7.5);
    expect(out?.currencyCode).toBe("USD");
  });

  it("rejects null or non-object", () => {
    expect(parseNotification(null)).toBeNull();
    expect(parseNotification("string")).toBeNull();
    expect(parseNotification(42)).toBeNull();
  });

  it("rejects missing costAmount", () => {
    expect(
      parseNotification({ budgetAmount: 1, currencyCode: "USD" })
    ).toBeNull();
  });

  it("rejects non-numeric costAmount", () => {
    expect(
      parseNotification({
        costAmount: "5",
        budgetAmount: 1,
        currencyCode: "USD",
      })
    ).toBeNull();
  });
});

describe("buildKillSwitchEmail", () => {
  it("includes the project, cost, currency, and budget name", () => {
    const html = buildKillSwitchEmail({
      projectId: "vet-marinoni",
      cost: 6.42,
      currency: "EUR",
      budget: "Firebase Project vet-marinoni",
      threshold: 5,
    });
    expect(html).toContain("vet-marinoni");
    expect(html).toContain("6.42");
    expect(html).toContain("EUR");
    expect(html).toContain("Firebase Project vet-marinoni");
  });

  it("escapes user-controlled fields", () => {
    const html = buildKillSwitchEmail({
      projectId: "<script>",
      cost: 1,
      currency: "&\"<>",
      budget: "<b>",
      threshold: 5,
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;");
  });
});

import { describe, expect, it } from "vitest";
import {
  METODI_PAGAMENTO,
  euroAmountSchema,
  hasAtMostTwoDecimals,
  metodoPagamentoSchema,
} from "../money";

describe("hasAtMostTwoDecimals", () => {
  it("accepts integers and one-decimal values", () => {
    for (const n of [10, 0, 1234, 10.5, 70.1, 0.1, 0.3]) {
      expect(hasAtMostTwoDecimals(n)).toBe(true);
    }
  });

  it("accepts two-decimal values, including float-fragile ones", () => {
    // These all have ≤2 decimals; n*100 is not exact in IEEE-754
    // (e.g. 19.99*100 === 1998.9999999999998), so a naive
    // Math.round(n*100) === n*100 check wrongly rejected them.
    for (const n of [10.55, 19.99, 0.07, 0.55, 2.05, 8.55, 29.99, 0.01, 99999.99]) {
      expect(hasAtMostTwoDecimals(n)).toBe(true);
    }
  });

  it("rejects values with three or more decimals", () => {
    for (const n of [10.555, 1.005, 0.001, 19.999, 3.14159, 0.125]) {
      expect(hasAtMostTwoDecimals(n)).toBe(false);
    }
  });
});

describe("euroAmountSchema", () => {
  it("accepts common two-decimal prices", () => {
    for (const n of [19.99, 0.07, 8.55, 70.1, 1234.56, 0.01, 100_000]) {
      expect(euroAmountSchema.safeParse(n).success).toBe(true);
    }
  });

  it("rejects non-positive amounts", () => {
    expect(euroAmountSchema.safeParse(0).success).toBe(false);
    expect(euroAmountSchema.safeParse(-5).success).toBe(false);
  });

  it("rejects amounts over the 100k cap", () => {
    expect(euroAmountSchema.safeParse(100_000.01).success).toBe(false);
  });

  it("rejects more than two decimals", () => {
    expect(euroAmountSchema.safeParse(10.555).success).toBe(false);
    expect(euroAmountSchema.safeParse(1.005).success).toBe(false);
  });

  it("rejects non-finite and non-number input", () => {
    expect(euroAmountSchema.safeParse(Number.NaN).success).toBe(false);
    expect(euroAmountSchema.safeParse("19.99").success).toBe(false);
  });
});

describe("metodoPagamentoSchema", () => {
  it("accepts each known method", () => {
    for (const m of METODI_PAGAMENTO) {
      expect(metodoPagamentoSchema.safeParse(m).success).toBe(true);
    }
    expect(METODI_PAGAMENTO).toEqual(["bonifico", "contanti", "altro"]);
  });

  it("rejects unknown methods", () => {
    expect(metodoPagamentoSchema.safeParse("paypal").success).toBe(false);
    expect(metodoPagamentoSchema.safeParse("").success).toBe(false);
  });
});

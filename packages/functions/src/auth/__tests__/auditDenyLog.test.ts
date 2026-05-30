import { describe, it, expect } from "vitest";
import {
  dateKey,
  isAuditThrottled,
  isGlobalDenyCapExceeded,
} from "../auditDenyLog.js";

describe("auditDenyLog.dateKey", () => {
  it("buckets a timestamp into its UTC calendar day", () => {
    expect(dateKey(new Date("2026-05-30T08:15:00.000Z"))).toBe("2026-05-30");
    expect(dateKey(new Date("2026-05-30T23:59:59.999Z"))).toBe("2026-05-30");
  });

  it("rolls the window at UTC midnight, not local midnight", () => {
    expect(dateKey(new Date("2026-05-30T00:00:00.000Z"))).toBe("2026-05-30");
    expect(dateKey(new Date("2026-05-29T23:59:59.999Z"))).toBe("2026-05-29");
  });
});

describe("auditDenyLog.isAuditThrottled", () => {
  it("allows writes below the per-email daily cap", () => {
    expect(isAuditThrottled(0)).toBe(false);
    expect(isAuditThrottled(9)).toBe(false);
  });

  it("throttles once the daily cap is reached", () => {
    expect(isAuditThrottled(10)).toBe(true);
    expect(isAuditThrottled(11)).toBe(true);
  });
});

describe("auditDenyLog.isGlobalDenyCapExceeded", () => {
  it("allows writes below the global daily cap", () => {
    expect(isGlobalDenyCapExceeded(0)).toBe(false);
    expect(isGlobalDenyCapExceeded(4999)).toBe(false);
  });

  it("blocks writes once the global daily cap is reached", () => {
    expect(isGlobalDenyCapExceeded(5000)).toBe(true);
    expect(isGlobalDenyCapExceeded(5001)).toBe(true);
  });
});

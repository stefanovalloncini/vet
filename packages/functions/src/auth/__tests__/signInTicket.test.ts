import { describe, it, expect } from "vitest";
import { evaluateTicket } from "../signInTicket.js";

describe("evaluateTicket", () => {
  const nowMs = 1_700_000_000_000;
  const email = "a@b.com";

  it("rejects when ticket does not exist", () => {
    expect(
      evaluateTicket({
        exists: false,
        consumed: undefined,
        emailNorm: undefined,
        expiresAtMs: undefined,
        providedEmailNorm: email,
        nowMs,
      })
    ).toEqual({ valid: false, reason: "missing" });
  });

  it("rejects when ticket is already consumed", () => {
    expect(
      evaluateTicket({
        exists: true,
        consumed: true,
        emailNorm: email,
        expiresAtMs: nowMs + 1000,
        providedEmailNorm: email,
        nowMs,
      })
    ).toEqual({ valid: false, reason: "consumed" });
  });

  it("rejects when email does not match", () => {
    expect(
      evaluateTicket({
        exists: true,
        consumed: false,
        emailNorm: "other@x.com",
        expiresAtMs: nowMs + 1000,
        providedEmailNorm: email,
        nowMs,
      })
    ).toEqual({ valid: false, reason: "email-mismatch" });
  });

  it("rejects when expired", () => {
    expect(
      evaluateTicket({
        exists: true,
        consumed: false,
        emailNorm: email,
        expiresAtMs: nowMs - 1,
        providedEmailNorm: email,
        nowMs,
      })
    ).toEqual({ valid: false, reason: "expired" });
  });

  it("rejects when expiresAtMs is undefined", () => {
    expect(
      evaluateTicket({
        exists: true,
        consumed: false,
        emailNorm: email,
        expiresAtMs: undefined,
        providedEmailNorm: email,
        nowMs,
      })
    ).toEqual({ valid: false, reason: "expired" });
  });

  it("accepts a fresh, unconsumed, email-matching ticket", () => {
    expect(
      evaluateTicket({
        exists: true,
        consumed: false,
        emailNorm: email,
        expiresAtMs: nowMs + 60_000,
        providedEmailNorm: email,
        nowMs,
      })
    ).toEqual({ valid: true });
  });
});

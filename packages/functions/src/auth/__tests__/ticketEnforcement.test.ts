import { describe, it, expect } from "vitest";
import { decideTicketEnforcement } from "../ticketEnforcement.js";

const nowMs = 1_700_000_000_000;

describe("decideTicketEnforcement", () => {
  it("allows Google sign-in without requiring a ticket", () => {
    expect(
      decideTicketEnforcement({
        signInMethod: "google.com",
        ticket: null,
        nowMs,
      })
    ).toEqual({ allow: true, requiresTicket: false });
  });

  it("allows an unknown/absent sign-in method without requiring a ticket", () => {
    expect(
      decideTicketEnforcement({
        signInMethod: undefined,
        ticket: null,
        nowMs,
      })
    ).toEqual({ allow: true, requiresTicket: false });
  });

  it("allows email-link with a consumed, unexpired ticket and asks to delete it", () => {
    expect(
      decideTicketEnforcement({
        signInMethod: "emailLink",
        ticket: { consumed: true, expiresAtMs: nowMs + 60_000 },
        nowMs,
      })
    ).toEqual({ allow: true, requiresTicket: true, consumeTicket: true });
  });

  it("denies email-link when no ticket exists", () => {
    expect(
      decideTicketEnforcement({
        signInMethod: "emailLink",
        ticket: null,
        nowMs,
      })
    ).toEqual({ allow: false, requiresTicket: true, reason: "missing" });
  });

  it("denies email-link when the ticket was never consumed", () => {
    expect(
      decideTicketEnforcement({
        signInMethod: "emailLink",
        ticket: { consumed: false, expiresAtMs: nowMs + 60_000 },
        nowMs,
      })
    ).toEqual({ allow: false, requiresTicket: true, reason: "not-consumed" });
  });

  it("denies email-link when the ticket is expired", () => {
    expect(
      decideTicketEnforcement({
        signInMethod: "emailLink",
        ticket: { consumed: true, expiresAtMs: nowMs - 1 },
        nowMs,
      })
    ).toEqual({ allow: false, requiresTicket: true, reason: "expired" });
  });

  it("denies email-link when the ticket has no expiry", () => {
    expect(
      decideTicketEnforcement({
        signInMethod: "emailLink",
        ticket: { consumed: true, expiresAtMs: undefined },
        nowMs,
      })
    ).toEqual({ allow: false, requiresTicket: true, reason: "expired" });
  });
});

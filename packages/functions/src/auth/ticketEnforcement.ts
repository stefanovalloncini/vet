export const EMAIL_LINK_SIGN_IN_METHOD = "emailLink";

export interface TicketState {
  consumed: boolean | undefined;
  expiresAtMs: number | undefined;
}

export interface TicketEnforcementInput {
  signInMethod: string | undefined;
  ticket: TicketState | null;
  nowMs: number;
}

export type TicketEnforcementDecision =
  | { allow: true; requiresTicket: false }
  | { allow: true; requiresTicket: true; consumeTicket: true }
  | {
      allow: false;
      requiresTicket: true;
      reason: "missing" | "not-consumed" | "expired";
    };

export function decideTicketEnforcement(
  input: TicketEnforcementInput
): TicketEnforcementDecision {
  if (input.signInMethod !== EMAIL_LINK_SIGN_IN_METHOD) {
    return { allow: true, requiresTicket: false };
  }

  const ticket = input.ticket;
  if (!ticket) {
    return { allow: false, requiresTicket: true, reason: "missing" };
  }
  if (ticket.consumed !== true) {
    return { allow: false, requiresTicket: true, reason: "not-consumed" };
  }
  if (typeof ticket.expiresAtMs !== "number" || input.nowMs > ticket.expiresAtMs) {
    return { allow: false, requiresTicket: true, reason: "expired" };
  }
  return { allow: true, requiresTicket: true, consumeTicket: true };
}

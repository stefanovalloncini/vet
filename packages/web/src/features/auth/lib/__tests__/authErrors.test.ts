import { describe, it, expect } from "vitest";
import { classifyAuthError, isUserCancelledPopup } from "../authErrors";

describe("classifyAuthError", () => {
  it("flags user-cancelled popup with no message", () => {
    const r = classifyAuthError({ code: "auth/popup-closed-by-user" });
    expect(r.kind).toBe("userCancelled");
    expect(r.message).toBe("");
  });

  it("classifies App Check token failures", () => {
    const r = classifyAuthError({ code: "auth/firebase-app-check-token-is-invalid" });
    expect(r.kind).toBe("appCheckFailed");
    expect(r.message).toMatch(/estensioni|browser/i);
  });

  it("classifies App Check failures from nested error message", () => {
    const r = classifyAuthError({
      code: "auth/internal-error",
      message: "APP_CHECK_TOKEN_INVALID",
    });
    expect(r.kind).toBe("appCheckFailed");
  });

  it("classifies blocking-function denial as unauthorized email", () => {
    const r = classifyAuthError({
      code: "auth/internal-error",
      customData: {
        _tokenResponse: { error: { message: "BLOCKING_FUNCTION_ERROR_RESPONSE" } },
      },
    });
    expect(r.kind).toBe("unauthorizedEmail");
    expect(r.message).toMatch(/account/i);
  });

  it("classifies admin-restricted-operation as unauthorized email", () => {
    const r = classifyAuthError({ code: "auth/admin-restricted-operation" });
    expect(r.kind).toBe("unauthorizedEmail");
  });

  it("classifies popup-blocked", () => {
    const r = classifyAuthError({ code: "auth/popup-blocked" });
    expect(r.kind).toBe("popupBlocked");
  });

  it("classifies network error", () => {
    const r = classifyAuthError({ code: "auth/network-request-failed" });
    expect(r.kind).toBe("network");
  });

  it("classifies expired-action-code", () => {
    const r = classifyAuthError({ code: "auth/expired-action-code" });
    expect(r.kind).toBe("expiredLink");
  });

  it("classifies invalid-action-code", () => {
    const r = classifyAuthError({ code: "auth/invalid-action-code" });
    expect(r.kind).toBe("invalidLink");
  });

  it("classifies operation-not-allowed", () => {
    const r = classifyAuthError({ code: "auth/operation-not-allowed" });
    expect(r.kind).toBe("operationNotAllowed");
  });

  it("falls through to unknown for an unrecognized error", () => {
    const r = classifyAuthError({ code: "auth/something-new" });
    expect(r.kind).toBe("unknown");
    expect(r.message).toMatch(/amministratore/i);
  });

  it("handles non-object inputs", () => {
    expect(classifyAuthError(undefined).kind).toBe("unknown");
    expect(classifyAuthError("oops").kind).toBe("unknown");
    expect(classifyAuthError(null).kind).toBe("unknown");
  });
});

describe("isUserCancelledPopup", () => {
  it("returns true for known cancel codes", () => {
    expect(isUserCancelledPopup({ code: "auth/popup-closed-by-user" })).toBe(true);
    expect(isUserCancelledPopup({ code: "auth/cancelled-popup-request" })).toBe(true);
    expect(isUserCancelledPopup({ code: "auth/user-cancelled" })).toBe(true);
  });

  it("returns false for other errors", () => {
    expect(isUserCancelledPopup({ code: "auth/popup-blocked" })).toBe(false);
    expect(isUserCancelledPopup(null)).toBe(false);
  });
});

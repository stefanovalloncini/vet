import { describe, it, expect } from "vitest";
import { classifyAuthError, isUserCancelledPopup } from "../authErrors";

describe("classifyAuthError", () => {
  it("flags user-cancelled popup with no message", () => {
    const r = classifyAuthError({ code: "auth/popup-closed-by-user" });
    expect(r.kind).toBe("userCancelled");
    expect(r.message).toBe("");
  });

  it("classifies App Check token failures", () => {
    const r = classifyAuthError({
      code: "auth/firebase-app-check-token-is-invalid",
    });
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

  it("classifies user-disabled", () => {
    const r = classifyAuthError({ code: "auth/user-disabled" });
    expect(r.kind).toBe("userDisabled");
    expect(r.message).toMatch(/disabilitato|amministratore/i);
  });

  it("classifies web-storage-unsupported", () => {
    const r = classifyAuthError({ code: "auth/web-storage-unsupported" });
    expect(r.kind).toBe("storageBlocked");
    expect(r.message).toMatch(/cookie|privato|browser/i);
  });

  it("classifies missing-email as invalidEmail", () => {
    const r = classifyAuthError({ code: "auth/missing-email" });
    expect(r.kind).toBe("invalidEmail");
  });

  it("classifies quota-exceeded as tooManyRequests", () => {
    const r = classifyAuthError({ code: "auth/quota-exceeded" });
    expect(r.kind).toBe("tooManyRequests");
  });

  it("classifies requires-recent-login", () => {
    const r = classifyAuthError({ code: "auth/requires-recent-login" });
    expect(r.kind).toBe("requiresRecentLogin");
  });

  it("classifies unauthorized-domain", () => {
    const r = classifyAuthError({ code: "auth/unauthorized-domain" });
    expect(r.kind).toBe("unauthorizedDomain");
    expect(r.message).toMatch(/dominio|amministratore/i);
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

  it("returns the same kind for unauthorizedEmail via permission_denied msg", () => {
    const r = classifyAuthError({
      code: "auth/internal-error",
      message: "PERMISSION_DENIED",
    });
    expect(r.kind).toBe("unauthorizedEmail");
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

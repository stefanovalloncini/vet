import { describe, it, expect } from "vitest";
import { HttpsError } from "firebase-functions/v2/https";
import {
  ensureCanAcceptAccessRequest,
  ensureAssignableRole,
} from "../acceptAccessRequest.js";

describe("acceptAccessRequest.ensureCanAcceptAccessRequest", () => {
  it("throws permission-denied when the caller uid is missing", () => {
    expect(() =>
      ensureCanAcceptAccessRequest({ uid: undefined, caps: ["allowlist.manage"] })
    ).toThrowError(HttpsError);
  });

  it("throws permission-denied when the caller lacks allowlist.manage", () => {
    expect(() =>
      ensureCanAcceptAccessRequest({ uid: "admin", caps: ["users.approve"] })
    ).toThrowError(HttpsError);
  });

  it("returns the caller uid when authorized", () => {
    expect(
      ensureCanAcceptAccessRequest({ uid: "admin", caps: ["allowlist.manage"] })
    ).toBe("admin");
  });
});

describe("acceptAccessRequest.ensureAssignableRole", () => {
  it("rejects the admin role (blocks privilege escalation via access requests)", () => {
    expect(() => ensureAssignableRole("admin")).toThrowError(HttpsError);
  });

  it("allows non-admin roles", () => {
    expect(() => ensureAssignableRole("veterinario_semplice")).not.toThrow();
    expect(() => ensureAssignableRole("titolare")).not.toThrow();
  });
});

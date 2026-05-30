import { describe, it, expect } from "vitest";
import { checkProviderEligibility } from "../beforeUserCreated.js";

describe("beforeUserCreated.checkProviderEligibility", () => {
  it("rejects providers outside the allow-list (google.com / password)", () => {
    expect(checkProviderEligibility({ provider: "facebook.com" })).toBe(
      "provider-not-allowed"
    );
    expect(checkProviderEligibility({ provider: "github.com" })).toBe(
      "provider-not-allowed"
    );
  });

  it("rejects password sign-up when the email is not verified", () => {
    expect(
      checkProviderEligibility({ provider: "password", emailVerified: false })
    ).toBe("email-not-verified");
    expect(checkProviderEligibility({ provider: "password" })).toBe(
      "email-not-verified"
    );
  });

  it("allows google.com", () => {
    expect(checkProviderEligibility({ provider: "google.com" })).toBeNull();
  });

  it("allows password with a verified email", () => {
    expect(
      checkProviderEligibility({ provider: "password", emailVerified: true })
    ).toBeNull();
  });

  it("does not deny here when the provider is absent", () => {
    expect(checkProviderEligibility({})).toBeNull();
  });
});

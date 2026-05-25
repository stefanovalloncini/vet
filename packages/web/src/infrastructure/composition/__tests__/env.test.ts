import { afterEach, describe, expect, it, vi } from "vitest";
import { loadVetEnv } from "../env";

describe("loadVetEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a complete VetEnv shape with required keys", () => {
    const env = loadVetEnv();
    expect(env.apiKey).toBeTruthy();
    expect(env.projectId).toBeTruthy();
    expect(env.authDomain).toBeTruthy();
    expect(env.appId).toBeTruthy();
    expect(typeof env.useEmulator).toBe("boolean");
  });

  it("sets useEmulator to true only for the literal string 'true'", () => {
    vi.stubEnv("VITE_FIREBASE_USE_EMULATOR", "true");
    expect(loadVetEnv().useEmulator).toBe(true);

    vi.stubEnv("VITE_FIREBASE_USE_EMULATOR", "false");
    expect(loadVetEnv().useEmulator).toBe(false);

    vi.stubEnv("VITE_FIREBASE_USE_EMULATOR", "yes");
    expect(loadVetEnv().useEmulator).toBe(false);
  });

  it("includes appCheckSiteKey only when set", () => {
    vi.stubEnv("VITE_FIREBASE_APP_CHECK_SITE_KEY", "");
    expect("appCheckSiteKey" in loadVetEnv()).toBe(false);

    vi.stubEnv("VITE_FIREBASE_APP_CHECK_SITE_KEY", "key-123");
    expect(loadVetEnv().appCheckSiteKey).toBe("key-123");
  });

  it("includes appCheckDebugToken only when set", () => {
    vi.stubEnv("VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN", "");
    expect("appCheckDebugToken" in loadVetEnv()).toBe(false);

    vi.stubEnv("VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN", "tok-456");
    expect(loadVetEnv().appCheckDebugToken).toBe("tok-456");
  });

  it("reads project values from env when provided", () => {
    vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "vet-prod");
    vi.stubEnv("VITE_FIREBASE_API_KEY", "real-key");
    const env = loadVetEnv();
    expect(env.projectId).toBe("vet-prod");
    expect(env.apiKey).toBe("real-key");
  });
});

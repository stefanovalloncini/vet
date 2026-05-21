import { describe, it, expect } from "vitest";
import { decideScriptTarget } from "../scriptSafety";

const PROD = "vet-marinoni";

describe("decideScriptTarget", () => {
  it("returns emulator when FIRESTORE_EMULATOR_HOST is set", () => {
    const r = decideScriptTarget({
      scriptName: "seed-roles",
      argv: [],
      env: { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080", FIREBASE_PROJECT_ID: "vet-dev" },
      expectedProductionProjectId: PROD,
    });
    expect(r.kind).toBe("emulator");
    if (r.kind === "emulator") {
      expect(r.emulatorHost).toBe("127.0.0.1:8080");
      expect(r.projectId).toBe("vet-dev");
    }
  });

  it("defaults emulator projectId to vet-dev when FIREBASE_PROJECT_ID is unset", () => {
    const r = decideScriptTarget({
      scriptName: "seed-roles",
      argv: [],
      env: { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080" },
      expectedProductionProjectId: PROD,
    });
    expect(r.kind).toBe("emulator");
    if (r.kind === "emulator") expect(r.projectId).toBe("vet-dev");
  });

  it("refuses when no emulator host and no --prod flag", () => {
    const r = decideScriptTarget({
      scriptName: "seed-roles",
      argv: [],
      env: {},
      expectedProductionProjectId: PROD,
    });
    expect(r.kind).toBe("refused");
    if (r.kind === "refused") expect(r.reason).toMatch(/FIRESTORE_EMULATOR_HOST/);
  });

  it("allows production when --prod and FIREBASE_PROJECT_ID matches expected", () => {
    const r = decideScriptTarget({
      scriptName: "seed-roles",
      argv: ["--prod"],
      env: { FIREBASE_PROJECT_ID: PROD },
      expectedProductionProjectId: PROD,
    });
    expect(r.kind).toBe("production");
    if (r.kind === "production") expect(r.projectId).toBe(PROD);
  });

  it("refuses production when --prod is set but FIREBASE_PROJECT_ID is missing", () => {
    const r = decideScriptTarget({
      scriptName: "seed-roles",
      argv: ["--prod"],
      env: {},
      expectedProductionProjectId: PROD,
    });
    expect(r.kind).toBe("refused");
    if (r.kind === "refused") expect(r.reason).toMatch(/FIREBASE_PROJECT_ID/);
  });

  it("refuses production when --prod is set but project id does not match expected", () => {
    const r = decideScriptTarget({
      scriptName: "seed-roles",
      argv: ["--prod"],
      env: { FIREBASE_PROJECT_ID: "some-other-project" },
      expectedProductionProjectId: PROD,
    });
    expect(r.kind).toBe("refused");
    if (r.kind === "refused") expect(r.reason).toMatch(/does not match/);
  });

  it("prefers emulator when both FIRESTORE_EMULATOR_HOST and --prod are set", () => {
    const r = decideScriptTarget({
      scriptName: "seed-roles",
      argv: ["--prod"],
      env: { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080", FIREBASE_PROJECT_ID: "vet-dev" },
      expectedProductionProjectId: PROD,
    });
    expect(r.kind).toBe("emulator");
  });

  it("includes the script name in banners", () => {
    const r = decideScriptTarget({
      scriptName: "seed-roles",
      argv: [],
      env: { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080" },
      expectedProductionProjectId: PROD,
    });
    if (r.kind === "emulator") {
      expect(r.banner).toMatch(/seed-roles/);
      expect(r.banner).toMatch(/emulator/i);
    }
  });

  it("production banner clearly labels the target as production", () => {
    const r = decideScriptTarget({
      scriptName: "rescue-admin",
      argv: ["--prod"],
      env: { FIREBASE_PROJECT_ID: PROD },
      expectedProductionProjectId: PROD,
    });
    if (r.kind === "production") {
      expect(r.banner).toMatch(/PRODUCTION/);
      expect(r.banner).toMatch(/vet-marinoni/);
    }
  });
});

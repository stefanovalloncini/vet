import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import { decideAccessRequestUpdate } from "../beforeUserCreated.js";

const fixedNow = Timestamp.fromDate(new Date("2026-05-21T10:00:00Z"));

describe("decideAccessRequestUpdate", () => {
  it("creates a new request when none exists", () => {
    const result = decideAccessRequestUpdate({
      existing: null,
      email: "Mario.Rossi@example.com",
      emailNorm: "mario.rossi@example.com",
      now: fixedNow,
    });
    expect(result.kind).toBe("create");
    if (result.kind !== "create") return;
    expect(result.doc).toMatchObject({
      emailNorm: "mario.rossi@example.com",
      email: "Mario.Rossi@example.com",
      firstAttemptAt: fixedNow,
      lastAttemptAt: fixedNow,
      attempts: 1,
      schemaVersion: 1,
    });
  });

  it("preserves optional fields when provided on create", () => {
    const result = decideAccessRequestUpdate({
      existing: null,
      email: "a@b.com",
      emailNorm: "a@b.com",
      displayName: "Mario",
      photoURL: "https://example.com/m.png",
      providerId: "google.com",
      now: fixedNow,
    });
    if (result.kind !== "create") throw new Error("expected create");
    expect(result.doc).toMatchObject({
      displayName: "Mario",
      photoURL: "https://example.com/m.png",
      providerId: "google.com",
    });
  });

  it("omits undefined optional fields entirely (Firestore strict)", () => {
    const result = decideAccessRequestUpdate({
      existing: null,
      email: "a@b.com",
      emailNorm: "a@b.com",
      now: fixedNow,
    });
    if (result.kind !== "create") throw new Error("expected create");
    expect(Object.keys(result.doc)).not.toContain("displayName");
    expect(Object.keys(result.doc)).not.toContain("photoURL");
    expect(Object.keys(result.doc)).not.toContain("providerId");
  });

  it("increments attempts and updates lastAttemptAt on existing request", () => {
    const result = decideAccessRequestUpdate({
      existing: { attempts: 3 },
      email: "a@b.com",
      emailNorm: "a@b.com",
      now: fixedNow,
    });
    expect(result.kind).toBe("update");
    if (result.kind !== "update") return;
    expect(result.patch).toMatchObject({
      lastAttemptAt: fixedNow,
      attempts: 4,
    });
    expect(result.patch).not.toHaveProperty("firstAttemptAt");
  });

  it("treats missing attempts on existing as 0", () => {
    const result = decideAccessRequestUpdate({
      existing: {},
      email: "a@b.com",
      emailNorm: "a@b.com",
      now: fixedNow,
    });
    if (result.kind !== "update") throw new Error("expected update");
    expect(result.patch).toMatchObject({ attempts: 1 });
  });

  it("returns storm when attempts have hit the cap", () => {
    const result = decideAccessRequestUpdate({
      existing: { attempts: 10000 },
      email: "a@b.com",
      emailNorm: "a@b.com",
      now: fixedNow,
    });
    expect(result.kind).toBe("storm");
    if (result.kind !== "storm") return;
    expect(result.attempts).toBe(10000);
  });
});

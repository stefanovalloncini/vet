import { describe, expect, it } from "vitest";
import { ensureCanRestore } from "../restore.js";
import { ensureCanPurge } from "../purge.js";

describe("ensureCanRestore", () => {
  it("allows owner with trash.restore.own", () => {
    expect(() =>
      ensureCanRestore(
        { uid: "u", email: "u@x.com", caps: ["trash.restore.own"] },
        "u"
      )
    ).not.toThrow();
  });

  it("denies owner without trash.restore.own", () => {
    expect(() =>
      ensureCanRestore(
        { uid: "u", email: "u@x.com", caps: [] },
        "u"
      )
    ).toThrow();
  });

  it("denies non-owner with trash.restore.own", () => {
    expect(() =>
      ensureCanRestore(
        { uid: "u", email: "u@x.com", caps: ["trash.restore.own"] },
        "owner"
      )
    ).toThrow();
  });

  it("allows any caller with trash.restore.any", () => {
    expect(() =>
      ensureCanRestore(
        { uid: "u", email: "u@x.com", caps: ["trash.restore.any"] },
        "owner"
      )
    ).not.toThrow();
  });

  it("denies unauthenticated", () => {
    expect(() => ensureCanRestore(null, "owner")).toThrow();
  });
});

describe("ensureCanPurge", () => {
  it("allows caller with trash.purge", () => {
    expect(() =>
      ensureCanPurge({ uid: "u", email: "u@x.com", caps: ["trash.purge"] })
    ).not.toThrow();
  });

  it("denies caller without trash.purge", () => {
    expect(() =>
      ensureCanPurge({ uid: "u", email: "u@x.com", caps: ["trash.restore.any"] })
    ).toThrow();
  });

  it("denies unauthenticated", () => {
    expect(() => ensureCanPurge(null)).toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { SHARED_PACKAGE_VERSION } from "../index.js";

describe("@vet/shared sanity", () => {
  it("exposes a version sentinel", () => {
    expect(SHARED_PACKAGE_VERSION).toBe("0.0.0");
  });
});

import { describe, expect, it } from "vitest";

describe("@vet/functions sanity", () => {
  it(
    "module imports resolve",
    async () => {
      const mod = await import("../index");
      expect(mod.ping).toBeDefined();
    },
    30_000
  );
});

import { describe, it, expect } from "vitest";
import { probeCookies, probeLocalStorage } from "../probes";

describe("probeCookies", () => {
  it("reports under the 'cookies' name", async () => {
    const r = await probeCookies();
    expect(r.name).toBe("cookies");
  });
});

describe("probeLocalStorage", () => {
  it("reports under the 'localStorage' name", async () => {
    const r = await probeLocalStorage();
    expect(r.name).toBe("localStorage");
  });

  it("includes a reason when the probe fails", async () => {
    const r = await probeLocalStorage();
    if (!r.ok) {
      expect(typeof r.reason).toBe("string");
      expect((r.reason ?? "").length).toBeGreaterThan(0);
    } else {
      expect(r.ok).toBe(true);
    }
  });
});

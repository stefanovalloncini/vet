import { describe, expect, it } from "vitest";
import { statusFor } from "../cardStatus";

describe("statusFor", () => {
  it("is 'unpaid' when there are unsaldati conti", () => {
    const s = statusFor(true, false);
    expect(s.key).toBe("unpaid");
    expect(s.label).toBe("Conti non saldati");
    expect(s.tone).toBeTruthy();
  });

  it("lets unsaldati take priority over needs-new-conto", () => {
    expect(statusFor(true, true).key).toBe("unpaid");
  });

  it("is 'todo' when a new conto is needed and nothing is unpaid", () => {
    const s = statusFor(false, true);
    expect(s.key).toBe("todo");
    expect(s.label).toBe("Da emettere");
  });

  it("is 'ok' when everything is settled", () => {
    const s = statusFor(false, false);
    expect(s.key).toBe("ok");
    expect(s.label).toBe("Tutto saldato");
  });
});

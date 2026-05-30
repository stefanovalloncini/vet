import { describe, it, expect } from "vitest";
import { makeConto } from "@vet/shared/testing";
import { countAlreadyBilled } from "../alreadyBilled";

describe("countAlreadyBilled", () => {
  it("counts ids already in an emesso, non-deleted conto", () => {
    const conti = [
      makeConto({ modalita: "emesso", isDeleted: false, attivitaIds: ["a", "b"] }),
    ];
    expect(countAlreadyBilled(["a", "b", "c"], conti)).toBe(2);
  });

  it("ignores proforma conti (a proforma does not bill)", () => {
    const conti = [
      makeConto({ modalita: "proforma", isDeleted: false, attivitaIds: ["a"] }),
    ];
    expect(countAlreadyBilled(["a", "b"], conti)).toBe(0);
  });

  it("ignores cancelled (isDeleted) conti", () => {
    const conti = [
      makeConto({ modalita: "emesso", isDeleted: true, attivitaIds: ["a"] }),
    ];
    expect(countAlreadyBilled(["a"], conti)).toBe(0);
  });

  it("dedupes ids billed across multiple conti", () => {
    const conti = [
      makeConto({ id: "c1", modalita: "emesso", isDeleted: false, attivitaIds: ["a"] }),
      makeConto({ id: "c2", modalita: "emesso", isDeleted: false, attivitaIds: ["a", "b"] }),
    ];
    expect(countAlreadyBilled(["a", "b", "c"], conti)).toBe(2);
  });

  it("returns 0 when nothing overlaps or there are no conti", () => {
    expect(countAlreadyBilled(["a"], [])).toBe(0);
    expect(
      countAlreadyBilled(["x"], [
        makeConto({ modalita: "emesso", isDeleted: false, attivitaIds: ["a"] }),
      ])
    ).toBe(0);
  });
});

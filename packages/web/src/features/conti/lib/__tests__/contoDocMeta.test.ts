import { describe, expect, it } from "vitest";
import { contoFilenameStem, contoNumeroFor } from "../contoDocMeta";

describe("contoFilenameStem", () => {
  it("builds a proforma stem with zero-padded date", () => {
    expect(
      contoFilenameStem({
        modalita: "proforma",
        aziendaNomeNorm: "rossi",
        emessoIl: new Date(2026, 4, 29),
      })
    ).toBe("proforma_rossi_20260529");
  });

  it("uses the conto stem for emesso and pads single-digit month/day", () => {
    expect(
      contoFilenameStem({
        modalita: "emesso",
        aziendaNomeNorm: "rossi",
        emessoIl: new Date(2026, 0, 5),
      })
    ).toBe("conto_rossi_20260105");
  });

  it("falls back to 'azienda' when the normalized name is empty", () => {
    expect(
      contoFilenameStem({
        modalita: "emesso",
        aziendaNomeNorm: "",
        emessoIl: new Date(2026, 0, 5),
      })
    ).toBe("conto_azienda_20260105");
  });
});

describe("contoNumeroFor", () => {
  it("encodes year, unpadded month, padded day, and padded time", () => {
    expect(contoNumeroFor(new Date(2026, 4, 29, 14, 5))).toBe("2026-529-1405");
  });

  it("pads day, hours, and minutes but not the month", () => {
    expect(contoNumeroFor(new Date(2026, 0, 5, 9, 3))).toBe("2026-105-0903");
  });
});

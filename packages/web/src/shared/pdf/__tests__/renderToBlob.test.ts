import { describe, expect, it, vi } from "vitest";

// @react-pdf/renderer requires a real browser/Node Canvas pipeline to produce
// an actual PDF binary. jsdom does not provide one, so we mock `pdf()` and
// assert that `renderPdfToBlob` calls it correctly and returns the right
// filename/Blob shape. Real-document rendering is exercised by the integration
// tests in the conto/riepilogo feature flows (and at runtime in the browser).
vi.mock("@react-pdf/renderer", async () => {
  const actual = await vi.importActual<typeof import("@react-pdf/renderer")>(
    "@react-pdf/renderer",
  );
  return {
    ...actual,
    pdf: vi.fn(() => ({
      toBlob: vi.fn(async () => new Blob(["%PDF-1.4 stub"], {
        type: "application/pdf",
      })),
      toString: () => "",
      toBuffer: vi.fn(),
      container: {},
      isDirty: () => false,
      on: vi.fn(),
      updateContainer: vi.fn(),
      removeListener: vi.fn(),
    })),
  };
});

import { pdf } from "@react-pdf/renderer";
import { renderPdfToBlob } from "../renderToBlob";
import { RiepilogoDocument } from "../RiepilogoDocument";
import type { RiepilogoPdfData } from "../shared/types";

function buildMinimalData(): RiepilogoPdfData {
  return {
    azienda: { nome: "Allevamento Demo" },
    righe: [],
    periodo: { from: null, to: null },
    emessoIl: new Date(2026, 4, 27),
    totale: 0,
  };
}

describe("renderPdfToBlob", () => {
  it("returns a Blob with PDF content-type", async () => {
    const data = buildMinimalData();
    const result = await renderPdfToBlob(
      RiepilogoDocument({ data }),
      "riepilogo-test",
    );

    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.blob.type).toBe("application/pdf");
  });

  it("appends a .pdf extension to the filename stem", async () => {
    const data = buildMinimalData();
    const result = await renderPdfToBlob(
      RiepilogoDocument({ data }),
      "conto-2026-001",
    );

    expect(result.filename).toBe("conto-2026-001.pdf");
    expect(result.filename.endsWith(".pdf")).toBe(true);
  });

  it("invokes the @react-pdf/renderer pdf() factory with the document", async () => {
    const data = buildMinimalData();
    const doc = RiepilogoDocument({ data });
    await renderPdfToBlob(doc, "stem");
    expect(pdf).toHaveBeenCalledWith(doc);
  });
});

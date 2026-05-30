import { describe, expect, it } from "vitest";
import { makeAttivita } from "@vet/shared/testing";
import { renderHtmlReport } from "../monthlyInvoice";

describe("renderHtmlReport", () => {
  it("escapes a malicious azienda name and tipo (no HTML injection in the email)", () => {
    const html = renderHtmlReport({
      aziendaNome: "<script>alert('xss')</script>",
      periodLabel: "maggio 2026",
      items: [
        makeAttivita({
          tipoNome: '"><img src=x onerror=alert(1)>',
          totale: 100,
        }),
      ],
      total: 100,
    });

    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img");
  });

  it("renders the period, totals, and a row per item", () => {
    const items = [
      makeAttivita({ tipoNome: "Visita", totale: 50 }),
      makeAttivita({ tipoNome: "Controllo", totale: 70 }),
    ];
    const html = renderHtmlReport({
      aziendaNome: "Cascina Verdi",
      periodLabel: "maggio 2026",
      items,
      total: 120,
    });

    expect(html).toContain("Cascina Verdi");
    expect(html).toContain("maggio 2026");
    expect(html).toContain("Visita");
    expect(html).toContain("Controllo");
    // one row per item, plus the thead and tfoot rows
    expect((html.match(/<tr>/g) ?? []).length).toBe(items.length + 2);
  });
});

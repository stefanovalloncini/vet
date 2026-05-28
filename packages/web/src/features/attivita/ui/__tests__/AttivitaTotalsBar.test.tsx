import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AttivitaTotalsBar } from "../AttivitaTotalsBar";

const itCount = new Intl.NumberFormat("it-IT");

describe("AttivitaTotalsBar", () => {
  it("renders the four labelled stats", () => {
    render(
      <AttivitaTotalsBar
        totals={{ count: 3, aziende: 2, vets: 1, totale: 150 }}
      />
    );
    expect(screen.getByText("Voci")).toBeInTheDocument();
    expect(screen.getByText("Aziende")).toBeInTheDocument();
    expect(screen.getByText("Veterinari")).toBeInTheDocument();
    expect(screen.getByText("Totale")).toBeInTheDocument();
  });

  it("formats counts with the locale's grouping (Italian)", () => {
    render(
      <AttivitaTotalsBar
        totals={{ count: 1234, aziende: 1000, vets: 12, totale: 0 }}
      />
    );
    expect(screen.getByText(itCount.format(1234))).toBeInTheDocument();
    expect(screen.getByText(itCount.format(1000))).toBeInTheDocument();
  });

  it("renders the total with an Italian decimal comma", () => {
    render(
      <AttivitaTotalsBar
        totals={{ count: 1, aziende: 1, vets: 1, totale: 1234.5 }}
      />
    );
    expect(screen.getByText(/234,50/)).toBeInTheDocument();
  });

  it("exposes the stats group as a polite live region", () => {
    const { container } = render(
      <AttivitaTotalsBar
        totals={{ count: 0, aziende: 0, vets: 0, totale: 0 }}
      />
    );
    const dl = container.querySelector("dl");
    expect(dl).not.toBeNull();
    expect(dl).toHaveAttribute("aria-live", "polite");
  });

  it("renders very large totals without throwing", () => {
    render(
      <AttivitaTotalsBar
        totals={{ count: 99999, aziende: 5000, vets: 99, totale: 9_999_999.99 }}
      />
    );
    expect(screen.getByText(itCount.format(99999))).toBeInTheDocument();
    expect(screen.getByText(/999,99/)).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { UseRiepilogoPdfResult } from "../../hooks/useRiepilogoPdf";
import { RiepilogoPdfPage } from "../RiepilogoPdfPage";

vi.mock("../../hooks/useRiepilogoPdf", () => ({
  useRiepilogoPdf: vi.fn(),
}));

vi.mock("../../../conti", () => ({
  defaultPeriodoFor: () => ({
    from: new Date("2026-05-01"),
    to: new Date("2026-05-31"),
  }),
}));

import { useRiepilogoPdf } from "../../hooks/useRiepilogoPdf";

const useRiepilogoPdfMock = useRiepilogoPdf as unknown as ReturnType<typeof vi.fn>;

function baseResult(over: Partial<UseRiepilogoPdfResult> = {}): UseRiepilogoPdfResult {
  return {
    loading: false,
    error: null,
    summary: null,
    generatePdf: vi.fn().mockResolvedValue(undefined),
    shareWhatsApp: vi.fn(),
    ...over,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/aziende/az1/riepilogo"]}>
      <Routes>
        <Route path="/aziende/:id/riepilogo" element={<RiepilogoPdfPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("RiepilogoPdfPage status states", () => {
  it("shows the loading hint while pending", () => {
    useRiepilogoPdfMock.mockReturnValue(baseResult({ loading: true }));
    renderPage();
    expect(screen.getByText("Caricamento…")).toBeInTheDocument();
  });

  it("shows the not-found message for a missing azienda", () => {
    useRiepilogoPdfMock.mockReturnValue(
      baseResult({ error: "not-found", summary: null })
    );
    renderPage();
    expect(screen.getByRole("alert")).toHaveTextContent("Cliente non trovato.");
    expect(
      screen.getByRole("button", { name: /Torna indietro/i })
    ).toBeInTheDocument();
  });

  it("shows a distinct message when the load fails", () => {
    useRiepilogoPdfMock.mockReturnValue(
      baseResult({ error: "load-failed", summary: null })
    );
    renderPage();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Caricamento del riepilogo non riuscito."
    );
    expect(
      screen.queryByText("Cliente non trovato.")
    ).not.toBeInTheDocument();
  });
});

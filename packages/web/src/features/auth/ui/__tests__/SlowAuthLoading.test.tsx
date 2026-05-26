import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { SlowAuthLoading } from "../SlowAuthLoading";

function renderInRouter(node: React.ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

describe("SlowAuthLoading", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the static label initially with no slow hint or diagnostic link", () => {
    renderInRouter(<SlowAuthLoading label="Verifica…" />);
    expect(screen.getByText("Verifica…")).toBeInTheDocument();
    expect(
      screen.queryByText(/Sta impiegando più del solito/)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /verifica di sicurezza/i })
    ).not.toBeInTheDocument();
  });

  it("shows the slow hint after 8 seconds", () => {
    renderInRouter(<SlowAuthLoading label="Verifica…" />);
    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(
      screen.getByText(/Sta impiegando più del solito/)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /verifica di sicurezza/i })
    ).not.toBeInTheDocument();
  });

  it("shows the diagnostic link after 15 seconds", () => {
    renderInRouter(<SlowAuthLoading label="Verifica…" />);
    act(() => {
      vi.advanceTimersByTime(15000);
    });
    expect(
      screen.getByRole("link", { name: /verifica di sicurezza/i })
    ).toBeInTheDocument();
  });

  it("progresses through staged labels at their thresholds", () => {
    renderInRouter(
      <SlowAuthLoading
        stages={[
          { atMs: 0, label: "Verifica del link…" },
          { atMs: 3000, label: "Controllo dell'autorizzazione…" },
          { atMs: 7000, label: "Apertura della sessione…" },
        ]}
      />
    );
    expect(screen.getByText("Verifica del link…")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(
      screen.getByText("Controllo dell'autorizzazione…")
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText("Apertura della sessione…")).toBeInTheDocument();
  });

  it("uses /sicurezza as the default diagnostic target", () => {
    renderInRouter(<SlowAuthLoading label="Verifica…" />);
    act(() => {
      vi.advanceTimersByTime(15000);
    });
    const link = screen.getByRole("link", { name: /verifica di sicurezza/i });
    expect(link).toHaveAttribute("href", "/sicurezza");
  });
});

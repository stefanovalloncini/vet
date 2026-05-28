import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { ProbeResult } from "../../lib/probes";

const probeCookies = vi.fn<() => Promise<ProbeResult>>();
const probeLocalStorage = vi.fn<() => Promise<ProbeResult>>();
const probeAppCheckToken = vi.fn<() => Promise<ProbeResult>>();

vi.mock("../../lib/probes", () => ({
  probeCookies: () => probeCookies(),
  probeLocalStorage: () => probeLocalStorage(),
  probeAppCheckToken: () => probeAppCheckToken(),
}));

import { SicurezzaPage } from "../SicurezzaPage";

function ok(name: ProbeResult["name"]): ProbeResult {
  return { name, ok: true };
}
function fail(name: ProbeResult["name"], reason: string): ProbeResult {
  return { name, ok: false, reason };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/sicurezza"]}>
      <SicurezzaPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  probeCookies.mockResolvedValue(ok("cookies"));
  probeLocalStorage.mockResolvedValue(ok("localStorage"));
  probeAppCheckToken.mockResolvedValue(ok("appCheckToken"));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("SicurezzaPage", () => {
  it("renders exactly one h1", async () => {
    renderPage();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    await waitFor(() =>
      expect(screen.getByText(/Tutto a posto/i)).toBeInTheDocument()
    );
  });

  it("lists every probe label", async () => {
    renderPage();
    expect(screen.getByText("Cookie del browser")).toBeInTheDocument();
    expect(screen.getByText("Memoria locale del browser")).toBeInTheDocument();
    expect(screen.getByText(/Token anti-bot/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/Tutto a posto/i)).toBeInTheDocument()
    );
  });

  it("announces the success outcome through a live region", async () => {
    renderPage();
    const allOk = await screen.findByText(/Tutto a posto/i);
    const live = allOk.closest("[role='status']");
    expect(live).not.toBeNull();
    expect(live).toHaveAttribute("aria-live", "polite");
  });

  it("shows remediation copy when a probe fails", async () => {
    probeAppCheckToken.mockResolvedValue(
      fail("appCheckToken", "blocked by extension")
    );
    renderPage();
    await waitFor(() =>
      expect(
        screen.getByText(/non riesce a completare la verifica anti-bot/i)
      ).toBeInTheDocument()
    );
    expect(screen.queryByText(/Tutto a posto/i)).not.toBeInTheDocument();
  });

  it("renders the failing probe reason without breaking on long strings", async () => {
    probeLocalStorage.mockResolvedValue(
      fail("localStorage", "z".repeat(180))
    );
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("z".repeat(180))).toBeInTheDocument()
    );
  });

  it("re-runs the probes when Riprova is clicked", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/Tutto a posto/i)).toBeInTheDocument()
    );
    const calls = probeCookies.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: /Riprova/i }));
    await waitFor(() =>
      expect(probeCookies.mock.calls.length).toBeGreaterThan(calls)
    );
  });

  it("marks the probe list busy while running", async () => {
    let resolveCookies: (r: ProbeResult) => void = () => {};
    probeCookies.mockReturnValue(
      new Promise<ProbeResult>((res) => {
        resolveCookies = res;
      })
    );
    renderPage();
    const list = screen.getByRole("list");
    expect(list).toHaveAttribute("aria-busy", "true");
    resolveCookies(ok("cookies"));
    await waitFor(() => expect(list).toHaveAttribute("aria-busy", "false"));
  });
});

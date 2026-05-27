import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ActorContext, Repositories } from "@vet/shared";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { useRiepilogoPdf } from "../useRiepilogoPdf";

vi.mock("../../../../shared/pdf", () => ({
  RiepilogoDocument: () => null,
  downloadPdf: vi.fn().mockResolvedValue(undefined),
  openWhatsappShare: vi.fn().mockReturnValue(true),
}));

const actor: ActorContext = {
  uid: "vet-1",
  email: "vet@example.com",
  displayName: "Dr Rossi",
  roleId: "vet",
  caps: new Set(),
  approved: true,
};

async function seed(repos: Repositories): Promise<{ aziendaId: string }> {
  const { id: aziendaId } = await repos.aziende.create(
    { nome: "Allevamento Demo", indirizzo: "Via 1", piva: "12345" },
    actor
  );
  await repos.attivita.create(
    {
      data: new Date("2026-04-10T10:00:00Z"),
      aziendaId,
      tipoId: "visita",
      oraria: false, adElemento: false,
      tariffa: 50,
    },
    { aziendaNome: "Allevamento Demo", tipoNome: "Visita" },
    actor
  );
  await repos.attivita.create(
    {
      data: new Date("2026-04-15T10:00:00Z"),
      aziendaId,
      tipoId: "visita",
      oraria: true,
      adElemento: false,
      tariffa: 30,
      ore: 2,
    },
    { aziendaNome: "Allevamento Demo", tipoNome: "Visita" },
    actor
  );
  return { aziendaId };
}

function wrap(repos: Repositories) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
      </QueryClientProvider>
    );
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useRiepilogoPdf", () => {
  beforeEach(() => {
    Object.defineProperty(window, "print", { configurable: true, value: vi.fn() });
    Object.defineProperty(window, "open", { configurable: true, value: vi.fn() });
  });

  it("loads azienda and aggregates totals sorted by date", async () => {
    const repos = createInMemoryRepositories();
    const { aziendaId } = await seed(repos);
    const { result } = renderHook(
      () => useRiepilogoPdf({ aziendaId, fromStr: "", toStr: "" }),
      { wrapper: wrap(repos) }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.summary?.azienda.nome).toBe("Allevamento Demo");
    expect(result.current.summary?.items).toHaveLength(2);
    expect(result.current.summary?.total).toBeCloseTo(110, 2);
    expect(result.current.summary?.items[0]?.data.getTime()).toBeLessThan(
      result.current.summary!.items[1]!.data.getTime()
    );
  });

  it("filters by date range from query strings", async () => {
    const repos = createInMemoryRepositories();
    const { aziendaId } = await seed(repos);
    const { result } = renderHook(
      () =>
        useRiepilogoPdf({
          aziendaId,
          fromStr: "2026-04-12",
          toStr: "2026-04-20",
        }),
      { wrapper: wrap(repos) }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.summary?.items).toHaveLength(1);
    expect(result.current.summary?.total).toBeCloseTo(60, 2);
    expect(result.current.summary?.from).toBeInstanceOf(Date);
    expect(result.current.summary?.to).toBeInstanceOf(Date);
  });

  it("returns not-found error when azienda missing", async () => {
    const repos = createInMemoryRepositories();
    const { result } = renderHook(
      () => useRiepilogoPdf({ aziendaId: "missing", fromStr: "", toStr: "" }),
      { wrapper: wrap(repos) }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("not-found");
    expect(result.current.summary).toBeNull();
  });

  it("returns not-found when aziendaId is empty", async () => {
    const repos = createInMemoryRepositories();
    const { result } = renderHook(
      () => useRiepilogoPdf({ aziendaId: "", fromStr: "", toStr: "" }),
      { wrapper: wrap(repos) }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("not-found");
  });

  it("surfaces load-failed when repository throws", async () => {
    const repos = createInMemoryRepositories();
    vi.spyOn(repos.aziende, "getById").mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(
      () => useRiepilogoPdf({ aziendaId: "x", fromStr: "", toStr: "" }),
      { wrapper: wrap(repos) }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("load-failed");
  });

  it("generatePdf calls downloadPdf with the summary", async () => {
    const { downloadPdf } = await import("../../../../shared/pdf");
    (downloadPdf as ReturnType<typeof vi.fn>).mockClear();
    const repos = createInMemoryRepositories();
    const { aziendaId } = await seed(repos);
    const { result } = renderHook(
      () => useRiepilogoPdf({ aziendaId, fromStr: "", toStr: "" }),
      { wrapper: wrap(repos) }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.generatePdf();
      // wait microtask for the mocked downloadPdf promise
      await new Promise<void>((r) => setTimeout(r, 0));
    });
    expect(downloadPdf).toHaveBeenCalledTimes(1);
    const filenameStem = (downloadPdf as ReturnType<typeof vi.fn>).mock.calls[0]?.[1];
    expect(typeof filenameStem).toBe("string");
    expect(filenameStem).toContain("riepilogo");
  });

  it("shareWhatsApp opens a wa.me link with totals", async () => {
    const { openWhatsappShare } = await import("../../../../shared/pdf");
    (openWhatsappShare as ReturnType<typeof vi.fn>).mockClear();
    const repos = createInMemoryRepositories();
    const { aziendaId } = await seed(repos);
    const { result } = renderHook(
      () => useRiepilogoPdf({ aziendaId, fromStr: "", toStr: "" }),
      { wrapper: wrap(repos) }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.shareWhatsApp());
    expect(openWhatsappShare).toHaveBeenCalledTimes(1);
    const call = (openWhatsappShare as ReturnType<typeof vi.fn>).mock.calls[0];
    const text = String(call?.[0]?.text ?? "");
    expect(text).toContain("Allevamento Demo");
    expect(text).toContain("Totale");
  });

  it("shareWhatsApp is a no-op when summary missing", async () => {
    const { openWhatsappShare } = await import("../../../../shared/pdf");
    (openWhatsappShare as ReturnType<typeof vi.fn>).mockClear();
    const repos = createInMemoryRepositories();
    const { result } = renderHook(
      () => useRiepilogoPdf({ aziendaId: "missing", fromStr: "", toStr: "" }),
      { wrapper: wrap(repos) }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.shareWhatsApp());
    expect(openWhatsappShare).not.toHaveBeenCalled();
  });
});

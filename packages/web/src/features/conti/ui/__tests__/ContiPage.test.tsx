import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type {
  ActorContext,
  Capability,
  Conto,
  Repositories,
} from "@vet/shared";
import {
  InMemoryAuthService,
  InMemoryContiRepository,
} from "@vet/shared/testing";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { ContiPage } from "../ContiPage";

vi.mock("../../../../shared/ui/AppShell", () => ({
  AppShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

function actor(caps: Capability[]): ActorContext {
  return {
    uid: "vet-1",
    email: "vet@example.com",
    displayName: "Vet One",
    roleId: "vet",
    caps: new Set(caps),
    approved: true,
  };
}

function buildRepos(caps: Capability[]): {
  repos: Repositories;
  conti: InMemoryContiRepository;
  auth: InMemoryAuthService;
} {
  const auth = new InMemoryAuthService();
  auth.setSimulatedUser(actor(caps));
  const conti = new InMemoryContiRepository();
  return {
    repos: { auth, conti } as unknown as Repositories,
    conti,
    auth,
  };
}

async function seedConto(
  conti: InMemoryContiRepository,
  over: Partial<Conto>,
  modalita: Conto["modalita"] = "emesso"
): Promise<string> {
  const a = actor(["conti.emit", "conti.proforma", "conti.saldo"]);
  const id = await conti.emit(
    {
      aziendaId: over.aziendaId ?? "az1",
      periodoFrom: over.periodoFrom ?? new Date("2026-01-01T00:00:00Z"),
      periodoTo: over.periodoTo ?? new Date("2026-03-31T23:59:59Z"),
      modalita,
    },
    {
      aziendaNome: over.aziendaNome ?? "Cascina Verdi",
      attivitaIds: over.attivitaIds ?? ["a1", "a2"],
      totaleConto: over.totaleConto ?? 250,
    },
    a
  );
  if (over.saldato) {
    await conti.saldo({ contoId: id }, a);
  }
  return id;
}

describe("ContiPage", () => {
  it("renders the empty state when there are no conti", async () => {
    const { repos } = buildRepos(["conti.saldo"]);
    render(<ContiPage />, {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    });
    await waitFor(() =>
      expect(screen.getByText(/Nessun conto emesso/i)).toBeInTheDocument()
    );
  });

  it("filters to only non-saldati by default", async () => {
    const { repos, conti } = buildRepos(["conti.saldo"]);
    await seedConto(conti, { aziendaNome: "Cascina A", saldato: false });
    await seedConto(conti, { aziendaNome: "Cascina B", saldato: true });
    render(<ContiPage />, {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    });
    await waitFor(() =>
      expect(screen.getByText("Cascina A")).toBeInTheDocument()
    );
    expect(screen.queryByText("Cascina B")).toBeNull();
  });

  it("toggles to show all conti, including saldati and pro forma", async () => {
    const { repos, conti } = buildRepos(["conti.saldo"]);
    await seedConto(conti, { aziendaNome: "Cascina A", saldato: false });
    await seedConto(conti, { aziendaNome: "Cascina B", saldato: true });
    await seedConto(conti, { aziendaNome: "Cascina C" }, "proforma");
    render(<ContiPage />, {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    });
    await waitFor(() =>
      expect(screen.getByText("Cascina A")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByLabelText(/Mostra solo non saldati/i));
    await waitFor(() =>
      expect(screen.getByText("Cascina B")).toBeInTheDocument()
    );
    expect(screen.getByText("Cascina A")).toBeInTheDocument();
    expect(screen.getByText("Cascina C")).toBeInTheDocument();
  });

  it("shows the correct status badge per row", async () => {
    const { repos, conti } = buildRepos(["conti.saldo"]);
    await seedConto(conti, { aziendaNome: "Cascina A" }, "proforma");
    await seedConto(conti, { aziendaNome: "Cascina B", saldato: true });
    await seedConto(conti, { aziendaNome: "Cascina C", saldato: false });
    render(<ContiPage />, {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    });
    // Show all.
    await waitFor(() =>
      expect(screen.getByText("Cascina C")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByLabelText(/Mostra solo non saldati/i));
    await waitFor(() =>
      expect(screen.getByText("Cascina A")).toBeInTheDocument()
    );
    expect(screen.getByText("Pro forma")).toBeInTheDocument();
    expect(screen.getByText("Saldato")).toBeInTheDocument();
    expect(screen.getByText("Non saldato")).toBeInTheDocument();
  });

  it("shows 'Segna saldato' only on emesso+non-saldato rows for users with conti.saldo", async () => {
    const { repos, conti } = buildRepos(["conti.saldo"]);
    await seedConto(conti, { aziendaNome: "Cascina A" }, "proforma");
    await seedConto(conti, { aziendaNome: "Cascina B", saldato: true });
    await seedConto(conti, { aziendaNome: "Cascina C", saldato: false });
    render(<ContiPage />, {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    });
    fireEvent.click(screen.getByLabelText(/Mostra solo non saldati/i));
    await waitFor(() =>
      expect(screen.getByText("Cascina A")).toBeInTheDocument()
    );
    // Only 1 Segna saldato button — for the non-saldato emesso row.
    const buttons = screen.getAllByRole("button", { name: /Segna saldato/i });
    expect(buttons).toHaveLength(1);
  });

  it("hides 'Segna saldato' for users without conti.saldo cap", async () => {
    const { repos, conti } = buildRepos([]);
    await seedConto(conti, { aziendaNome: "Cascina C", saldato: false });
    render(<ContiPage />, {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    });
    await waitFor(() =>
      expect(screen.getByText("Cascina C")).toBeInTheDocument()
    );
    expect(
      screen.queryByRole("button", { name: /Segna saldato/i })
    ).toBeNull();
  });

  it("opens the dialog when 'Segna saldato' is clicked", async () => {
    const { repos, conti } = buildRepos(["conti.saldo"]);
    await seedConto(conti, { aziendaNome: "Cascina C", saldato: false });
    render(<ContiPage />, {
      wrapper: buildProvidersWrapper({
        repos,
        withRouter: true,
        withToast: true,
      }),
    });
    await waitFor(() =>
      expect(screen.getByText("Cascina C")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /Segna saldato/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(/Segna saldato: Cascina C/i)
    ).toBeInTheDocument();
  });

  it("calls saldo on the repo when the dialog is confirmed", async () => {
    const { repos, conti } = buildRepos(["conti.saldo"]);
    await seedConto(conti, {
      aziendaNome: "Cascina C",
      saldato: false,
      totaleConto: 425,
    });
    const saldoSpy = vi.spyOn(conti, "saldo");
    render(<ContiPage />, {
      wrapper: buildProvidersWrapper({
        repos,
        withRouter: true,
        withToast: true,
      }),
    });
    await waitFor(() =>
      expect(screen.getByText("Cascina C")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /Segna saldato/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Conferma$/i }));
    await waitFor(() => expect(saldoSpy).toHaveBeenCalledTimes(1));
    const [input] = saldoSpy.mock.calls[0] ?? [];
    expect(input?.importoSaldato).toBe(425);
  });
});

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
  InMemoryAziendeRepository,
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

interface Harness {
  repos: Repositories;
  conti: InMemoryContiRepository;
  aziende: InMemoryAziendeRepository;
  auth: InMemoryAuthService;
}

function buildHarness(caps: Capability[]): Harness {
  const auth = new InMemoryAuthService();
  auth.setSimulatedUser(actor(caps));
  const conti = new InMemoryContiRepository();
  const aziende = new InMemoryAziendeRepository();
  return {
    repos: { auth, conti, aziende } as unknown as Repositories,
    conti,
    aziende,
    auth,
  };
}

async function seedAzienda(
  aziende: InMemoryAziendeRepository,
  nome: string
): Promise<string> {
  return aziende.create(
    { nome },
    actor(["aziende.create"])
  );
}

async function seedConto(
  conti: InMemoryContiRepository,
  aziendaId: string,
  aziendaNome: string,
  over: Partial<Conto> = {},
  modalita: Conto["modalita"] = "emesso"
): Promise<string> {
  const a = actor(["conti.emit", "conti.proforma", "conti.saldo"]);
  const id = await conti.emit(
    {
      aziendaId,
      periodoFrom: over.periodoFrom ?? new Date("2026-01-01T00:00:00Z"),
      periodoTo: over.periodoTo ?? new Date("2026-03-31T23:59:59Z"),
      modalita,
    },
    {
      aziendaNome,
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
  it("shows the empty state when no conti exist", async () => {
    const { repos, aziende } = buildHarness(["conti.proforma"]);
    await seedAzienda(aziende, "Cascina Verdi");
    render(<ContiPage />, {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    });
    await waitFor(() =>
      expect(screen.getByText(/Nessun conto emesso/i)).toBeInTheDocument()
    );
    // Even though Cascina Verdi exists, no conto means it doesn't show.
    expect(screen.queryByText("Cascina Verdi")).toBeNull();
  });

  it("lists aziende with conti in alphabetical order", async () => {
    const { repos, conti, aziende } = buildHarness(["conti.proforma"]);
    const idB = await seedAzienda(aziende, "Cascina Bianchi");
    const idA = await seedAzienda(aziende, "Allevamento Rossi");
    const idC = await seedAzienda(aziende, "Stalla Verdi");
    await seedConto(conti, idB, "Cascina Bianchi");
    await seedConto(conti, idA, "Allevamento Rossi");
    await seedConto(conti, idC, "Stalla Verdi");
    render(<ContiPage />, {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    });
    await waitFor(() =>
      expect(screen.getByText("Cascina Bianchi")).toBeInTheDocument()
    );
    const names = screen
      .getAllByRole("heading", { level: 2 })
      .map((h) => h.textContent);
    expect(names).toEqual([
      "Allevamento Rossi",
      "Cascina Bianchi",
      "Stalla Verdi",
    ]);
  });

  it("hides aziende whose conti are all saldati when the 'solo non saldati' toggle is on", async () => {
    const { repos, conti, aziende } = buildHarness(["conti.proforma"]);
    const id1 = await seedAzienda(aziende, "Cascina A");
    const id2 = await seedAzienda(aziende, "Cascina B");
    await seedConto(conti, id1, "Cascina A", { saldato: false });
    await seedConto(conti, id2, "Cascina B", { saldato: true });
    render(<ContiPage />, {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    });
    await waitFor(() =>
      expect(screen.getByText("Cascina A")).toBeInTheDocument()
    );
    expect(screen.queryByText("Cascina B")).toBeNull();
  });

  it("shows all aziende with conti when the toggle is off", async () => {
    const { repos, conti, aziende } = buildHarness(["conti.proforma"]);
    const id1 = await seedAzienda(aziende, "Cascina A");
    const id2 = await seedAzienda(aziende, "Cascina B");
    await seedConto(conti, id1, "Cascina A", { saldato: false });
    await seedConto(conti, id2, "Cascina B", { saldato: true });
    render(<ContiPage />, {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    });
    await waitFor(() =>
      expect(screen.getByText("Cascina A")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByLabelText(/Mostra solo aziende/i));
    await waitFor(() =>
      expect(screen.getByText("Cascina B")).toBeInTheDocument()
    );
  });

  it("shows the empty-filtered state when no azienda has unsaldati", async () => {
    const { repos, conti, aziende } = buildHarness(["conti.proforma"]);
    const id1 = await seedAzienda(aziende, "Cascina A");
    await seedConto(conti, id1, "Cascina A", { saldato: true });
    render(<ContiPage />, {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    });
    await waitFor(() =>
      expect(
        screen.getByText(/Nessuna azienda con conti non saldati/i)
      ).toBeInTheDocument()
    );
  });

  it("renders a red status pill with the unsaldati pill when an azienda has non-saldati", async () => {
    const { repos, conti, aziende } = buildHarness(["conti.proforma"]);
    const id1 = await seedAzienda(aziende, "Cascina A");
    await seedConto(conti, id1, "Cascina A", {
      saldato: false,
      totaleConto: 300,
    });
    await seedConto(conti, id1, "Cascina A", {
      saldato: false,
      totaleConto: 150,
    });
    render(<ContiPage />, {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    });
    await waitFor(() =>
      expect(screen.getByText("Cascina A")).toBeInTheDocument()
    );
    expect(screen.getByText(/2 non saldati/i)).toBeInTheDocument();
    expect(
      screen.getByTitle(/Ci sono conti non saldati/i)
    ).toBeInTheDocument();
  });

  it("renders the 'tutto saldato' badge with a green dot when all conti are saldati", async () => {
    const { repos, conti, aziende } = buildHarness(["conti.proforma"]);
    const id1 = await seedAzienda(aziende, "Cascina A");
    await seedConto(conti, id1, "Cascina A", { saldato: true });
    render(<ContiPage />, {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    });
    // Default filter hides this one.
    fireEvent.click(screen.getByLabelText(/Mostra solo aziende/i));
    await waitFor(() =>
      expect(screen.getByText("Cascina A")).toBeInTheDocument()
    );
    expect(screen.getByText(/Tutto saldato/i)).toBeInTheDocument();
    expect(
      screen.getByTitle(/Tutti i conti saldati/i)
    ).toBeInTheDocument();
  });

  it("links each row to /aziende/{id}", async () => {
    const { repos, conti, aziende } = buildHarness(["conti.proforma"]);
    const idA = await seedAzienda(aziende, "Cascina A");
    await seedConto(conti, idA, "Cascina A", { saldato: false });
    render(<ContiPage />, {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    });
    const link = await screen.findByRole("link", { name: /Cascina A/i });
    expect(link.getAttribute("href")).toBe(`/aziende/${idA}`);
  });

  it("does not surface a 'Segna saldato' action on the list", async () => {
    const { repos, conti, aziende } = buildHarness([
      "conti.proforma",
      "conti.saldo",
    ]);
    const id1 = await seedAzienda(aziende, "Cascina A");
    await seedConto(conti, id1, "Cascina A", { saldato: false });
    render(<ContiPage />, {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    });
    await waitFor(() =>
      expect(screen.getByText("Cascina A")).toBeInTheDocument()
    );
    expect(
      screen.queryByRole("button", { name: /Segna saldato/i })
    ).toBeNull();
  });

  it("excludes aziende that have only pro forma conti from the unsaldati view", async () => {
    const { repos, conti, aziende } = buildHarness(["conti.proforma"]);
    const id1 = await seedAzienda(aziende, "Cascina A");
    await seedConto(conti, id1, "Cascina A", {}, "proforma");
    render(<ContiPage />, {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    });
    await waitFor(() =>
      expect(
        screen.getByText(/Nessuna azienda con conti non saldati/i)
      ).toBeInTheDocument()
    );
    fireEvent.click(screen.getByLabelText(/Mostra solo aziende/i));
    await waitFor(() =>
      expect(screen.getByText("Cascina A")).toBeInTheDocument()
    );
  });
});

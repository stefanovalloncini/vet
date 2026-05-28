import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ActorContext, Repositories } from "@vet/shared";
import { InMemoryAuthService } from "@vet/shared/testing";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { VetStatsPage } from "../VetStatsPage";

function makeActor(overrides: Partial<ActorContext> = {}): ActorContext {
  return {
    uid: "vet-1",
    email: "vet1@example.com",
    displayName: "Vet One",
    roleId: "amministratore",
    caps: new Set(["users.read.all"]),
    approved: true,
    ...overrides,
  };
}

async function seedActivity(
  repos: Repositories,
  actor: ActorContext,
  tariffa: number
): Promise<void> {
  const { id: aziendaId } = await repos.aziende.create({ nome: "Az A" }, actor);
  await repos.activityTypes.upsert("visita", {
    nome: "Visita",
    ordine: 10,
    attivo: true,
  });
  const today = new Date();
  await repos.attivita.create(
    {
      data: new Date(today.getFullYear(), today.getMonth(), 10),
      aziendaId,
      tipoId: "visita",
      oraria: false,
      adElemento: false,
      tariffa,
    },
    { aziendaNome: "Az A", tipoNome: "Visita" },
    actor
  );
}

function mount(actor: ActorContext): Repositories {
  const auth = new InMemoryAuthService();
  auth.setSimulatedUser(actor);
  return { ...createInMemoryRepositories(), auth };
}

function renderPage(repos: Repositories): void {
  render(<VetStatsPage />, {
    wrapper: buildProvidersWrapper({
      repos,
      withRouter: true,
      withToast: true,
    }),
  });
}

describe("VetStatsPage", () => {
  it("renders a single h1 and an accessible table caption", async () => {
    const actor = makeActor();
    const repos = mount(actor);
    await seedActivity(repos, actor, 50);
    renderPage(repos);
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /Statistiche veterinari/i,
      })
    ).toBeInTheDocument();
    const table = await screen.findByRole("table", undefined, { timeout: 5_000 });
    expect(
      within(table).getByText(/Statistiche per veterinario/i)
    ).toBeInTheDocument();
  });

  it("shows the empty state when there is no data", async () => {
    const actor = makeActor();
    const repos = mount(actor);
    renderPage(repos);
    expect(
      await screen.findByText(/Nessun dato per il periodo/i)
    ).toBeInTheDocument();
  });

  it("falls back to the email when the vet has no display name", async () => {
    const actor = makeActor({ displayName: "" });
    const repos = mount(actor);
    await seedActivity(repos, actor, 50);
    renderPage(repos);
    const table = await screen.findByRole("table", undefined, { timeout: 5_000 });
    await waitFor(() => {
      expect(
        within(table).getAllByText("vet1@example.com").length
      ).toBeGreaterThan(0);
    });
  });
});

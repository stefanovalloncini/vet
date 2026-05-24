import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ActorContext, Repositories } from "@vet/shared";
import { GINECOLOGIA_TIPO_ID } from "@vet/shared";
import {
  InMemoryActivityTypesRepository,
  InMemoryAttivitaRepository,
  InMemoryAuthService,
  InMemoryAziendeRepository,
} from "@vet/shared/testing";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { QuickEntryDialog } from "../QuickEntryDialog";

function actor(): ActorContext {
  return {
    uid: "vet-1",
    email: "vet@example.com",
    displayName: "Vet One",
    roleId: "vet",
    caps: new Set(["aziende.create", "activity_types.manage"]),
    approved: true,
  };
}

interface World {
  repos: Repositories;
  aziende: InMemoryAziendeRepository;
  tipi: InMemoryActivityTypesRepository;
  attivita: InMemoryAttivitaRepository;
  auth: InMemoryAuthService;
}

async function buildWorld(): Promise<World> {
  const auth = new InMemoryAuthService();
  auth.setSimulatedUser(actor());
  const aziende = new InMemoryAziendeRepository();
  const tipi = new InMemoryActivityTypesRepository();
  const attivita = new InMemoryAttivitaRepository();
  await aziende.create({ nome: "Cliente Uno" }, actor());
  await tipi.upsert("visita", {
    nome: "Visita",
    ordine: 1,
    attivo: true,
    tariffaStandard: 30,
  });
  await tipi.upsert(GINECOLOGIA_TIPO_ID, {
    nome: "Ginecologia",
    ordine: 2,
    attivo: true,
  });
  return {
    repos: { auth, aziende, activityTypes: tipi, attivita } as unknown as Repositories,
    aziende,
    tipi,
    attivita,
    auth,
  };
}

function makeWrapper(repos: Repositories) {
  return buildProvidersWrapper({ repos, withToast: true });
}

async function mount(world: World) {
  const onClose = vi.fn();
  const result = render(<QuickEntryDialog open={true} onClose={onClose} />, {
    wrapper: makeWrapper(world.repos),
  });
  await waitFor(() => {
    const select = screen.getByLabelText(/Azienda/i) as HTMLSelectElement;
    expect(select.options.length).toBeGreaterThan(1);
  });
  return { ...result, onClose };
}

describe("QuickEntryDialog", () => {
  it("blocks save and surfaces field errors when required fields are empty", async () => {
    const world = await buildWorld();
    await mount(world);
    fireEvent.click(screen.getByRole("button", { name: /^Salva$/i }));
    await waitFor(() => {
      expect(screen.queryByText(/Scegli un'azienda/i)).toBeInTheDocument();
    });
    const all = await world.attivita.list();
    expect(all).toEqual([]);
  });

  it("auto-fills tariffa from tipo.tariffaStandard when tipo changes and tariffa is empty", async () => {
    const world = await buildWorld();
    const { container } = await mount(world);
    const aziendaId = (await world.aziende.list())[0]?.id ?? "";
    fireEvent.change(screen.getByLabelText(/Azienda/i), {
      target: { value: aziendaId },
    });
    fireEvent.change(screen.getByLabelText(/Tipo/i), {
      target: { value: "visita" },
    });
    await waitFor(() => {
      const tariffa = container.querySelector(
        'input[name="tariffa"]'
      ) as HTMLInputElement;
      expect(tariffa.value).toBe("30");
    });
  });

  it("keeps user-typed tariffa when tipo changes after typing", async () => {
    const world = await buildWorld();
    const { container } = await mount(world);
    fireEvent.change(screen.getByLabelText(/Tariffa/i), {
      target: { value: "75" },
    });
    fireEvent.change(screen.getByLabelText(/Tipo/i), {
      target: { value: "visita" },
    });
    const tariffa = container.querySelector(
      'input[name="tariffa"]'
    ) as HTMLInputElement;
    expect(tariffa.value).toBe("75");
  });

  it("requires a second submit when duplicate exists, then persists", async () => {
    const world = await buildWorld();
    const aziendaId = (await world.aziende.list())[0]?.id ?? "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await world.attivita.create(
      {
        data: today,
        aziendaId,
        tipoId: "visita",
        oraria: false, adElemento: false,
        tariffa: 30,
      },
      { aziendaNome: "Cliente Uno", tipoNome: "Visita" },
      actor()
    );
    await mount(world);
    fireEvent.change(screen.getByLabelText(/Azienda/i), {
      target: { value: aziendaId },
    });
    fireEvent.change(screen.getByLabelText(/Tipo/i), {
      target: { value: "visita" },
    });
    await waitFor(() => {
      expect(
        screen.getByText(/Esiste già un'attività con lo stesso cliente/i)
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /^Salva$/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/Premi Salva di nuovo per confermare/i)
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /^Salva$/i }));
    await waitFor(async () => {
      const items = await world.attivita.list();
      expect(items.length).toBe(2);
    });
  });

  it("Salva e nuova persists then clears the form preserving the date", async () => {
    const world = await buildWorld();
    const { container, onClose } = await mount(world);
    const aziendaId = (await world.aziende.list())[0]?.id ?? "";
    fireEvent.change(screen.getByLabelText(/Data/i), {
      target: { value: "2026-06-10" },
    });
    fireEvent.change(screen.getByLabelText(/Azienda/i), {
      target: { value: aziendaId },
    });
    fireEvent.change(screen.getByLabelText(/Tipo/i), {
      target: { value: "visita" },
    });
    fireEvent.change(screen.getByLabelText(/Tariffa/i), {
      target: { value: "55" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Salva e nuova/i }));

    await waitFor(async () => {
      const items = await world.attivita.list();
      expect(items.length).toBe(1);
    });
    expect(onClose).not.toHaveBeenCalled();

    const dataInput = container.querySelector(
      'input[name="data"]'
    ) as HTMLInputElement;
    const aziendaSel = container.querySelector(
      'select[name="aziendaId"]'
    ) as HTMLSelectElement;
    await waitFor(() => {
      expect(dataInput.value).toBe("2026-06-10");
      expect(aziendaSel.value).toBe("");
    });
  });

  it("renders + Nuova affordance when user has aziende.create cap", async () => {
    const world = await buildWorld();
    await mount(world);
    expect(screen.getByRole("button", { name: /\+ Nuova/i })).toBeInTheDocument();
  });

  it("closes via Chiudi", async () => {
    const world = await buildWorld();
    const { onClose } = await mount(world);
    fireEvent.click(screen.getByRole("button", { name: /Chiudi/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows totale once a positive tariffa is set", async () => {
    const world = await buildWorld();
    await mount(world);
    fireEvent.change(screen.getByLabelText(/Tariffa/i), {
      target: { value: "42" },
    });
    const totaleRow = await screen.findByText(/Totale/i);
    const container = totaleRow.closest("div");
    expect(container).not.toBeNull();
    if (container) {
      expect(within(container).getByText(/42/)).toBeInTheDocument();
    }
  });
});

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ActorContext, Repositories } from "@vet/shared";
import { ALTRO_TIPO_ID, GINECOLOGIA_TIPO_ID } from "@vet/shared";
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
  await tipi.upsert(ALTRO_TIPO_ID, {
    nome: "Altro",
    ordine: 999,
    attivo: true,
  });
  await tipi.upsert("oraria-tipo", {
    nome: "Esame orario",
    ordine: 3,
    attivo: true,
    tariffaStandard: 50,
    modalitaDefault: "oraria",
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
    fireEvent.change(screen.getByLabelText(/^Tipo$/i), {
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
    const tariffaInput = container.querySelector(
      'input[name="tariffa"]'
    ) as HTMLInputElement;
    fireEvent.change(tariffaInput, { target: { value: "75" } });
    fireEvent.change(screen.getByLabelText(/^Tipo$/i), {
      target: { value: "visita" },
    });
    expect(tariffaInput.value).toBe("75");
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
    fireEvent.change(screen.getByLabelText(/^Tipo$/i), {
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
    fireEvent.change(screen.getByLabelText(/^Tipo$/i), {
      target: { value: "visita" },
    });
    const tariffaInput = container.querySelector(
      'input[name="tariffa"]'
    ) as HTMLInputElement;
    fireEvent.change(tariffaInput, { target: { value: "55" } });

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

  it("closes via Annulla", async () => {
    const world = await buildWorld();
    const { onClose } = await mount(world);
    fireEvent.click(screen.getByRole("button", { name: /^Annulla$/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows totale once a positive tariffa is set", async () => {
    const world = await buildWorld();
    const { container } = await mount(world);
    const tariffaInput = container.querySelector(
      'input[name="tariffa"]'
    ) as HTMLInputElement;
    fireEvent.change(tariffaInput, { target: { value: "42" } });
    const totaleRow = await screen.findByText(/^Totale$/i);
    const row = totaleRow.closest("div");
    expect(row).not.toBeNull();
    if (row) {
      expect(within(row).getByText(/42/)).toBeInTheDocument();
    }
  });

  it("requires note when tipo is Altro and shows inline error", async () => {
    const world = await buildWorld();
    const { container } = await mount(world);
    const aziendaId = (await world.aziende.list())[0]?.id ?? "";
    fireEvent.change(screen.getByLabelText(/Azienda/i), {
      target: { value: aziendaId },
    });
    fireEvent.change(screen.getByLabelText(/^Tipo$/i), {
      target: { value: ALTRO_TIPO_ID },
    });
    const tariffaInput = container.querySelector(
      'input[name="tariffa"]'
    ) as HTMLInputElement;
    fireEvent.change(tariffaInput, { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: /^Salva$/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/La nota è obbligatoria per il tipo Altro/i)
      ).toBeInTheDocument();
    });
    expect(await world.attivita.list()).toEqual([]);
  });

  it("orders Tipo dropdown with Ginecologia first and Altro last", async () => {
    const world = await buildWorld();
    await mount(world);
    const select = screen.getByLabelText(/^Tipo$/i) as HTMLSelectElement;
    const values = Array.from(select.options)
      .map((o) => o.value)
      .filter((v) => v !== "");
    expect(values[0]).toBe(GINECOLOGIA_TIPO_ID);
    expect(values[values.length - 1]).toBe(ALTRO_TIPO_ID);
  });

  it("pre-fills modalita from tipo.modalitaDefault when picking a tipo", async () => {
    const world = await buildWorld();
    await mount(world);
    fireEvent.change(screen.getByLabelText(/^Tipo$/i), {
      target: { value: "oraria-tipo" },
    });
    await waitFor(() => {
      const orariaBtn = screen.getByRole("radio", { name: /^Oraria$/ });
      expect(orariaBtn).toHaveAttribute("aria-checked", "true");
    });
  });

  it("uses NumberField with step=10 for tariffa and no native arrows", async () => {
    const world = await buildWorld();
    const { container } = await mount(world);
    const tariffaInput = container.querySelector(
      'input[name="tariffa"]'
    ) as HTMLInputElement;
    expect(tariffaInput.step).toBe("10");
    expect(tariffaInput.type).toBe("number");
    expect(screen.getByRole("button", { name: /Aumenta/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Diminuisci/i })).toBeInTheDocument();
  });

  it("Salva button is full-width and Annulla is the ghost cancel", async () => {
    const world = await buildWorld();
    await mount(world);
    const salva = screen.getByRole("button", { name: /^Salva$/ });
    expect(salva.className).toContain("w-full");
    const annulla = screen.getByRole("button", { name: /^Annulla$/ });
    expect(annulla).toBeInTheDocument();
  });
});

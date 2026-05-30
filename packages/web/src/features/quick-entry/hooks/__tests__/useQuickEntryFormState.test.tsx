import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  GINECOLOGIA_TIPO_ID,
  type ActivityType,
  type ActorContext,
  type Azienda,
  type AttivitaRepository,
  type Repositories,
} from "@vet/shared";
import { InMemoryAttivitaRepository } from "@vet/shared/testing";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import type { ReferenceData } from "../../../attivita/hooks/useReferenceData";
import { useQuickEntryFormState } from "../useQuickEntryFormState";

function actor(): ActorContext {
  return {
    uid: "vet-1",
    email: "vet@example.com",
    displayName: "Vet One",
    roleId: "vet",
    caps: new Set(),
    approved: true,
  };
}

function azienda(id: string, nome: string): Azienda {
  return {
    id,
    nome,
    nomeNorm: nome.toLowerCase(),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "vet-1",
    updatedBy: "vet-1",
    createdByName: "Vet One",
    updatedByName: "Vet One",
    isDeleted: false,
    schemaVersion: 1,
  };
}

function tipo(
  over: Partial<ActivityType> & Pick<ActivityType, "id" | "nome">
): ActivityType {
  return {
    ordine: 0,
    attivo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    schemaVersion: 1,
    ...over,
  } as ActivityType;
}

function refData(aziende: Azienda[], tipi: ActivityType[]): ReferenceData {
  return {
    loading: false,
    aziende,
    tipi,
    addAzienda: () => {},
    addTipo: () => {},
  };
}

function makeWrapper(repo: AttivitaRepository) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const repos = { attivita: repo } as unknown as Repositories;
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
      </QueryClientProvider>
    );
  };
}

let attivita: AttivitaRepository;

beforeEach(() => {
  attivita = new InMemoryAttivitaRepository();
});

describe("useQuickEntryFormState", () => {
  const aziende = [azienda("az-1", "Cliente Uno")];
  const tipi = [
    tipo({ id: "visita", nome: "Visita", tariffaStandard: 30 }),
    tipo({ id: "altro", nome: "Altro" }),
    tipo({ id: GINECOLOGIA_TIPO_ID, nome: "Ginecologia" }),
  ];

  async function mount() {
    const view = renderHook(
      () =>
        useQuickEntryFormState({
          open: true,
          user: actor(),
          attivita,
          ref: refData(aziende, tipi),
        }),
      { wrapper: makeWrapper(attivita) }
    );
    await waitFor(() =>
      expect(view.result.current.aziendaOptions.length).toBeGreaterThan(1)
    );
    return view;
  }

  it("auto-fills tariffa from tipo.tariffaStandard when tariffa is empty", async () => {
    const { result } = await mount();
    act(() => result.current.form.setValue("tipoId", "visita"));
    await waitFor(() => {
      expect(result.current.form.getValues("tariffa")).toBe("30");
    });
  });

  it("does not overwrite tariffa typed by the user", async () => {
    const { result } = await mount();
    act(() => result.current.form.setValue("tariffa", "75"));
    act(() => result.current.form.setValue("tipoId", "visita"));
    expect(result.current.form.getValues("tariffa")).toBe("75");
  });

  it("prefers the last-used tariffa over tariffaStandard for any tipo", async () => {
    await attivita.create(
      {
        data: new Date("2026-01-15"),
        aziendaId: "az-1",
        tipoId: "visita",
        oraria: false, adElemento: false,
        tariffa: 55,
      },
      { aziendaNome: "Cliente Uno", tipoNome: "Visita" },
      actor()
    );
    const { result } = await mount();
    act(() => result.current.form.setValue("aziendaId", "az-1"));
    act(() => result.current.form.setValue("tipoId", "visita"));
    await waitFor(() => {
      expect(result.current.form.getValues("tariffa")).toBe("55");
    });
  });

  it("loads the last ginecologia tariffa for the same azienda when empty", async () => {
    await attivita.create(
      {
        data: new Date("2026-01-15"),
        aziendaId: "az-1",
        tipoId: GINECOLOGIA_TIPO_ID,
        oraria: false, adElemento: false,
        tariffa: 42,
      },
      { aziendaNome: "Cliente Uno", tipoNome: "Ginecologia" },
      actor()
    );
    const { result } = await mount();
    act(() => result.current.form.setValue("aziendaId", "az-1"));
    act(() => result.current.form.setValue("tipoId", GINECOLOGIA_TIPO_ID));
    await waitFor(() => {
      expect(result.current.form.getValues("tariffa")).toBe("42");
    });
  });

  it("submit returns ok=false and arms dup-skip on first duplicate; second submit persists", async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await attivita.create(
      {
        data: today,
        aziendaId: "az-1",
        tipoId: "visita",
        oraria: false, adElemento: false,
        tariffa: 30,
      },
      { aziendaNome: "Cliente Uno", tipoNome: "Visita" },
      actor()
    );
    const { result } = await mount();
    act(() => result.current.form.setValue("aziendaId", "az-1"));
    act(() => result.current.form.setValue("tipoId", "visita"));
    await waitFor(() => expect(result.current.duplicateExists).toBe(true));

    let outcome: { ok: false } | { ok: true; id: string } = { ok: false };
    await act(async () => {
      outcome = await result.current.submit(result.current.form.getValues());
    });
    expect(outcome.ok).toBe(false);
    expect(result.current.rootError).toMatch(/Premi Salva di nuovo/i);

    await act(async () => {
      outcome = await result.current.submit(result.current.form.getValues());
    });
    expect(outcome.ok).toBe(true);
  });

  it("pre-fills modalita from tipo.modalitaDefault when picking a tipo", async () => {
    const localTipi = [
      tipo({
        id: "visita-oraria",
        nome: "Visita oraria",
        modalitaDefault: "oraria",
      }),
      tipo({
        id: "intervento",
        nome: "Intervento",
        modalitaDefault: "adElemento",
      }),
      tipo({ id: "fissa-x", nome: "Fissa X", modalitaDefault: "fissa" }),
    ];
    const view = renderHook(
      () =>
        useQuickEntryFormState({
          open: true,
          user: actor(),
          attivita,
          ref: refData(aziende, localTipi),
        }),
      { wrapper: makeWrapper(attivita) }
    );
    await waitFor(() =>
      expect(view.result.current.aziendaOptions.length).toBeGreaterThan(1)
    );
    act(() => view.result.current.form.setValue("tipoId", "visita-oraria"));
    await waitFor(() =>
      expect(view.result.current.form.getValues("modalita")).toBe("oraria")
    );
    act(() => view.result.current.form.setValue("tipoId", "intervento"));
    await waitFor(() =>
      expect(view.result.current.form.getValues("modalita")).toBe("adElemento")
    );
    act(() => view.result.current.form.setValue("tipoId", "fissa-x"));
    await waitFor(() =>
      expect(view.result.current.form.getValues("modalita")).toBe("fissa")
    );
  });

  it("blocks submit when tipo=Altro and note is empty", async () => {
    const localTipi = [
      tipo({ id: "altro", nome: "Altro" }),
    ];
    const view = renderHook(
      () =>
        useQuickEntryFormState({
          open: true,
          user: actor(),
          attivita,
          ref: refData(aziende, localTipi),
        }),
      { wrapper: makeWrapper(attivita) }
    );
    await waitFor(() =>
      expect(view.result.current.aziendaOptions.length).toBeGreaterThan(1)
    );
    act(() => view.result.current.form.setValue("aziendaId", "az-1"));
    act(() => view.result.current.form.setValue("tipoId", "altro"));
    act(() => view.result.current.form.setValue("tariffa", "50"));

    await act(async () => {
      await view.result.current.form.trigger();
    });
    expect(view.result.current.form.formState.errors.note?.message).toMatch(
      /obbligatoria/i
    );
  });

  it("resetAll clears fields; resetAll({ data }) preserves the date", async () => {
    const { result } = await mount();
    act(() => result.current.form.setValue("data", "2026-02-15"));
    act(() => result.current.form.setValue("aziendaId", "az-1"));
    act(() => result.current.form.setValue("tipoId", "visita"));
    act(() => result.current.resetAll({ data: "2026-02-15" }));
    expect(result.current.form.getValues("data")).toBe("2026-02-15");
    expect(result.current.form.getValues("aziendaId")).toBe("");
    expect(result.current.form.getValues("tipoId")).toBe("");
    expect(result.current.form.getValues("tariffa")).toBe("");

    act(() => result.current.resetAll());
    expect(result.current.form.getValues("aziendaId")).toBe("");
    expect(result.current.form.getValues("tipoId")).toBe("");
  });
});

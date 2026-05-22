import { StrictMode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import {
  GINECOLOGIA_TIPO_ID,
  type ActivityType,
  type ActorContext,
  type Azienda,
  type AttivitaRepository,
} from "@vet/shared";
import { InMemoryAttivitaRepository } from "@vet/shared/testing";
import type { ReferenceData } from "../../../attivita/hooks/useReferenceData";
import { useQuickEntryForm } from "../useQuickEntryForm";

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

function tipo(over: Partial<ActivityType> & Pick<ActivityType, "id" | "nome">): ActivityType {
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

let attivita: AttivitaRepository;

beforeEach(() => {
  attivita = new InMemoryAttivitaRepository();
});

describe("useQuickEntryForm", () => {
  const aziende = [azienda("az-1", "Cliente Uno")];
  const tipi = [
    tipo({ id: "visita", nome: "Visita", tariffaStandard: 30 }),
    tipo({ id: "altro", nome: "Altro" }),
    tipo({ id: GINECOLOGIA_TIPO_ID, nome: "Ginecologia" }),
  ];

  async function mount() {
    const view = renderHook(() =>
      useQuickEntryForm({
        open: true,
        user: actor(),
        attivita,
        ref: refData(aziende, tipi),
      })
    );
    await waitFor(() => expect(view.result.current.aziendaOptions.length).toBeGreaterThan(1));
    return view;
  }

  it("auto-fills tariffa from tipo.tariffaStandard synchronously", async () => {
    const { result } = await mount();
    act(() => result.current.setTipoId("visita"));
    expect(result.current.tariffa).toBe("30");
  });

  it("does not overwrite a tariffa the user already typed", async () => {
    const { result } = await mount();
    act(() => result.current.setTariffa("75"));
    act(() => result.current.setTipoId("visita"));
    expect(result.current.tariffa).toBe("75");
  });

  it("leaves tariffa empty when tipo has no standard rate", async () => {
    const { result } = await mount();
    act(() => result.current.setTipoId("altro"));
    expect(result.current.tariffa).toBe("");
  });

  it("loads previous ginecologia tariffa for the same azienda", async () => {
    await attivita.create(
      {
        data: new Date("2026-01-15"),
        aziendaId: "az-1",
        tipoId: GINECOLOGIA_TIPO_ID,
        oraria: false,
        tariffa: 42,
      },
      { aziendaNome: "Cliente Uno", tipoNome: "Ginecologia" },
      actor()
    );
    const { result } = await mount();
    act(() => result.current.setAziendaId("az-1"));
    act(() => result.current.setTipoId(GINECOLOGIA_TIPO_ID));
    await waitFor(() => {
      expect(result.current.tariffa).toBe("42");
    });
  });

  it("save returns null and arms dup-skip on duplicate; second save persists", async () => {
    await attivita.create(
      {
        data: todayDate(),
        aziendaId: "az-1",
        tipoId: "visita",
        oraria: false,
        tariffa: 30,
      },
      { aziendaNome: "Cliente Uno", tipoNome: "Visita" },
      actor()
    );
    const { result } = await mount();
    act(() => result.current.setAziendaId("az-1"));
    act(() => result.current.setTipoId("visita"));
    await waitFor(() => expect(result.current.duplicateExists).toBe(true));

    let id: string | null = null;
    await act(async () => {
      id = await result.current.save();
    });
    expect(id).toBeNull();
    expect(result.current.error).not.toBeNull();

    await act(async () => {
      id = await result.current.save();
    });
    expect(id).not.toBeNull();
  });

  it("changing azienda after a duplicate warning disarms dup-skip", async () => {
    await attivita.create(
      {
        data: todayDate(),
        aziendaId: "az-1",
        tipoId: "visita",
        oraria: false,
        tariffa: 30,
      },
      { aziendaNome: "Cliente Uno", tipoNome: "Visita" },
      actor()
    );
    const { result } = await mount();
    act(() => result.current.setAziendaId("az-1"));
    act(() => result.current.setTipoId("visita"));
    await waitFor(() => expect(result.current.duplicateExists).toBe(true));
    await act(async () => {
      await result.current.save();
    });
    act(() => result.current.setAziendaId(""));
    act(() => result.current.setAziendaId("az-1"));
    let id: string | null = null;
    await act(async () => {
      id = await result.current.save();
    });
    expect(id).toBeNull();
  });

  it("reset clears fields; keepDate preserves the date", async () => {
    const { result } = await mount();
    act(() => result.current.setData("2026-02-15"));
    act(() => result.current.setAziendaId("az-1"));
    act(() => result.current.setTipoId("visita"));
    act(() => result.current.reset({ keepDate: true }));
    expect(result.current.data).toBe("2026-02-15");
    expect(result.current.aziendaId).toBe("");
    expect(result.current.tipoId).toBe("");
    expect(result.current.tariffa).toBe("");

    act(() => result.current.reset());
    expect(result.current.aziendaId).toBe("");
    expect(result.current.tipoId).toBe("");
  });

  it("setters survive StrictMode double-invocation", async () => {
    const { result } = renderHook(
      () =>
        useQuickEntryForm({
          open: true,
          user: actor(),
          attivita,
          ref: refData(aziende, tipi),
        }),
      { wrapper: ({ children }) => <StrictMode>{children}</StrictMode> }
    );
    await waitFor(() => expect(result.current.aziendaOptions.length).toBeGreaterThan(1));
    act(() => result.current.setTipoId("visita"));
    expect(result.current.tariffa).toBe("30");
  });
});

function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

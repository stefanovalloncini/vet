import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type {
  ActorContext,
  Capability,
  Repositories,
} from "@vet/shared";
import {
  InMemoryAziendeRepository,
  InMemoryAttivitaRepository,
  InMemoryContiRepository,
} from "@vet/shared/testing";
import { buildProvidersWrapper } from "../../../__tests__/renderWithProviders";
import { usePagamentiOverview } from "../hooks/usePagamentiOverview";

function actor(caps: Capability[] = []): ActorContext {
  return {
    uid: "vet-1",
    email: "vet@example.com",
    displayName: "Vet One",
    roleId: "vet",
    caps: new Set(caps),
    approved: true,
  };
}

async function setup() {
  const aziende = new InMemoryAziendeRepository();
  const conti = new InMemoryContiRepository();
  const attivita = new InMemoryAttivitaRepository();
  const repos = { aziende, conti, attivita } as unknown as Repositories;
  const wrapper = buildProvidersWrapper({ repos });
  return { aziende, conti, attivita, repos, wrapper };
}

describe("usePagamentiOverview", () => {
  it("returns one row per azienda with aggregated totals, sorted by nome", async () => {
    const { aziende, conti, wrapper } = await setup();
    const a1 = await aziende.create(
      { nome: "Zeta Farm" },
      actor(["aziende.create"])
    );
    const a2 = await aziende.create(
      { nome: "Alfa Farm", cadenzaFatturazione: "monthly" },
      actor(["aziende.create"])
    );

    // Two unpaid conti for Alfa, one paid for Zeta.
    await conti.emit(
      {
        aziendaId: a2.id,
        periodoFrom: new Date("2026-01-01"),
        periodoTo: new Date("2026-01-31"),
        modalita: "emesso",
      },
      { aziendaNome: a2.nome, attivitaIds: [], totaleConto: 150 },
      actor()
    );
    await conti.emit(
      {
        aziendaId: a2.id,
        periodoFrom: new Date("2026-02-01"),
        periodoTo: new Date("2026-02-28"),
        modalita: "emesso",
      },
      { aziendaNome: a2.nome, attivitaIds: [], totaleConto: 50 },
      actor()
    );
    const paidId = await conti.emit(
      {
        aziendaId: a1.id,
        periodoFrom: new Date("2026-01-01"),
        periodoTo: new Date("2026-01-31"),
        modalita: "emesso",
      },
      { aziendaNome: a1.nome, attivitaIds: [], totaleConto: 99 },
      actor()
    );
    await conti.saldo({ contoId: paidId }, actor(["conti.saldo"]));

    const { result } = renderHook(
      () => usePagamentiOverview(new Date(2026, 4, 1)),
      { wrapper }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    const rows = result.current.rows;
    expect(rows).toHaveLength(2);
    // Sorted: "alfa farm" < "zeta farm"
    expect(rows[0]?.azienda.id).toBe(a2.id);
    expect(rows[1]?.azienda.id).toBe(a1.id);

    // Alfa: two unpaid conti, totale = 200.
    expect(rows[0]?.hasUnpaid).toBe(true);
    expect(rows[0]?.totaleAperto).toBe(200);
    expect(rows[0]?.ultimoContoAt).not.toBeNull();

    // Zeta: paid, no unpaid.
    expect(rows[1]?.hasUnpaid).toBe(false);
    expect(rows[1]?.totaleAperto).toBe(0);
  });

  it("flags needsNewConto when the closed calendar period has unbilled attivita", async () => {
    const { aziende, attivita, wrapper } = await setup();
    const a = await aziende.create(
      { nome: "Cadenza Mensile", cadenzaFatturazione: "monthly" },
      actor(["aziende.create"])
    );
    const a2 = await aziende.create(
      { nome: "Senza Cadenza" },
      actor(["aziende.create"])
    );

    const now = new Date(2026, 4, 15); // 2026-05-15, closed month = April
    const inApril = new Date(2026, 3, 10);
    await attivita.create(
      {
        data: inApril,
        aziendaId: a.id,
        tipoId: "t1",
        oraria: false,
        adElemento: false,
        tariffa: 50,
      },
      { aziendaNome: a.nome, tipoNome: "Visita" },
      actor()
    );
    await attivita.create(
      {
        data: inApril,
        aziendaId: a2.id,
        tipoId: "t1",
        oraria: false,
        adElemento: false,
        tariffa: 30,
      },
      { aziendaNome: a2.nome, tipoNome: "Visita" },
      actor()
    );

    const { result } = renderHook(() => usePagamentiOverview(now), {
      wrapper,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const rows = result.current.rows;
    expect(rows).toHaveLength(2);
    const byId = new Map(rows.map((r) => [r.azienda.id, r]));
    // Monthly azienda, unbilled attivita in the just-closed month, no conto → flagged.
    expect(byId.get(a.id)?.needsNewConto).toBe(true);
    // Azienda without cadenza → never flagged.
    expect(byId.get(a2.id)?.needsNewConto).toBe(false);
  });

  it("does not flag needsNewConto when unbilled attivita fall only in the current open period", async () => {
    const { aziende, attivita, wrapper } = await setup();
    const a = await aziende.create(
      { nome: "Cadenza Mensile", cadenzaFatturazione: "monthly" },
      actor(["aziende.create"])
    );

    const now = new Date(2026, 4, 15); // 2026-05-15
    await attivita.create(
      {
        data: now,
        aziendaId: a.id,
        tipoId: "t1",
        oraria: false,
        adElemento: false,
        tariffa: 50,
      },
      { aziendaNome: a.nome, tipoNome: "Visita" },
      actor()
    );

    const { result } = renderHook(() => usePagamentiOverview(now), {
      wrapper,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const byId = new Map(result.current.rows.map((r) => [r.azienda.id, r]));
    expect(byId.get(a.id)?.needsNewConto).toBe(false);
  });

  it("does not flag needsNewConto when an emitted conto covers the closed period", async () => {
    const { aziende, attivita, conti, wrapper } = await setup();
    const a = await aziende.create(
      { nome: "Cadenza Mensile", cadenzaFatturazione: "monthly" },
      actor(["aziende.create"])
    );

    const now = new Date(2026, 4, 15); // closed month = April
    await attivita.create(
      {
        data: new Date(2026, 3, 10),
        aziendaId: a.id,
        tipoId: "t1",
        oraria: false,
        adElemento: false,
        tariffa: 50,
      },
      { aziendaNome: a.nome, tipoNome: "Visita" },
      actor()
    );
    await conti.emit(
      {
        aziendaId: a.id,
        periodoFrom: new Date(2026, 3, 1),
        periodoTo: new Date(2026, 3, 30, 23, 59, 59, 999),
        modalita: "emesso",
      },
      { aziendaNome: a.nome, attivitaIds: [], totaleConto: 50 },
      actor()
    );

    const { result } = renderHook(() => usePagamentiOverview(now), {
      wrapper,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const byId = new Map(result.current.rows.map((r) => [r.azienda.id, r]));
    expect(byId.get(a.id)?.needsNewConto).toBe(false);
  });
});

import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ActivityType, ActorContext } from "@vet/shared";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { useTariffaSuggestion } from "../useTariffaSuggestion";

const VET: ActorContext = {
  uid: "u1",
  email: "x@x.it",
  displayName: "Vet",
  roleId: "vet",
  caps: new Set(["activities.read.all", "activities.create"]),
  approved: true,
};

function tipo(over: Partial<ActivityType> & { id: string }): ActivityType {
  return {
    nome: over.id,
    ordine: 1,
    attivo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    schemaVersion: 1,
    ...over,
  };
}

describe("useTariffaSuggestion", () => {
  it("suggests tariffaStandard for a non-ginecologia tipo when tariffa is empty", async () => {
    const repos = createInMemoryRepositories();
    (
      repos.auth as unknown as { setSimulatedUser: (a: ActorContext) => void }
    ).setSimulatedUser(VET);
    const onSuggest = vi.fn();
    const tipi = [tipo({ id: "visita", tariffaStandard: 70 })];
    renderHook(
      () =>
        useTariffaSuggestion({
          aziendaId: "az1",
          tipoId: "visita",
          tipi,
          isEdit: false,
          currentTariffa: "",
          onSuggest,
        }),
      { wrapper: buildProvidersWrapper({ repos }) }
    );
    await waitFor(() => expect(onSuggest).toHaveBeenCalledWith("70"));
  });

  it("does NOT call onSuggest when in edit mode", async () => {
    const repos = createInMemoryRepositories();
    (
      repos.auth as unknown as { setSimulatedUser: (a: ActorContext) => void }
    ).setSimulatedUser(VET);
    const onSuggest = vi.fn();
    renderHook(
      () =>
        useTariffaSuggestion({
          aziendaId: "az1",
          tipoId: "visita",
          tipi: [tipo({ id: "visita", tariffaStandard: 50 })],
          isEdit: true,
          currentTariffa: "",
          onSuggest,
        }),
      { wrapper: buildProvidersWrapper({ repos }) }
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(onSuggest).not.toHaveBeenCalled();
  });

  it("does NOT overwrite when tariffa is already set", async () => {
    const repos = createInMemoryRepositories();
    (
      repos.auth as unknown as { setSimulatedUser: (a: ActorContext) => void }
    ).setSimulatedUser(VET);
    const onSuggest = vi.fn();
    renderHook(
      () =>
        useTariffaSuggestion({
          aziendaId: "az1",
          tipoId: "visita",
          tipi: [tipo({ id: "visita", tariffaStandard: 50 })],
          isEdit: false,
          currentTariffa: "100",
          onSuggest,
        }),
      { wrapper: buildProvidersWrapper({ repos }) }
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(onSuggest).not.toHaveBeenCalled();
  });

  it("does NOT call onSuggest when tipo has no tariffaStandard", async () => {
    const repos = createInMemoryRepositories();
    (
      repos.auth as unknown as { setSimulatedUser: (a: ActorContext) => void }
    ).setSimulatedUser(VET);
    const onSuggest = vi.fn();
    renderHook(
      () =>
        useTariffaSuggestion({
          aziendaId: "az1",
          tipoId: "altro",
          tipi: [tipo({ id: "altro" })],
          isEdit: false,
          currentTariffa: "",
          onSuggest,
        }),
      { wrapper: buildProvidersWrapper({ repos }) }
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(onSuggest).not.toHaveBeenCalled();
  });

  it("returns suggested=true when current tariffa equals last suggested", async () => {
    const repos = createInMemoryRepositories();
    (
      repos.auth as unknown as { setSimulatedUser: (a: ActorContext) => void }
    ).setSimulatedUser(VET);
    const onSuggest = vi.fn();
    const { result } = renderHook(
      () =>
        useTariffaSuggestion({
          aziendaId: "az1",
          tipoId: "visita",
          tipi: [tipo({ id: "visita", tariffaStandard: 70 })],
          isEdit: false,
          currentTariffa: "70",
          onSuggest,
        }),
      { wrapper: buildProvidersWrapper({ repos }) }
    );
    await waitFor(() => expect(result.current.suggested).toBe(true));
  });
});

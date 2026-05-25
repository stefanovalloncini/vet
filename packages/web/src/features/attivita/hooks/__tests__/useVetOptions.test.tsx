import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ActorContext } from "@vet/shared";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { useVetOptions } from "../useVetOptions";

const ADMIN: ActorContext = {
  uid: "admin-1",
  email: "admin@example.com",
  displayName: "Admin",
  roleId: "admin",
  caps: new Set([
    "activities.read.all",
    "activities.create",
    "aziende.create",
    "activity_types.read",
  ]),
  approved: true,
};

async function seedRepos() {
  const repos = createInMemoryRepositories();
  (
    repos.auth as unknown as { setSimulatedUser: (a: ActorContext) => void }
  ).setSimulatedUser(ADMIN);
  const { id: aziendaId } = await repos.aziende.create(
    { nome: "Test Cascina" },
    ADMIN
  );
  const tipoId = "tipo-1";
  await repos.activityTypes.upsert(tipoId, {
    nome: "Visita",
    ordine: 1,
    attivo: true,
  });
  return { repos, aziendaId, tipoId };
}

describe("useVetOptions", () => {
  it("returns empty array when there are no attivita", async () => {
    const { repos } = await seedRepos();
    const { result } = renderHook(() => useVetOptions(), {
      wrapper: buildProvidersWrapper({ repos }),
    });
    await waitFor(() => expect(result.current).toEqual([]));
  });

  it("returns unique vets (deduplicated by uid)", async () => {
    const { repos, aziendaId, tipoId } = await seedRepos();
    const vet1: ActorContext = { ...ADMIN, uid: "v1", displayName: "Vet Uno" };
    const vet2: ActorContext = { ...ADMIN, uid: "v2", displayName: "Vet Due" };
    for (let i = 0; i < 3; i++) {
      await repos.attivita.create(
        {
          data: new Date(2026, 4, 15 + i),
          aziendaId,
          tipoId,
          oraria: false,
          adElemento: false,
          tariffa: 50,
        },
        { aziendaNome: "Test Cascina", tipoNome: "Visita" },
        i % 2 === 0 ? vet1 : vet2
      );
    }
    const { result } = renderHook(() => useVetOptions(), {
      wrapper: buildProvidersWrapper({ repos }),
    });
    await waitFor(() => expect(result.current).toHaveLength(2));
  });

  it("sorts the vets alphabetically by nome", async () => {
    const { repos, aziendaId, tipoId } = await seedRepos();
    const z: ActorContext = { ...ADMIN, uid: "z", displayName: "Zeno" };
    const a: ActorContext = { ...ADMIN, uid: "a", displayName: "Anna" };
    await repos.attivita.create(
      {
        data: new Date(2026, 4, 15),
        aziendaId,
        tipoId,
        oraria: false,
        adElemento: false,
        tariffa: 1,
      },
      { aziendaNome: "Test Cascina", tipoNome: "Visita" },
      z
    );
    await repos.attivita.create(
      {
        data: new Date(2026, 4, 16),
        aziendaId,
        tipoId,
        oraria: false,
        adElemento: false,
        tariffa: 1,
      },
      { aziendaNome: "Test Cascina", tipoNome: "Visita" },
      a
    );
    const { result } = renderHook(() => useVetOptions(), {
      wrapper: buildProvidersWrapper({ repos }),
    });
    await waitFor(() => expect(result.current).toHaveLength(2));
    expect(result.current[0]?.nome).toBe("Anna");
    expect(result.current[1]?.nome).toBe("Zeno");
  });
});

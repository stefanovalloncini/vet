import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ActivityType, ActorContext, Azienda } from "@vet/shared";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { useReferenceData } from "../useReferenceData";

const ADMIN: ActorContext = {
  uid: "admin",
  email: "admin@example.com",
  displayName: "Admin",
  roleId: "admin",
  caps: new Set([
    "aziende.read",
    "aziende.create",
    "activity_types.read",
    "activity_types.manage",
  ]),
  approved: true,
};

async function seedRepos() {
  const repos = createInMemoryRepositories();
  (
    repos.auth as unknown as { setSimulatedUser: (a: ActorContext) => void }
  ).setSimulatedUser(ADMIN);
  await repos.aziende.create({ nome: "Zeta" }, ADMIN);
  await repos.aziende.create({ nome: "Alfa" }, ADMIN);
  await repos.activityTypes.upsert("t-zeta", {
    nome: "Zeta",
    ordine: 30,
    attivo: true,
  });
  await repos.activityTypes.upsert("t-alfa", {
    nome: "Alfa",
    ordine: 10,
    attivo: true,
  });
  await repos.activityTypes.upsert("t-mid", {
    nome: "Inattivo",
    ordine: 20,
    attivo: false,
  });
  return { repos };
}

describe("useReferenceData", () => {
  it("returns aziende sorted alphabetically", async () => {
    const { repos } = await seedRepos();
    const { result } = renderHook(() => useReferenceData(), {
      wrapper: buildProvidersWrapper({ repos }),
    });
    await waitFor(() => expect(result.current.aziende).toHaveLength(2));
    expect(result.current.aziende[0]?.nome).toBe("Alfa");
    expect(result.current.aziende[1]?.nome).toBe("Zeta");
  });

  it("returns only active tipi, sorted by ordine ascending", async () => {
    const { repos } = await seedRepos();
    const { result } = renderHook(() => useReferenceData(), {
      wrapper: buildProvidersWrapper({ repos }),
    });
    await waitFor(() => expect(result.current.tipi).toHaveLength(2));
    expect(result.current.tipi[0]?.nome).toBe("Alfa");
    expect(result.current.tipi[1]?.nome).toBe("Zeta");
  });

  it("addAzienda optimistically appends to the cached list", async () => {
    const { repos } = await seedRepos();
    const { result } = renderHook(() => useReferenceData(), {
      wrapper: buildProvidersWrapper({ repos }),
    });
    await waitFor(() => expect(result.current.aziende.length).toBeGreaterThan(0));
    const fake: Azienda = {
      id: "manual-add",
      nome: "Manuale",
      nomeNorm: "manuale",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "x",
      updatedBy: "x",
      createdByName: "X",
      updatedByName: "X",
      isDeleted: false,
      schemaVersion: 1,
    };
    act(() => result.current.addAzienda(fake));
    await waitFor(() =>
      expect(
        result.current.aziende.find((a) => a.id === "manual-add")
      ).toBeDefined()
    );
  });

  it("addTipo optimistically appends to the cached list", async () => {
    const { repos } = await seedRepos();
    const { result } = renderHook(() => useReferenceData(), {
      wrapper: buildProvidersWrapper({ repos }),
    });
    await waitFor(() => expect(result.current.tipi.length).toBeGreaterThan(0));
    const fake: ActivityType = {
      id: "t-new",
      nome: "Beta",
      ordine: 15,
      attivo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      schemaVersion: 1,
    };
    act(() => result.current.addTipo(fake));
    await waitFor(() =>
      expect(result.current.tipi.some((t) => t.id === "t-new")).toBe(true)
    );
  });
});

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ActorContext, Repositories } from "@vet/shared";
import {
  InMemoryAttivitaRepository,
  InMemoryAuthService,
  InMemoryTrashService,
} from "@vet/shared/testing";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { impostazioniI18n as t } from "../../i18n";
import { useGdprErasure } from "../useGdprErasure";

const VET: ActorContext = {
  uid: "vet-1",
  email: "vet@example.com",
  displayName: "Vet One",
  roleId: "vet",
  caps: new Set(),
  approved: true,
};

function harness() {
  const auth = new InMemoryAuthService();
  auth.setSimulatedUser(VET);
  const attivita = new InMemoryAttivitaRepository();
  const trash = new InMemoryTrashService(
    attivita,
    () => auth.getCurrentUser()?.uid ?? null
  );
  return { repos: { auth, attivita, trash } as unknown as Repositories, auth, trash };
}

describe("useGdprErasure", () => {
  it("erases the vet's data and marks the flow done", async () => {
    const { repos, auth, trash } = harness();
    vi.spyOn(auth, "signOut").mockResolvedValue();
    const erase = vi.spyOn(trash, "gdprDeleteMine");
    const { result } = renderHook(() => useGdprErasure(), {
      wrapper: buildProvidersWrapper({ repos }),
    });

    await act(async () => {
      await result.current.erase();
    });

    expect(erase).toHaveBeenCalledTimes(1);
    expect(result.current.done).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("surfaces an error and clears busy when erasure fails", async () => {
    const { repos, trash } = harness();
    vi.spyOn(trash, "gdprDeleteMine").mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useGdprErasure(), {
      wrapper: buildProvidersWrapper({ repos }),
    });

    await act(async () => {
      await result.current.erase();
    });

    expect(result.current.error).toBe(t.gdprErrore);
    expect(result.current.busy).toBe(false);
    expect(result.current.done).toBe(false);
  });
});

import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { InMemoryAziendeRepository } from "@vet/shared/testing";
import type { ActorContext } from "@vet/shared";
import { useAziendaForm } from "../useAziendaForm";

const actor: ActorContext = {
  uid: "u1",
  email: "tester@example.com",
  displayName: "Tester",
  roleId: "vet",
  caps: new Set(["aziende.create", "aziende.update"]),
  approved: true,
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe("useAziendaForm", () => {
  it("starts in create mode with an empty form and not loading", () => {
    const repo = new InMemoryAziendeRepository();
    const { result } = renderHook(
      () => useAziendaForm({ id: undefined, user: actor, repo }),
      { wrapper }
    );
    expect(result.current.isEdit).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.form.nome).toBe("");
    expect(result.current.loaded).toBeNull();
  });

  it("loads existing azienda values into the form in edit mode", async () => {
    const repo = new InMemoryAziendeRepository();
    const id = await repo.create(
      { nome: "Cascina Test", indirizzo: "Via Roma 1" },
      actor
    );
    const { result } = renderHook(
      () => useAziendaForm({ id, user: actor, repo }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isEdit).toBe(true);
    expect(result.current.form.nome).toBe("Cascina Test");
    expect(result.current.form.indirizzo).toBe("Via Roma 1");
    expect(result.current.loaded?.id).toBe(id);
  });

  it("update writes the field and clears its prior error", async () => {
    const repo = new InMemoryAziendeRepository();
    const { result } = renderHook(
      () => useAziendaForm({ id: undefined, user: actor, repo }),
      { wrapper }
    );
    act(() => {
      result.current.update("nome", "Nuova Cascina");
    });
    expect(result.current.form.nome).toBe("Nuova Cascina");
    expect(result.current.errors.nome).toBeUndefined();
  });
});

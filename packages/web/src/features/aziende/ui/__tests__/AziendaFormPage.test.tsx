import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import {
  InMemoryAuthService,
  InMemoryAziendeRepository,
} from "@vet/shared/testing";
import type { ActorContext } from "@vet/shared";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { AziendaFormPage } from "../AziendaFormPage";

const ACTOR: ActorContext = {
  uid: "u1",
  email: "tester@example.com",
  displayName: "Tester",
  roleId: "vet",
  caps: new Set(["aziende.create", "aziende.update"]),
  approved: true,
};

interface Harness {
  aziende: InMemoryAziendeRepository;
  auth: InMemoryAuthService;
}

function renderForm(path: string, harness?: Partial<Harness>) {
  const aziende = harness?.aziende ?? new InMemoryAziendeRepository();
  const auth = harness?.auth ?? new InMemoryAuthService();
  auth.setSimulatedUser(ACTOR);
  const utils = render(
    <Routes>
      <Route path="/aziende" element={<div>LIST</div>} />
      <Route path="/aziende/nuova" element={<AziendaFormPage />} />
      <Route path="/aziende/:id/modifica" element={<AziendaFormPage />} />
    </Routes>,
    {
      wrapper: buildProvidersWrapper({
        repos: { aziende, auth },
        withToast: true,
        withRouter: true,
        initialEntries: [path],
      }),
    }
  );
  return { ...utils, aziende, auth };
}

describe("AziendaFormPage", () => {
  it("creates a new azienda and redirects to the list", async () => {
    const { aziende } = renderForm("/aziende/nuova");
    expect(
      screen.getByRole("heading", { name: /Nuova azienda/i })
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^Nome$/i), {
      target: { value: "Allevamento Verdi" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salva/i }));
    await waitFor(() => {
      expect(screen.getByText("LIST")).toBeInTheDocument();
    });
    const list = await aziende.list();
    expect(list.map((a) => a.nome)).toContain("Allevamento Verdi");
  });

  it("blocks save when nome is empty and surfaces the field error", async () => {
    renderForm("/aziende/nuova");
    fireEvent.click(screen.getByRole("button", { name: /Salva/i }));
    expect(await screen.findByText(/obbligatorio/i)).toBeInTheDocument();
    expect(screen.queryByText("LIST")).not.toBeInTheDocument();
  });

  it("rejects an invalid partita iva", async () => {
    renderForm("/aziende/nuova");
    fireEvent.change(screen.getByLabelText(/^Nome$/i), {
      target: { value: "X" },
    });
    fireEvent.change(screen.getByLabelText(/Partita IVA/i), {
      target: { value: "00000000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salva/i }));
    expect(
      await screen.findByText(/Partita IVA non valida/i)
    ).toBeInTheDocument();
  });

  it("rejects duplicate nome in create mode", async () => {
    const aziende = new InMemoryAziendeRepository();
    await aziende.create({ nome: "Cascina Bianchi" }, ACTOR);
    renderForm("/aziende/nuova", { aziende });
    fireEvent.change(screen.getByLabelText(/^Nome$/i), {
      target: { value: "cascina BIANCHI" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salva/i }));
    expect(
      await screen.findByText(/Esiste già un'azienda con questo nome/i)
    ).toBeInTheDocument();
  });

  it("hydrates edit form with existing values exactly once", async () => {
    const aziende = new InMemoryAziendeRepository();
    const { id } = await aziende.create(
      { nome: "Cascina Rossi", indirizzo: "Via Roma 1" },
      ACTOR
    );
    renderForm(`/aziende/${id}/modifica`, { aziende });
    await waitFor(() => {
      const input = screen.getByLabelText(/^Nome$/i) as HTMLInputElement;
      expect(input.value).toBe("Cascina Rossi");
    });
    const indirizzo = screen.getByLabelText(/Indirizzo/i) as HTMLInputElement;
    expect(indirizzo.value).toBe("Via Roma 1");
  });

  it("updates an existing azienda and returns to the list", async () => {
    const aziende = new InMemoryAziendeRepository();
    const { id } = await aziende.create({ nome: "Cascina Vecchia" }, ACTOR);
    renderForm(`/aziende/${id}/modifica`, { aziende });
    await waitFor(() => {
      const input = screen.getByLabelText(/^Nome$/i) as HTMLInputElement;
      expect(input.value).toBe("Cascina Vecchia");
    });
    fireEvent.change(screen.getByLabelText(/^Nome$/i), {
      target: { value: "Cascina Nuova" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salva/i }));
    await waitFor(() => {
      expect(screen.getByText("LIST")).toBeInTheDocument();
    });
    const reloaded = await aziende.getById(id);
    expect(reloaded?.nome).toBe("Cascina Nuova");
  });
});

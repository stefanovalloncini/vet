import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { ActorContext, Repositories } from "@vet/shared";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { AttivitaFormPage } from "../AttivitaFormPage";

const ACTOR: ActorContext = {
  uid: "vet-1",
  email: "vet@example.com",
  displayName: "Vet One",
  roleId: "vet",
  caps: new Set([
    "activities.create",
    "activities.update.own",
    "activities.delete.own",
  ]),
  approved: true,
};

interface SeededRepos {
  repos: Repositories;
  aziendaId: string;
  tipoId: string;
}

async function seedRepos(): Promise<SeededRepos> {
  const repos = createInMemoryRepositories();
  (
    repos.auth as unknown as { setSimulatedUser: (a: ActorContext) => void }
  ).setSimulatedUser(ACTOR);
  const { id: aziendaId } = await repos.aziende.create({ nome: "Cascina Verdi" }, ACTOR);
  const tipoId = "tipo-visita";
  await repos.activityTypes.upsert(tipoId, {
    nome: "Visita",
    ordine: 1,
    attivo: true,
  });
  return { repos, aziendaId, tipoId };
}

function renderForm(path: string, repos: Repositories) {
  return render(
    <Routes>
      <Route path="/attivita" element={<div>LIST</div>} />
      <Route path="/attivita/nuova" element={<AttivitaFormPage />} />
      <Route path="/attivita/:id" element={<AttivitaFormPage />} />
    </Routes>,
    {
      wrapper: buildProvidersWrapper({
        repos,
        withToast: true,
        withRouter: true,
        initialEntries: [path],
      }),
    }
  );
}

describe("AttivitaFormPage", () => {
  it("shows a labelled loading spinner before reference data resolves", async () => {
    const { repos } = await seedRepos();
    renderForm("/attivita/nuova", repos);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Nuova attività/i })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /^Salva$/i })
      ).toBeInTheDocument();
    });
  });

  it("creates a new attivita with valid input and navigates to the list", async () => {
    const { repos, aziendaId, tipoId } = await seedRepos();
    renderForm("/attivita/nuova", repos);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Nuova attività/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^Salva$/i })
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Azienda/i, { exact: false }), {
      target: { value: aziendaId },
    });
    fireEvent.change(screen.getByLabelText(/Tipo/i, { exact: false }), {
      target: { value: tipoId },
    });
    fireEvent.change(screen.getByLabelText(/Tariffa/i), {
      target: { value: "120" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Salva$/i }));

    await waitFor(() => {
      expect(screen.getByText("LIST")).toBeInTheDocument();
    });

    const created = await repos.attivita.list();
    expect(created).toHaveLength(1);
    expect(created[0]?.aziendaId).toBe(aziendaId);
    expect(created[0]?.tipoId).toBe(tipoId);
    expect(created[0]?.tariffa).toBe(120);
  });

  it("shows field errors when required fields are missing", async () => {
    const { repos } = await seedRepos();
    renderForm("/attivita/nuova", repos);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Nuova attività/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^Salva$/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^Salva$/i }));

    expect(await screen.findByText(/Scegli un'azienda/i)).toBeInTheDocument();
    expect(await screen.findByText(/Scegli un tipo/i)).toBeInTheDocument();
    expect(await screen.findByText(/Tariffa obbligatoria/i)).toBeInTheDocument();
    expect(screen.queryByText("LIST")).not.toBeInTheDocument();
    expect(await repos.attivita.list()).toHaveLength(0);
  });

  it("hydrates the form with existing values in edit mode", async () => {
    const { repos, aziendaId, tipoId } = await seedRepos();
    const { id } = await repos.attivita.create(
      {
        data: new Date("2026-04-01"),
        aziendaId,
        tipoId,
        oraria: false, adElemento: false,
        tariffa: 90,
      },
      { aziendaNome: "Cascina Verdi", tipoNome: "Visita" },
      ACTOR
    );
    renderForm(`/attivita/${id}`, repos);

    await waitFor(() => {
      const tariffa = screen.getByLabelText(/Tariffa/i) as HTMLInputElement;
      expect(tariffa.value).toBe("90");
    });
    expect(
      screen.getByRole("heading", { name: /Modifica attività/i })
    ).toBeInTheDocument();
  });

  it("requires the ore field when oraria is checked", async () => {
    const { repos, aziendaId, tipoId } = await seedRepos();
    renderForm("/attivita/nuova", repos);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Nuova attività/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^Salva$/i })
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Azienda/i, { exact: false }), {
      target: { value: aziendaId },
    });
    fireEvent.change(screen.getByLabelText(/Tipo/i, { exact: false }), {
      target: { value: tipoId },
    });
    fireEvent.change(screen.getByLabelText(/Tariffa/i), {
      target: { value: "50" },
    });
    fireEvent.click(screen.getByLabelText(/Pagamento orario/i));
    fireEvent.click(screen.getByRole("button", { name: /^Salva$/i }));

    expect(await screen.findByText(/Ore obbligatorie/i)).toBeInTheDocument();
    expect(await repos.attivita.list()).toHaveLength(0);
  });
});

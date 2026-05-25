import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ActorContext, Repositories } from "@vet/shared";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { ExportDialog } from "../ExportDialog";

const ACTOR: ActorContext = {
  uid: "vet-1",
  email: "vet@example.com",
  displayName: "Vet One",
  roleId: "vet",
  caps: new Set(["activities.export", "aziende.read", "activity_types.read"]),
  approved: true,
};

async function seedRepos(): Promise<{ repos: Repositories; aziendaId: string }> {
  const repos = createInMemoryRepositories();
  (
    repos.auth as unknown as { setSimulatedUser: (a: ActorContext) => void }
  ).setSimulatedUser(ACTOR);
  const { id: aziendaId } = await repos.aziende.create(
    { nome: "Cascina Verdi" },
    ACTOR
  );
  return { repos, aziendaId };
}

describe("ExportDialog", () => {
  it("pre-populates fields with initial values from parent filters", async () => {
    const { repos, aziendaId } = await seedRepos();
    render(
      <ExportDialog
        onClose={() => {}}
        initialFrom="2026-05-01"
        initialTo="2026-05-31"
        initialAziendaId={aziendaId}
      />,
      { wrapper: buildProvidersWrapper({ repos }) }
    );
    const fromInput = await screen.findByLabelText(/^Da$/i);
    const toInput = screen.getByLabelText(/^A$/i);
    expect((fromInput as HTMLInputElement).value).toBe("2026-05-01");
    expect((toInput as HTMLInputElement).value).toBe("2026-05-31");
    const aziendaSelect = screen.getByLabelText(
      /Azienda/i
    ) as HTMLSelectElement;
    await waitFor(() => expect(aziendaSelect.value).toBe(aziendaId));
  });

  it("defaults to empty values when no initial filters are provided", async () => {
    const { repos } = await seedRepos();
    render(<ExportDialog onClose={() => {}} />, {
      wrapper: buildProvidersWrapper({ repos }),
    });
    const fromInput = (await screen.findByLabelText(
      /^Da$/i
    )) as HTMLInputElement;
    const toInput = screen.getByLabelText(/^A$/i) as HTMLInputElement;
    expect(fromInput.value).toBe("");
    expect(toInput.value).toBe("");
  });

  it("falls back to no selection when initial aziendaId does not exist", async () => {
    const { repos } = await seedRepos();
    render(
      <ExportDialog onClose={() => {}} initialAziendaId="ghost-id-123" />,
      { wrapper: buildProvidersWrapper({ repos }) }
    );
    const aziendaSelect = (await screen.findByLabelText(
      /Azienda/i
    )) as HTMLSelectElement;
    // The select renders "Tutte" as the only valid option, so its DOM value is "".
    expect(aziendaSelect.value).toBe("");
  });
});

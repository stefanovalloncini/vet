import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { ActorContext, Capability, Repositories } from "@vet/shared";
import {
  InMemoryAttivitaRepository,
  InMemoryAuthService,
  InMemoryTrashService,
} from "@vet/shared/testing";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { setViewport } from "../../../../__tests__/viewport";
import { cestinoI18n as t } from "../../i18n";
import { CestinoPage } from "../CestinoPage";

vi.mock("../../../../shared/ui/AppShell", () => ({
  AppShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

function actor(uid: string, caps: Capability[]): ActorContext {
  return {
    uid,
    email: `${uid}@vet.it`,
    displayName: uid,
    roleId: "vet",
    caps: new Set(caps),
    approved: true,
  };
}

interface Harness {
  repos: Repositories;
  attivita: InMemoryAttivitaRepository;
  trash: InMemoryTrashService;
}

function buildHarness(caps: Capability[], uid = "vet-1"): Harness {
  const auth = new InMemoryAuthService();
  auth.setSimulatedUser(actor(uid, caps));
  const attivita = new InMemoryAttivitaRepository();
  const trash = new InMemoryTrashService(
    attivita,
    () => auth.getCurrentUser()?.uid ?? null
  );
  return {
    repos: { auth, attivita, trash } as unknown as Repositories,
    attivita,
    trash,
  };
}

async function seedDeleted(
  attivita: InMemoryAttivitaRepository,
  owner: ActorContext,
  aziendaNome: string
): Promise<string> {
  const a = await attivita.create(
    {
      data: new Date("2026-01-10T08:00:00Z"),
      aziendaId: "az-1",
      tipoId: "visita",
      oraria: false,
      adElemento: false,
      tariffa: 50,
    },
    { aziendaNome, tipoNome: "Visita" },
    owner
  );
  await attivita.softDelete(a.id, owner);
  return a.id;
}

function renderPage(repos: Repositories) {
  return render(<CestinoPage />, {
    wrapper: buildProvidersWrapper({ repos }),
  });
}

describe("CestinoPage", () => {
  beforeEach(() => {
    setViewport(375);
  });

  it("shows the mine/all tabs only to users who can read any trash", () => {
    const { repos } = buildHarness(["trash.read.any"]);
    renderPage(repos);
    expect(screen.getByText(t.viewAll)).toBeInTheDocument();
  });

  it("hides the mine/all tabs from users without trash.read.any", () => {
    const { repos } = buildHarness(["trash.restore.own"]);
    renderPage(repos);
    expect(screen.queryByText(t.viewAll)).toBeNull();
  });

  it("renders the empty state when nothing is in the trash", async () => {
    const { repos } = buildHarness(["trash.read.any"]);
    renderPage(repos);
    expect(await screen.findByText(t.empty)).toBeInTheDocument();
  });

  it("offers a bulk purge action only to users with trash.purge", async () => {
    const { repos, attivita } = buildHarness(["trash.read.any", "trash.purge"]);
    await seedDeleted(attivita, actor("vet-1", ["trash.purge"]), "Cascina A");
    renderPage(repos);
    expect(
      await screen.findByRole("button", { name: t.eliminaSelezionati })
    ).toBeInTheDocument();
  });

  it("withholds the bulk purge action from users without trash.purge", async () => {
    const { repos, attivita } = buildHarness([
      "trash.read.any",
      "trash.restore.own",
    ]);
    await seedDeleted(attivita, actor("vet-1", []), "Cascina A");
    renderPage(repos);
    await screen.findByLabelText(t.selezionaTutto);
    expect(
      screen.queryByRole("button", { name: t.eliminaSelezionati })
    ).toBeNull();
  });

  it("permanently purges the selected items only after the danger confirmation", async () => {
    const { repos, attivita, trash } = buildHarness([
      "trash.read.any",
      "trash.purge",
    ]);
    const owner = actor("vet-1", []);
    await seedDeleted(attivita, owner, "Cascina A");
    await seedDeleted(attivita, owner, "Cascina B");
    const purge = vi.spyOn(trash, "purgeAttivita");
    renderPage(repos);

    fireEvent.click(await screen.findByLabelText(t.selezionaTutto));
    fireEvent.click(screen.getByRole("button", { name: t.eliminaSelezionati }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(t.confermaPurgeBulkTitolo)).toBeInTheDocument();
    expect(purge).not.toHaveBeenCalled();

    fireEvent.click(
      within(dialog).getByRole("button", { name: t.eliminaSelezionati })
    );

    await waitFor(() => expect(purge).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(t.empty)).toBeInTheDocument();
  });

  it("lets a restore.own user restore their own record but not another vet's", async () => {
    const { repos, attivita, trash } = buildHarness([
      "trash.read.any",
      "trash.restore.own",
    ]);
    const mineId = await seedDeleted(attivita, actor("vet-1", []), "Mia Azienda");
    await seedDeleted(attivita, actor("vet-2", []), "Azienda Altrui");
    const restore = vi.spyOn(trash, "restoreAttivita");
    renderPage(repos);

    await screen.findByText("Mia Azienda");
    expect(screen.getByText("Azienda Altrui")).toBeInTheDocument();

    const restoreButtons = screen.getAllByRole("button", { name: t.ripristina });
    expect(restoreButtons).toHaveLength(1);

    fireEvent.click(restoreButtons[0]!);
    await waitFor(() => expect(restore).toHaveBeenCalledWith(mineId));
  });
});

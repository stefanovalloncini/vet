import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { ActorContext, Capability, Repositories } from "@vet/shared";
import {
  InMemoryActivityTypesRepository,
  InMemoryAuthService,
  InMemoryAziendeRepository,
  InMemoryRemindersRepository,
} from "@vet/shared/testing";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { remindersI18n as t } from "../../i18n";
import { RemindersPage } from "../RemindersPage";

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
  reminders: InMemoryRemindersRepository;
}

function buildHarness(caps: Capability[], uid = "vet-1"): Harness {
  const auth = new InMemoryAuthService();
  auth.setSimulatedUser(actor(uid, caps));
  const reminders = new InMemoryRemindersRepository();
  const aziende = new InMemoryAziendeRepository();
  const activityTypes = new InMemoryActivityTypesRepository();
  return {
    repos: { auth, reminders, aziende, activityTypes } as unknown as Repositories,
    reminders,
  };
}

async function seedReminder(
  reminders: InMemoryRemindersRepository,
  owner: ActorContext,
  titolo: string
): Promise<void> {
  await reminders.create(
    { aziendaId: "az-1", titolo, dueAt: new Date("2026-02-01T09:00:00Z") },
    { aziendaNome: "Cascina A" },
    owner
  );
}

function renderPage(repos: Repositories) {
  return render(<RemindersPage />, {
    wrapper: buildProvidersWrapper({ repos }),
  });
}

describe("RemindersPage", () => {
  it("offers toggle/delete only on the vet's own reminders (own caps, no .any)", async () => {
    const { repos, reminders } = buildHarness([
      "reminders.read",
      "reminders.update.own",
      "reminders.delete.own",
    ]);
    await seedReminder(reminders, actor("vet-1", []), "Mia nota");
    await seedReminder(reminders, actor("vet-2", []), "Nota altrui");
    renderPage(repos);

    await waitFor(() => expect(screen.getByText("Mia nota")).toBeInTheDocument());
    expect(screen.getByText("Nota altrui")).toBeInTheDocument();

    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: t.elimina })).toHaveLength(1);
  });

  it("offers toggle/delete on every reminder for a vet with .any caps", async () => {
    const { repos, reminders } = buildHarness([
      "reminders.read",
      "reminders.update.any",
      "reminders.delete.any",
    ]);
    await seedReminder(reminders, actor("vet-1", []), "Mia nota");
    await seedReminder(reminders, actor("vet-2", []), "Nota altrui");
    renderPage(repos);

    await waitFor(() => expect(screen.getByText("Mia nota")).toBeInTheDocument());
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: t.elimina })).toHaveLength(2);
  });

  it("shows the create action to a vet with reminders.create", async () => {
    const { repos } = buildHarness(["reminders.read", "reminders.create"]);
    renderPage(repos);
    expect(
      await screen.findByRole("button", { name: t.nuovo })
    ).toBeInTheDocument();
  });

  it("hides the create action without reminders.create", async () => {
    const { repos } = buildHarness(["reminders.read"]);
    renderPage(repos);
    await waitFor(() => expect(screen.getByText(t.emptyAll)).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: t.nuovo })).toBeNull();
  });

  it("shows the empty state when there are no reminders", async () => {
    const { repos } = buildHarness(["reminders.read"]);
    renderPage(repos);
    await waitFor(() => expect(screen.getByText(t.emptyAll)).toBeInTheDocument());
  });
});

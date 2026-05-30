import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { ActorContext, Repositories } from "@vet/shared";
import {
  InMemoryAttivitaRepository,
  InMemoryAuthService,
  InMemoryAziendeRepository,
  InMemoryRemindersRepository,
  InMemoryTrashService,
} from "@vet/shared/testing";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { impostazioniI18n as t } from "../../i18n";
import { ImpostazioniPage } from "../ImpostazioniPage";

vi.mock("../../../../shared/ui/AppShell", () => ({
  AppShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

function installStorage(): void {
  const store = new Map<string, string>();
  const stub: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => (store.has(key) ? (store.get(key) as string) : null),
    key: (i) => Array.from(store.keys())[i] ?? null,
    removeItem: (key) => void store.delete(key),
    setItem: (key, value) => void store.set(key, String(value)),
  };
  Object.defineProperty(window, "localStorage", { configurable: true, value: stub });
}

function actor(over: Partial<ActorContext> = {}): ActorContext {
  return {
    uid: "vet-1",
    email: "vet@example.com",
    displayName: "Vet One",
    roleId: "vet",
    caps: new Set(),
    approved: true,
    ...over,
  };
}

interface Harness {
  repos: Repositories;
  auth: InMemoryAuthService;
  attivita: InMemoryAttivitaRepository;
  trash: InMemoryTrashService;
}

function buildHarness(user: ActorContext | null = actor()): Harness {
  const auth = new InMemoryAuthService();
  auth.setSimulatedUser(user);
  const attivita = new InMemoryAttivitaRepository();
  const trash = new InMemoryTrashService(
    attivita,
    () => auth.getCurrentUser()?.uid ?? null
  );
  const aziende = new InMemoryAziendeRepository();
  const reminders = new InMemoryRemindersRepository();
  return {
    repos: { auth, attivita, trash, aziende, reminders } as unknown as Repositories,
    auth,
    attivita,
    trash,
  };
}

function renderPage(repos: Repositories) {
  return render(<ImpostazioniPage />, {
    wrapper: buildProvidersWrapper({ repos }),
  });
}

describe("ImpostazioniPage", () => {
  beforeEach(() => {
    installStorage();
  });

  it("shows the signed-in vet's profile from the auth identity, not a free-text field", () => {
    const { repos } = buildHarness(
      actor({ displayName: "Maria Bianchi", email: "maria@vet.it", roleId: "admin" })
    );
    renderPage(repos);
    expect(screen.getByText("Maria Bianchi")).toBeInTheDocument();
    expect(screen.getByText("maria@vet.it")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("toggles the theme through the radiogroup", () => {
    window.localStorage.setItem("vet.theme", "light");
    const { repos } = buildHarness();
    renderPage(repos);
    const chiaro = screen.getByRole("radio", { name: t.temaChiaro });
    const scuro = screen.getByRole("radio", { name: t.temaScuro });
    expect(chiaro).toBeChecked();
    expect(scuro).not.toBeChecked();
    fireEvent.click(scuro);
    expect(scuro).toBeChecked();
    expect(chiaro).not.toBeChecked();
  });

  it("gates erasure behind a confirmation and erases nothing when cancelled", () => {
    const { repos, trash } = buildHarness();
    const spy = vi.spyOn(trash, "gdprDeleteMine");
    renderPage(repos);
    fireEvent.click(screen.getByRole("button", { name: t.gdprCta }));
    expect(screen.getByText(t.gdprConfermaTitolo)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: t.gdprAnnulla }));
    expect(screen.queryByText(t.gdprConfermaTitolo)).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("erases the vet's data and confirms when the user proceeds", async () => {
    const { repos, auth, trash } = buildHarness();
    const erase = vi.spyOn(trash, "gdprDeleteMine");
    const signOut = vi.spyOn(auth, "signOut").mockResolvedValue();
    renderPage(repos);
    fireEvent.click(screen.getByRole("button", { name: t.gdprCta }));
    fireEvent.click(screen.getByRole("button", { name: t.gdprButton }));
    expect(await screen.findByText(t.gdprDone)).toBeInTheDocument();
    expect(erase).toHaveBeenCalledTimes(1);
    expect(signOut).not.toHaveBeenCalled();
  });

  it("surfaces an error and keeps the vet signed in when erasure fails", async () => {
    const { repos, trash } = buildHarness();
    vi.spyOn(trash, "gdprDeleteMine").mockRejectedValue(new Error("boom"));
    renderPage(repos);
    fireEvent.click(screen.getByRole("button", { name: t.gdprCta }));
    fireEvent.click(screen.getByRole("button", { name: t.gdprButton }));
    expect(await screen.findByText(t.gdprErrore)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t.gdprCta })).toBeInTheDocument();
  });
});

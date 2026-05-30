import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActorContext, Repositories } from "@vet/shared";
import {
  InMemoryAttivitaRepository,
  InMemoryAuthService,
  InMemoryAziendeRepository,
  InMemoryRemindersRepository,
} from "@vet/shared/testing";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { impostazioniI18n as t } from "../../i18n";
import { triggerJsonDownload, triggerCsvDownload } from "../../lib/exportBackup";
import { useBackupExport } from "../useBackupExport";

vi.mock("../../lib/exportBackup", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/exportBackup")>();
  return { ...actual, triggerJsonDownload: vi.fn(), triggerCsvDownload: vi.fn() };
});

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
  const aziende = new InMemoryAziendeRepository();
  const attivita = new InMemoryAttivitaRepository();
  const reminders = new InMemoryRemindersRepository();
  return {
    repos: { auth, aziende, attivita, reminders } as unknown as Repositories,
    aziende,
    attivita,
  };
}

describe("useBackupExport", () => {
  beforeEach(() => {
    installStorage();
    vi.clearAllMocks();
  });

  it("exports a JSON backup carrying the vet's data and records the timestamp", async () => {
    const { repos, aziende } = harness();
    await aziende.create({ nome: "Cascina A" }, VET);
    const { result } = renderHook(() => useBackupExport(), {
      wrapper: buildProvidersWrapper({ repos }),
    });

    await act(async () => {
      await result.current.exportJson();
    });

    expect(triggerJsonDownload).toHaveBeenCalledTimes(1);
    const payload = vi.mocked(triggerJsonDownload).mock.calls[0]![0];
    expect(payload).toMatchObject({ exportedBy: "vet@example.com" });
    expect(payload.aziende).toHaveLength(1);
    expect(result.current.lastBackupAt).not.toBeNull();
    expect(result.current.exportError).toBeNull();
  });

  it("exports activities as a CSV string", async () => {
    const { repos } = harness();
    const { result } = renderHook(() => useBackupExport(), {
      wrapper: buildProvidersWrapper({ repos }),
    });

    await act(async () => {
      await result.current.exportCsv();
    });

    expect(triggerCsvDownload).toHaveBeenCalledTimes(1);
    expect(typeof vi.mocked(triggerCsvDownload).mock.calls[0]![0]).toBe("string");
  });

  it("surfaces an error and clears the busy flag when a repo read fails", async () => {
    const { repos, attivita } = harness();
    vi.spyOn(attivita, "list").mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useBackupExport(), {
      wrapper: buildProvidersWrapper({ repos }),
    });

    await act(async () => {
      await result.current.exportJson();
    });

    expect(triggerJsonDownload).not.toHaveBeenCalled();
    expect(result.current.exportError).toBe(t.datiBackupError);
    expect(result.current.exporting).toBe(false);
  });
});

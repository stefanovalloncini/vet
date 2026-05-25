import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useSidebarSections } from "../useSidebarSections";

const KEY = "vet.sidebarSectionsCollapsed";
const FULL_CAPS: ReadonlySet<string> = new Set([
  "activities.read.all",
  "aziende.read",
  "reminders.read",
  "activity_types.read",
  "roles.read",
  "allowlist.read",
  "audit.read",
  "users.read.all",
  "trash.read.own",
]);

function installStorage(): Storage {
  const store = new Map<string, string>();
  const stub: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.has(key) ? (store.get(key) as string) : null;
    },
    key(i) {
      return Array.from(store.keys())[i] ?? null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(window, "localStorage", { configurable: true, value: stub });
  return stub;
}

describe("useSidebarSections", () => {
  let storage: Storage;
  beforeEach(() => {
    storage = installStorage();
  });

  it("starts with no sections collapsed when storage is empty", () => {
    const { result } = renderHook(() => useSidebarSections("/", FULL_CAPS));
    expect(result.current.collapsedSections.size).toBe(0);
  });

  it("toggles a section open/closed and persists the set", async () => {
    const { result } = renderHook(() => useSidebarSections("/", FULL_CAPS));
    act(() => result.current.toggleSection("Gestione"));
    expect(result.current.collapsedSections.has("Gestione")).toBe(true);
    await waitFor(() => {
      const raw = storage.getItem(KEY);
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw as string)).toContain("Gestione");
    });
    act(() => result.current.toggleSection("Gestione"));
    expect(result.current.collapsedSections.has("Gestione")).toBe(false);
  });

  it("auto-expands the section containing the current path", async () => {
    storage.setItem(KEY, JSON.stringify(["Operatività", "Gestione"]));
    const { result } = renderHook(() => useSidebarSections("/agenda", FULL_CAPS));
    await waitFor(() => {
      expect(result.current.collapsedSections.has("Operatività")).toBe(false);
    });
    expect(result.current.collapsedSections.has("Gestione")).toBe(true);
  });

  it("leaves persisted state alone when the path does not match any section", () => {
    storage.setItem(KEY, JSON.stringify(["Amministrazione"]));
    const { result } = renderHook(() =>
      useSidebarSections("/qualcosa-che-non-esiste", FULL_CAPS)
    );
    expect(result.current.collapsedSections.has("Amministrazione")).toBe(true);
  });

  it("ignores malformed stored values and starts empty", () => {
    storage.setItem(KEY, "{not json");
    const { result } = renderHook(() => useSidebarSections("/", FULL_CAPS));
    expect(result.current.collapsedSections.size).toBe(0);
  });

  it("does not auto-expand when the route requires a missing capability", () => {
    storage.setItem(KEY, JSON.stringify(["Operatività"]));
    const { result } = renderHook(() => useSidebarSections("/agenda", new Set()));
    expect(result.current.collapsedSections.has("Operatività")).toBe(true);
  });
});

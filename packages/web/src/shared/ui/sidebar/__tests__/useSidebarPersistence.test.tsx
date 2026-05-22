import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useSidebarPersistence } from "../useSidebarPersistence";

const KEY = "vet.sidebarCollapsed";

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

describe("useSidebarPersistence", () => {
  let storage: Storage;
  beforeEach(() => {
    storage = installStorage();
  });

  it("defaults to expanded when nothing is stored", () => {
    const { result } = renderHook(() => useSidebarPersistence());
    expect(result.current.collapsed).toBe(false);
  });

  it("reads the persisted collapsed flag on mount", () => {
    storage.setItem(KEY, "1");
    const { result } = renderHook(() => useSidebarPersistence());
    expect(result.current.collapsed).toBe(true);
  });

  it("writes the new value to localStorage when toggled", () => {
    const { result } = renderHook(() => useSidebarPersistence());
    act(() => result.current.setCollapsed(true));
    expect(storage.getItem(KEY)).toBe("1");
    act(() => result.current.setCollapsed(false));
    expect(storage.getItem(KEY)).toBe("0");
  });

  it("treats any non-\"1\" stored value as not collapsed", () => {
    storage.setItem(KEY, "true");
    const { result } = renderHook(() => useSidebarPersistence());
    expect(result.current.collapsed).toBe(false);
  });
});

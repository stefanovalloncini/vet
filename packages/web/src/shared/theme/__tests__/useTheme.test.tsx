import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useTheme } from "../useTheme";

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
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: stub,
  });
  return stub;
}

describe("useTheme", () => {
  beforeEach(() => {
    installStorage();
    // Reset documentElement attribute between tests
    document.documentElement.removeAttribute("data-theme");
  });

  it("defaults to 'light' when no value is stored and no media match", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });

  it("reads the persisted value", () => {
    window.localStorage.setItem("vet.theme", "dark");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("toggle flips between light and dark", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
    act(() => result.current.toggle());
    expect(result.current.theme).toBe("dark");
    act(() => result.current.toggle());
    expect(result.current.theme).toBe("light");
  });

  it("set() forces a specific theme", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.set("dark"));
    expect(result.current.theme).toBe("dark");
    act(() => result.current.set("light"));
    expect(result.current.theme).toBe("light");
  });

  it("persists the current theme to localStorage", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.set("dark"));
    expect(window.localStorage.getItem("vet.theme")).toBe("dark");
  });

  it("sets data-theme attribute on the documentElement", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.set("dark"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("ignores invalid persisted values and falls back to 'light'", () => {
    window.localStorage.setItem("vet.theme", "invalid-value");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });
});

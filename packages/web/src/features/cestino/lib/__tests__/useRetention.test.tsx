import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useRetention } from "../useRetention";

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

describe("useRetention", () => {
  beforeEach(() => {
    installStorage();
  });

  it("defaults to 7 when no value is persisted", () => {
    const { result } = renderHook(() => useRetention());
    expect(result.current[0]).toBe(7);
  });

  it("reads the persisted value on mount", () => {
    window.localStorage.setItem("vet.cestino.retentionDays", "30");
    const { result } = renderHook(() => useRetention());
    expect(result.current[0]).toBe(30);
  });

  it("ignores invalid (non-numeric) persisted values and uses default", () => {
    window.localStorage.setItem("vet.cestino.retentionDays", "abc");
    const { result } = renderHook(() => useRetention());
    expect(result.current[0]).toBe(7);
  });

  it("ignores zero or negative persisted values and uses default", () => {
    window.localStorage.setItem("vet.cestino.retentionDays", "0");
    const { result } = renderHook(() => useRetention());
    expect(result.current[0]).toBe(7);

    window.localStorage.setItem("vet.cestino.retentionDays", "-5");
    const { result: r2 } = renderHook(() => useRetention());
    expect(r2.current[0]).toBe(7);
  });

  it("updates state and localStorage when setter is called", () => {
    const { result } = renderHook(() => useRetention());
    act(() => result.current[1](14));
    expect(result.current[0]).toBe(14);
    expect(window.localStorage.getItem("vet.cestino.retentionDays")).toBe("14");
  });

  it("reacts to cross-tab storage events on the retention key", () => {
    const { result } = renderHook(() => useRetention());
    window.localStorage.setItem("vet.cestino.retentionDays", "21");
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "vet.cestino.retentionDays" })
      );
    });
    expect(result.current[0]).toBe(21);
  });

  it("ignores storage events for unrelated keys", () => {
    const { result } = renderHook(() => useRetention());
    const before = result.current[0];
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "some.other.key" })
      );
    });
    expect(result.current[0]).toBe(before);
  });
});

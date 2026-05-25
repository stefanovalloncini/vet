import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { usePinned } from "../usePinned";

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

describe("usePinned", () => {
  beforeEach(() => {
    installStorage();
  });

  it("starts with an empty set when nothing is persisted", () => {
    const { result } = renderHook(() => usePinned());
    expect(result.current.pinned.size).toBe(0);
    expect(result.current.isPinned("a")).toBe(false);
  });

  it("reads the persisted JSON array on mount", () => {
    window.localStorage.setItem(
      "vet.pinnedAziende",
      JSON.stringify(["az1", "az2"])
    );
    const { result } = renderHook(() => usePinned());
    expect(result.current.isPinned("az1")).toBe(true);
    expect(result.current.isPinned("az2")).toBe(true);
    expect(result.current.isPinned("az3")).toBe(false);
  });

  it("ignores corrupt persisted data and starts empty", () => {
    window.localStorage.setItem("vet.pinnedAziende", "{not json");
    const { result } = renderHook(() => usePinned());
    expect(result.current.pinned.size).toBe(0);
  });

  it("filters out non-string entries from corrupt data", () => {
    window.localStorage.setItem(
      "vet.pinnedAziende",
      JSON.stringify(["good", 42, null, "also-good"])
    );
    const { result } = renderHook(() => usePinned());
    expect(result.current.isPinned("good")).toBe(true);
    expect(result.current.isPinned("also-good")).toBe(true);
    expect(result.current.pinned.size).toBe(2);
  });

  it("toggle adds a new id and persists to localStorage", () => {
    const { result } = renderHook(() => usePinned());
    act(() => result.current.toggle("az1"));
    expect(result.current.isPinned("az1")).toBe(true);
    expect(window.localStorage.getItem("vet.pinnedAziende")).toMatch(/az1/);
  });

  it("toggle removes an existing id", () => {
    window.localStorage.setItem(
      "vet.pinnedAziende",
      JSON.stringify(["az1"])
    );
    const { result } = renderHook(() => usePinned());
    act(() => result.current.toggle("az1"));
    expect(result.current.isPinned("az1")).toBe(false);
  });

  it("reacts to storage events on the right key", () => {
    const { result } = renderHook(() => usePinned());
    window.localStorage.setItem(
      "vet.pinnedAziende",
      JSON.stringify(["az42"])
    );
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "vet.pinnedAziende" })
      );
    });
    expect(result.current.isPinned("az42")).toBe(true);
  });

  it("ignores storage events for other keys", () => {
    const { result } = renderHook(() => usePinned());
    const before = result.current.pinned.size;
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "other.key" })
      );
    });
    expect(result.current.pinned.size).toBe(before);
  });
});

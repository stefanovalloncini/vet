import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useTags } from "../useTags";

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

describe("useTags", () => {
  beforeEach(() => {
    installStorage();
  });

  it("starts with an empty map when nothing is persisted", () => {
    const { result } = renderHook(() => useTags());
    expect(result.current.tags).toEqual({});
    expect(result.current.allTags()).toEqual([]);
  });

  it("reads persisted tags on mount", () => {
    window.localStorage.setItem(
      "vet.aziendeTags",
      JSON.stringify({ az1: ["veloce", "ricco"] })
    );
    const { result } = renderHook(() => useTags());
    expect(result.current.tagsFor("az1")).toEqual(["veloce", "ricco"]);
  });

  it("returns empty array for azienda without tags", () => {
    const { result } = renderHook(() => useTags());
    expect(result.current.tagsFor("missing")).toEqual([]);
  });

  it("setForAzienda persists the tag list", () => {
    const { result } = renderHook(() => useTags());
    act(() => result.current.setForAzienda("az1", ["a", "b"]));
    expect(result.current.tagsFor("az1")).toEqual(["a", "b"]);
    expect(
      JSON.parse(window.localStorage.getItem("vet.aziendeTags") ?? "{}")
    ).toEqual({ az1: ["a", "b"] });
  });

  it("setForAzienda trims and dedupes tag values", () => {
    const { result } = renderHook(() => useTags());
    act(() => result.current.setForAzienda("az1", ["  a  ", "a", "b", "", " "]));
    expect(result.current.tagsFor("az1")).toEqual(["a", "b"]);
  });

  it("setForAzienda with empty list deletes the azienda entry", () => {
    const { result } = renderHook(() => useTags());
    act(() => result.current.setForAzienda("az1", ["a"]));
    expect(result.current.tagsFor("az1")).toEqual(["a"]);
    act(() => result.current.setForAzienda("az1", []));
    expect(result.current.tags).toEqual({});
  });

  it("allTags returns sorted unique union", () => {
    const { result } = renderHook(() => useTags());
    act(() => result.current.setForAzienda("az1", ["zeta", "alfa"]));
    act(() => result.current.setForAzienda("az2", ["beta", "alfa"]));
    expect(result.current.allTags()).toEqual(["alfa", "beta", "zeta"]);
  });

  it("ignores corrupt persisted data and starts empty", () => {
    window.localStorage.setItem("vet.aziendeTags", "not-json");
    const { result } = renderHook(() => useTags());
    expect(result.current.tags).toEqual({});
  });

  it("syncs from storage events on the right key", () => {
    const { result } = renderHook(() => useTags());
    window.localStorage.setItem(
      "vet.aziendeTags",
      JSON.stringify({ az9: ["nuovo"] })
    );
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "vet.aziendeTags" })
      );
    });
    expect(result.current.tagsFor("az9")).toEqual(["nuovo"]);
  });
});

import { useSyncExternalStore } from "react";

const ASSUME_WHEN_UNAVAILABLE = false;

function evaluate(query: string): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return ASSUME_WHEN_UNAVAILABLE;
  }
  return window.matchMedia(query).matches;
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return () => {};
      }
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => evaluate(query),
    () => evaluate(query)
  );
}

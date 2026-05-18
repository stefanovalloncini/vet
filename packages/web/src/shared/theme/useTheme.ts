import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "vet.theme";

function getInitial(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
    if (typeof window.matchMedia === "function") {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    }
  } catch {
    // ignore localStorage/matchMedia errors in test envs
  }
  return "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitial);

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  return {
    theme,
    toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    set: (t: Theme) => setTheme(t),
  };
}

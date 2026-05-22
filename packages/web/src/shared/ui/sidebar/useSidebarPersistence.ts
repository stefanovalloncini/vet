import { useEffect, useState } from "react";

const COLLAPSED_STORAGE_KEY = "vet.sidebarCollapsed";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage?.getItem(COLLAPSED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export interface UseSidebarPersistenceResult {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useSidebarPersistence(): UseSidebarPersistenceResult {
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed);

  useEffect(() => {
    try {
      window.localStorage?.setItem(COLLAPSED_STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore (e.g. jsdom test env without storage)
    }
  }, [collapsed]);

  return { collapsed, setCollapsed };
}

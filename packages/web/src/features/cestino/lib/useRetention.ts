import { useCallback, useEffect, useState } from "react";

const RETENTION_KEY = "vet.cestino.retentionDays";
const RETENTION_DEFAULT = 7;

function read(): number {
  if (typeof window === "undefined") return RETENTION_DEFAULT;
  try {
    const raw = window.localStorage.getItem(RETENTION_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : RETENTION_DEFAULT;
  } catch {
    return RETENTION_DEFAULT;
  }
}

function persist(value: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RETENTION_KEY, String(value));
  } catch {
    return;
  }
}

export function useRetention(): [number, (next: number) => void] {
  const [value, setValue] = useState<number>(read);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === RETENTION_KEY) setValue(read());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((next: number) => {
    persist(next);
    setValue(next);
  }, []);

  return [value, update];
}

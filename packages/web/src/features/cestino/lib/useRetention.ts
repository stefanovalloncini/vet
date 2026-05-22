import { useCallback, useEffect, useState } from "react";

const RETENTION_KEY = "vet.cestino.retentionDays";
const RETENTION_DEFAULT = 7;

function read(): number {
  if (typeof window === "undefined") return RETENTION_DEFAULT;
  const raw = window.localStorage.getItem(RETENTION_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : RETENTION_DEFAULT;
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
    window.localStorage.setItem(RETENTION_KEY, String(next));
    setValue(next);
  }, []);

  return [value, update];
}

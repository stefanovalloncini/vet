import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "vet.onboarding.seenAt";

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return true;
  }
}

export function useOnboardingState() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!readSeen()) setOpen(true);
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // ignore storage failures
    }
    setOpen(false);
  }, []);

  return { open, dismiss };
}

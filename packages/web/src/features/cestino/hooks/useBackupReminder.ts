import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "../../auth";
import { useToast } from "../../../shared/ui";

const STORAGE_KEY = "vet.backupReminder.lastShownAt";
const REMINDER_INTERVAL_MS = 14 * 24 * 60 * 60 * 1000; // 14 giorni

function readLastShown(): number {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeLastShown(ts: number): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(ts));
  } catch {
    void 0;
  }
}

export function useBackupReminder(): void {
  const { user } = useAuthState();
  const { notify } = useToast();
  const navigate = useNavigate();
  const canSeeReminder = user?.caps.has("users.approve") ?? false;

  useEffect(() => {
    if (!canSeeReminder) return;
    const last = readLastShown();
    const now = Date.now();
    if (now - last < REMINDER_INTERVAL_MS) return;
    const t = window.setTimeout(() => {
      writeLastShown(now);
      notify(
        "Sono passate due settimane: vuoi scaricare un backup?",
        {
          kind: "info",
          duration: 12_000,
          action: {
            label: "Scarica",
            onClick: () => navigate("/impostazioni"),
          },
        }
      );
    }, 1500);
    return () => window.clearTimeout(t);
  }, [canSeeReminder, notify, navigate]);
}

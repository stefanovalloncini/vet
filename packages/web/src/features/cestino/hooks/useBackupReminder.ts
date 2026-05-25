import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "../../auth";
import { useToast } from "../../../shared/ui";
import { getLastBackupAt } from "../lib/exportBackup";

const SHOWN_KEY = "vet.backupReminder.lastShownAt";
const REMINDER_INTERVAL_MS = 14 * 24 * 60 * 60 * 1000; // 14 giorni
const SHOWN_THROTTLE_MS = 24 * 60 * 60 * 1000; // non mostrare più di una volta al giorno

function readShown(): number {
  try {
    const raw = window.localStorage.getItem(SHOWN_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeShown(ts: number): void {
  try {
    window.localStorage.setItem(SHOWN_KEY, String(ts));
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
    const now = Date.now();
    const lastBackup = getLastBackupAt();
    const lastShown = readShown();
    const dueByBackup =
      lastBackup === null || now - lastBackup >= REMINDER_INTERVAL_MS;
    const notRecentlyShown = now - lastShown >= SHOWN_THROTTLE_MS;
    if (!dueByBackup || !notRecentlyShown) return;
    const t = window.setTimeout(() => {
      writeShown(now);
      const msg =
        lastBackup === null
          ? "Non hai mai scaricato un backup. Te lo consiglio adesso."
          : "Sono passate due settimane: vuoi scaricare un backup?";
      notify(msg, {
        kind: "info",
        duration: 12_000,
        action: {
          label: "Scarica",
          onClick: () => navigate("/impostazioni"),
        },
      });
    }, 1500);
    return () => window.clearTimeout(t);
  }, [canSeeReminder, notify, navigate]);
}

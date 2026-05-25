import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "../../auth";
import { useToast } from "../../../shared/ui";
import { getLastBackupAt } from "../lib/exportBackup";
import { decideBackupReminder } from "../lib/backupReminderLogic";

const SHOWN_KEY = "vet.backupReminder.lastShownAt";

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
    const decision = decideBackupReminder({ now, lastBackup, lastShown });
    if (!decision.show) return;
    const t = window.setTimeout(() => {
      writeShown(now);
      const msg =
        decision.reason === "never-shown"
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

import { useState } from "react";
import {
  AppShell,
  Button,
  ConfirmDialog,
  PageHeader,
  SettingsRow,
  SettingsSection,
} from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { impostazioniI18n as t } from "../i18n";
import { RetentionSettings } from "./RetentionSettings";
import { backupFilename, buildBackupPayload, triggerJsonDownload } from "../lib/exportBackup";
import { useRetention } from "../lib/useRetention";

export function ImpostazioniPage() {
  const { user } = useAuthState();
  const { trash, auth, aziende, attivita, reminders } = useRepositories();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [gdprError, setGdprError] = useState<string | null>(null);
  const [retention, setRetention] = useRetention();

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const [az, at, re] = await Promise.all([
        aziende.list(),
        attivita.list(),
        reminders.list(),
      ]);
      const payload = buildBackupPayload({
        exportedBy: user?.email ?? "",
        aziende: az,
        attivita: at,
        reminders: re,
      });
      triggerJsonDownload(payload, backupFilename());
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setExportError(`Export non riuscito: ${msg}`);
      console.error("export failed", err);
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setGdprError(null);
    try {
      await trash.gdprDeleteMine();
      setDone(true);
      setTimeout(() => {
        void auth.signOut();
      }, 1500);
    } catch {
      setGdprError(t.gdprErrore);
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="max-w-3xl">
        <SettingsSection title="Profilo">
          <SettingsRow label="Nome">
            <span className="text-(--color-text)">{user?.displayName ?? "—"}</span>
          </SettingsRow>
          <SettingsRow label="Email">
            <span className="text-(--color-text)">{user?.email ?? "—"}</span>
          </SettingsRow>
          <SettingsRow label="Ruolo">
            <span className="text-(--color-text)">{user?.roleId || "—"}</span>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Cestino">
          <SettingsRow
            label="Permanenza"
            description="Giorni in cui le attività eliminate restano recuperabili prima della cancellazione definitiva."
          >
            <RetentionSettings value={retention} onChange={setRetention} />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Dati">
          <SettingsRow
            label="Backup completo"
            description="Scarica un file JSON con aziende, attività e promemoria."
          >
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? "Esportazione…" : "Scarica JSON"}
              </Button>
              {exportError ? (
                <p role="alert" className="text-xs text-(--color-danger)">
                  {exportError}
                </p>
              ) : null}
            </div>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title={t.gdprSection}>
          <SettingsRow label={t.gdprTitle} description={t.gdprDescr}>
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <GdprAction done={done} busy={busy} onAsk={() => setConfirming(true)} />
              {gdprError ? (
                <p role="alert" className="text-xs text-(--color-danger)">
                  {gdprError}
                </p>
              ) : null}
            </div>
          </SettingsRow>
        </SettingsSection>
      </div>

      <ConfirmDialog
        open={confirming}
        title={t.gdprConfermaTitolo}
        message={t.gdprConferma}
        confirmLabel={t.gdprButton}
        cancelLabel={t.gdprAnnulla}
        variant="danger"
        busy={busy}
        onConfirm={() => {
          setConfirming(false);
          void handleDelete();
        }}
        onClose={() => setConfirming(false)}
      />
    </AppShell>
  );
}

interface GdprActionProps {
  done: boolean;
  busy: boolean;
  onAsk: () => void;
}

function GdprAction({ done, busy, onAsk }: GdprActionProps) {
  if (done) return <p className="text-xs text-(--color-text)">{t.gdprDone}</p>;
  if (busy) return <p className="text-xs text-(--color-text-muted)">{t.gdprBusy}</p>;
  return (
    <Button type="button" variant="danger" size="sm" onClick={onAsk}>
      Elimina i miei dati
    </Button>
  );
}

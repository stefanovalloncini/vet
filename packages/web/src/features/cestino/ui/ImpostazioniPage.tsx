import type { ReactNode } from "react";
import { useState } from "react";
import { AppShell, Button, Card, ConfirmDialog, PageHeader } from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { impostazioniI18n as t } from "../i18n";
import { RetentionSettings } from "./RetentionSettings";
import { backupFilename, buildBackupPayload, triggerJsonDownload } from "../lib/exportBackup";
import { useRetention } from "../lib/useRetention";

export function ImpostazioniPage() {
  const { user } = useAuthState();
  const { trash, auth, aziende, attivita, payments, reminders } = useRepositories();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [retention, setRetention] = useRetention();

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      const [az, at, pa, re] = await Promise.all([
        aziende.list(),
        attivita.list(),
        payments.list(),
        reminders.list(),
      ]);
      const payload = buildBackupPayload({
        exportedBy: user?.email ?? "",
        aziende: az,
        attivita: at,
        payments: pa,
        reminders: re,
      });
      triggerJsonDownload(payload, backupFilename());
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Export non riuscito: ${msg}`);
      console.error("export failed", err);
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      await trash.gdprDeleteMine();
      setDone(true);
      setTimeout(() => {
        void auth.signOut();
      }, 1500);
    } catch {
      setError(t.gdprErrore);
      setBusy(false);
    }
  }

  const profileRows: Array<[string, string]> = [
    ["Nome", user?.displayName ?? "—"],
    ["Email", user?.email ?? "—"],
    ["Ruolo", user?.roleId || "—"],
  ];

  return (
    <AppShell>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="max-w-2xl">
        <Card>
          <SectionLabel className="mb-3">Profilo</SectionLabel>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {profileRows.map(([label, val]) => (
              <div key={label}>
                <dt className="text-(--color-text-subtle) text-xs mb-1">{label}</dt>
                <dd className="text-(--color-text)">{val}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <SectionLabel className="mt-10 mb-3">Cestino</SectionLabel>
        <RetentionSettings value={retention} onChange={setRetention} />

        <SectionLabel className="mt-10 mb-3">Dati</SectionLabel>
        <Card>
          <h2 className="text-base font-medium text-(--color-text)">Esporta i tuoi dati</h2>
          <p className="text-sm text-(--color-text-muted) mt-2 max-w-prose">
            Scarica un backup JSON di aziende, attività, pagamenti e promemoria.
          </p>
          <div className="mt-5">
            <Button type="button" variant="secondary" onClick={handleExport} disabled={exporting}>
              {exporting ? "Esportazione…" : "Scarica backup JSON"}
            </Button>
          </div>
        </Card>

        <SectionLabel className="mt-10 mb-3">{t.gdprSection}</SectionLabel>
        <Card>
          <h2 className="text-base font-medium text-(--color-text)">{t.gdprTitle}</h2>
          <p className="text-sm text-(--color-text-muted) mt-2 max-w-prose">{t.gdprDescr}</p>
          <GdprAction
            done={done}
            busy={busy}
            onAsk={() => setConfirming(true)}
          />
          {error ? (
            <p role="alert" className="text-sm text-(--color-danger) mt-3">
              {error}
            </p>
          ) : null}
        </Card>
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

function SectionLabel({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <p className={`text-xs uppercase tracking-wider text-(--color-text-muted) ${className}`}>
      {children}
    </p>
  );
}

function GdprAction({ done, busy, onAsk }: { done: boolean; busy: boolean; onAsk: () => void }) {
  if (done) return <p className="text-sm text-(--color-text) mt-5">{t.gdprDone}</p>;
  if (busy) return <p className="text-sm text-(--color-text-muted) mt-5">{t.gdprBusy}</p>;
  return (
    <div className="mt-5">
      <Button type="button" variant="danger" onClick={onAsk}>
        {t.gdprButton}
      </Button>
    </div>
  );
}

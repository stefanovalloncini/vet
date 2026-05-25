import { useState, type ReactNode } from "react";
import {
  AppShell,
  Button,
  Card,
  ConfirmDialog,
  PageHeader,
  SectionLabel,
  SettingsRow,
} from "../../../shared/ui";
import { useTheme } from "../../../shared/theme/useTheme";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { impostazioniI18n as t } from "../i18n";
import { RetentionSettings } from "./RetentionSettings";
import {
  attivitaCsvFilename,
  backupFilename,
  buildBackupPayload,
  getLastBackupAt,
  markBackupDone,
  triggerCsvDownload,
  triggerJsonDownload,
} from "../lib/exportBackup";
import { toCsvItalian } from "../../attivita";
import { useRetention } from "../lib/useRetention";

export function ImpostazioniPage() {
  const { user } = useAuthState();
  const { trash, auth, aziende, attivita, reminders } = useRepositories();
  const { theme, set: setTheme } = useTheme();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [csvExporting, setCsvExporting] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [gdprError, setGdprError] = useState<string | null>(null);
  const [retention, setRetention] = useRetention();
  const [lastBackupAt, setLastBackupAt] = useState<number | null>(() =>
    getLastBackupAt()
  );

  async function handleExport(): Promise<void> {
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
      const now = Date.now();
      markBackupDone(now);
      setLastBackupAt(now);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setExportError(`${t.datiBackupError}: ${msg}`);
      console.error("export failed", err);
    } finally {
      setExporting(false);
    }
  }

  async function handleCsvExport(): Promise<void> {
    setCsvExporting(true);
    setCsvError(null);
    try {
      const items = await attivita.list();
      const csv = toCsvItalian(items);
      triggerCsvDownload(csv, attivitaCsvFilename());
      const now = Date.now();
      markBackupDone(now);
      setLastBackupAt(now);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setCsvError(`${t.datiCsvError}: ${msg}`);
      console.error("csv export failed", err);
    } finally {
      setCsvExporting(false);
    }
  }

  function formatLastBackup(ts: number | null): string {
    if (!ts) return t.datiBackupMaiFatto;
    const d = new Date(ts);
    const dt = d.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const days = Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000));
    let relative: string;
    if (days < 1) relative = "oggi";
    else if (days === 1) relative = "ieri";
    else if (days < 30) relative = `${days} giorni fa`;
    else relative = dt;
    return days < 30
      ? `${t.datiBackupUltimo}: ${relative} (${dt})`
      : `${t.datiBackupUltimo}: ${dt}`;
  }

  async function handleDelete(): Promise<void> {
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

      <div className="max-w-3xl space-y-3">
        <Panel title={t.accountSection}>
          <dl className="divide-y divide-(--color-border)">
            <KeyRow label={t.accountNome} value={user?.displayName ?? "—"} />
            <KeyRow label={t.accountEmail} value={user?.email ?? "—"} />
            <KeyRow label={t.accountRuolo} value={user?.roleId || "—"} />
          </dl>
        </Panel>

        <Panel title={t.temaSection} description={t.temaDescr}>
          <ThemeToggle value={theme} onChange={(next) => setTheme(next)} />
        </Panel>

        <Panel title={t.cestinoSection}>
          <SettingsRow
            label={t.cestinoPermanenza}
            description={t.cestinoPermanenzaDescr}
          >
            <RetentionSettings value={retention} onChange={setRetention} />
          </SettingsRow>
        </Panel>

        <Panel
          title={t.datiSection}
          description={formatLastBackup(lastBackupAt)}
        >
          <SettingsRow
            label={t.datiBackup}
            description={
              <DescrWithError text={t.datiBackupDescr} error={exportError} />
            }
          >
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? t.datiBackupBusy : t.datiBackupCta}
            </Button>
          </SettingsRow>
          <SettingsRow
            label={t.datiCsv}
            description={
              <DescrWithError text={t.datiCsvDescr} error={csvError} />
            }
          >
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCsvExport}
              disabled={csvExporting}
            >
              {csvExporting ? t.datiCsvBusy : t.datiCsvCta}
            </Button>
          </SettingsRow>
        </Panel>

        <Panel title={t.gdprSection}>
          <SettingsRow
            label={t.gdprTitle}
            description={
              <DescrWithError text={t.gdprDescr} error={gdprError} />
            }
          >
            <GdprAction done={done} busy={busy} onAsk={() => setConfirming(true)} />
          </SettingsRow>
        </Panel>
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

interface PanelProps {
  title: string;
  description?: string;
  children: ReactNode;
}

function Panel({ title, description, children }: PanelProps) {
  return (
    <Card>
      <header className="mb-2">
        <SectionLabel as="h2">{title}</SectionLabel>
        {description ? (
          <p className="text-xs text-(--color-text-subtle) mt-1 max-w-prose">
            {description}
          </p>
        ) : null}
      </header>
      {children}
    </Card>
  );
}

interface KeyRowProps {
  label: string;
  value: ReactNode;
}

function KeyRow({ label, value }: KeyRowProps) {
  return (
    <div className="py-3 flex items-center justify-between gap-4">
      <dt className="text-sm text-(--color-text-muted)">{label}</dt>
      <dd className="text-sm text-(--color-text) text-right truncate min-w-0">
        {value}
      </dd>
    </div>
  );
}

interface DescrWithErrorProps {
  text: string;
  error: string | null;
}

function DescrWithError({ text, error }: DescrWithErrorProps) {
  return (
    <>
      <span>{text}</span>
      {error ? (
        <span role="alert" className="block text-(--color-danger) mt-1">
          {error}
        </span>
      ) : null}
    </>
  );
}

interface ThemeToggleProps {
  value: "light" | "dark";
  onChange: (next: "light" | "dark") => void;
}

function ThemeToggle({ value, onChange }: ThemeToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label={t.temaSection}
      className="inline-flex rounded-lg border border-(--color-border) bg-(--color-surface) p-0.5"
    >
      <ThemeOption
        label={t.temaChiaro}
        active={value === "light"}
        onClick={() => onChange("light")}
      />
      <ThemeOption
        label={t.temaScuro}
        active={value === "dark"}
        onClick={() => onChange("dark")}
      />
    </div>
  );
}

interface ThemeOptionProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function ThemeOption({ label, active, onClick }: ThemeOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={[
        "px-3 py-1.5 text-sm rounded-md transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)",
        active
          ? "bg-(--color-accent-soft) text-(--color-accent) font-medium"
          : "text-(--color-text-muted) hover:text-(--color-text)",
      ].join(" ")}
    >
      {label}
    </button>
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
      {t.gdprCta}
    </Button>
  );
}

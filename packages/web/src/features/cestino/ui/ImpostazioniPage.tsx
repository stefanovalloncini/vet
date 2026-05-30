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
import { backupAge, type BackupAge } from "../lib/backupReminderLogic";
import { toCsvItalian } from "../../attivita";
import { useRetention } from "../lib/useRetention";
import { useGdprErasure } from "../hooks/useGdprErasure";

function relativeBackupAgeLabel(age: BackupAge): string | null {
  if (age.kind === "today") return "oggi";
  if (age.kind === "yesterday") return "ieri";
  if (age.kind === "days-ago") return `${age.days} giorni fa`;
  return null;
}

export function ImpostazioniPage() {
  const { user } = useAuthState();
  const { aziende, attivita, reminders } = useRepositories();
  const { theme, set: setTheme } = useTheme();
  const erasure = useGdprErasure();
  const [confirming, setConfirming] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [csvExporting, setCsvExporting] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
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
      setExportError(t.datiBackupError);
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
      setCsvError(t.datiCsvError);
      console.error("csv export failed", err);
    } finally {
      setCsvExporting(false);
    }
  }

  function formatLastBackup(ts: number | null): string {
    if (ts === null) return t.datiBackupMaiFatto;
    const age = backupAge(ts);
    const d = new Date(ts);
    const dt = d.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const relative = relativeBackupAgeLabel(age);
    return relative
      ? `${t.datiBackupUltimo}: ${relative} (${dt})`
      : `${t.datiBackupUltimo}: ${dt}`;
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
              <DescrWithError text={t.gdprDescr} error={erasure.error} />
            }
          >
            <GdprAction
              done={erasure.done}
              busy={erasure.busy}
              onAsk={() => setConfirming(true)}
            />
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
        busy={erasure.busy}
        onConfirm={() => {
          setConfirming(false);
          void erasure.erase();
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
    <div className="py-3 flex items-start justify-between gap-4">
      <dt className="text-sm text-(--color-text-muted) shrink-0">{label}</dt>
      <dd className="text-sm text-(--color-text) text-right min-w-0 break-words">
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

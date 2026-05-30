import { useState } from "react";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { toCsvItalian } from "../../attivita";
import { impostazioniI18n as t } from "../i18n";
import {
  attivitaCsvFilename,
  backupFilename,
  buildBackupPayload,
  getLastBackupAt,
  markBackupDone,
  triggerCsvDownload,
  triggerJsonDownload,
} from "../lib/exportBackup";

export interface BackupExport {
  exporting: boolean;
  csvExporting: boolean;
  exportError: string | null;
  csvError: string | null;
  lastBackupAt: number | null;
  exportJson: () => Promise<void>;
  exportCsv: () => Promise<void>;
}

export function useBackupExport(): BackupExport {
  const { user } = useAuthState();
  const { aziende, attivita, reminders } = useRepositories();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [csvExporting, setCsvExporting] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<number | null>(() =>
    getLastBackupAt()
  );

  async function exportJson(): Promise<void> {
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

  async function exportCsv(): Promise<void> {
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

  return {
    exporting,
    csvExporting,
    exportError,
    csvError,
    lastBackupAt,
    exportJson,
    exportCsv,
  };
}

import { useState } from "react";
import { Button, Dialog, Select, TextField } from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useReferenceData } from "../hooks/useReferenceData";
import { attivitaI18n as t } from "../i18n";
import { csvFilename, downloadCsv, toCsvItalian } from "../lib/csv";
import { parseDateInput } from "../lib/format";

interface Props {
  onClose: () => void;
}

export function ExportDialog({ onClose }: Props) {
  const { attivita: repo } = useRepositories();
  const ref = useReferenceData();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [aziendaId, setAziendaId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setBusy(true);
    setError(null);
    try {
      const filters: {
        from?: Date;
        to?: Date;
        aziendaId?: string;
      } = {};
      const fromDate = parseDateInput(from);
      const toDate = parseDateInput(to);
      if (fromDate) filters.from = fromDate;
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        filters.to = end;
      }
      if (aziendaId) filters.aziendaId = aziendaId;
      const items = await repo.list(filters);
      if (items.length === 0) {
        setError(t.esportaNessunDato);
        setBusy(false);
        return;
      }
      const csv = toCsvItalian(items);
      const aziendaNome = aziendaId
        ? ref.aziende.find((a) => a.id === aziendaId)?.nome
        : undefined;
      const filename = csvFilename({
        ...(aziendaNome ? { aziendaNome } : {}),
        ...(filters.from ? { from: filters.from } : {}),
        ...(filters.to ? { to: filters.to } : {}),
      });
      downloadCsv(filename, csv);
      onClose();
    } catch {
      setError(t.esportaErrore);
      setBusy(false);
    }
  }

  const aziendaOptions = [
    { value: "", label: t.filtroTutti },
    ...ref.aziende.map((a) => ({ value: a.id, label: a.nome })),
  ];

  return (
    <Dialog open onClose={onClose} labelledBy="export-dialog-title" size="md">
      <div className="p-5">
        <h2
          id="export-dialog-title"
          className="text-base font-medium text-(--color-text)"
        >
          {t.esportaTitolo}
        </h2>
        <p className="text-sm text-(--color-text-muted) mt-2">
          {t.esportaDescr}
        </p>
        <div className="space-y-4 mt-5">
          <div className="grid grid-cols-2 gap-3">
            <TextField
              id="export-from"
              type="date"
              label={t.filtroDataDa}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              disabled={busy}
            />
            <TextField
              id="export-to"
              type="date"
              label={t.filtroDataA}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={busy}
            />
          </div>
          <Select
            id="export-azienda"
            label={t.filtroAzienda}
            value={aziendaId}
            options={aziendaOptions}
            onChange={(e) => setAziendaId(e.target.value)}
            disabled={busy}
          />
          {error ? (
            <p role="alert" className="text-sm text-(--color-danger)">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={busy}
          >
            {t.annulla}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleExport}
            disabled={busy}
          >
            {t.esportaScarica}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

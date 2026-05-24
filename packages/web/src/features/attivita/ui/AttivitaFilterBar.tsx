import { Select, TextField } from "../../../shared/ui";
import { attivitaI18n as t } from "../i18n";
import { dateInputValue } from "../lib/format";
import type { GroupKey } from "../lib/totals";

const QUICK_RANGES = [
  {
    id: "today",
    label: "Oggi",
    compute: (now: Date) => ({
      from: dateInputValue(now),
      to: dateInputValue(now),
    }),
  },
  {
    id: "week",
    label: "Questa settimana",
    compute: (now: Date) => {
      const day = (now.getDay() + 6) % 7;
      const start = new Date(now);
      start.setDate(now.getDate() - day);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { from: dateInputValue(start), to: dateInputValue(end) };
    },
  },
  {
    id: "month",
    label: "Questo mese",
    compute: (now: Date) => {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: dateInputValue(start), to: dateInputValue(end) };
    },
  },
  {
    id: "lastmonth",
    label: "Mese scorso",
    compute: (now: Date) => {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: dateInputValue(start), to: dateInputValue(end) };
    },
  },
  {
    id: "year",
    label: "Anno",
    compute: (now: Date) => {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { from: dateInputValue(start), to: dateInputValue(end) };
    },
  },
];

interface AttivitaFilterBarProps {
  from: string;
  to: string;
  aziendaId: string;
  tipoId: string;
  vetUid: string;
  group: GroupKey;
  aziendaOptions: ReadonlyArray<{ value: string; label: string }>;
  tipoOptions: ReadonlyArray<{ value: string; label: string }>;
  vetOptions: ReadonlyArray<{ value: string; label: string }>;
  groupOptions: ReadonlyArray<{ value: string; label: string }>;
  onChange: (key: string, value: string) => void;
}

export function AttivitaQuickRanges({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4 print:hidden">
      {QUICK_RANGES.map((q) => (
        <button
          key={q.id}
          type="button"
          onClick={() => {
            const range = q.compute(new Date());
            onChange("from", range.from);
            onChange("to", range.to);
          }}
          className="px-3 py-1 text-xs rounded-full border border-(--color-border) text-(--color-text-muted) hover:text-(--color-text) hover:border-(--color-border-strong)"
        >
          {q.label}
        </button>
      ))}
      {from || to ? (
        <button
          type="button"
          onClick={() => {
            onChange("from", "");
            onChange("to", "");
          }}
          className="px-3 py-1 text-xs rounded-full border border-(--color-border) text-(--color-text-muted) hover:text-(--color-danger)"
        >
          Pulisci
        </button>
      ) : null}
    </div>
  );
}

export function AttivitaFilterBar(props: AttivitaFilterBarProps) {
  return (
    <div className="border-y border-(--color-border) py-4 mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <TextField
          id="from"
          type="date"
          label={t.filtroDataDa}
          value={props.from}
          onChange={(e) => props.onChange("from", e.target.value)}
        />
        <TextField
          id="to"
          type="date"
          label={t.filtroDataA}
          value={props.to}
          onChange={(e) => props.onChange("to", e.target.value)}
        />
        <Select
          id="filtro-azienda"
          label={t.filtroAzienda}
          value={props.aziendaId}
          options={props.aziendaOptions}
          onChange={(e) => props.onChange("azienda", e.target.value)}
        />
        <Select
          id="filtro-tipo"
          label={t.filtroTipo}
          value={props.tipoId}
          options={props.tipoOptions}
          onChange={(e) => props.onChange("tipo", e.target.value)}
        />
        <Select
          id="filtro-vet"
          label={t.filtroVet}
          value={props.vetUid}
          options={props.vetOptions}
          onChange={(e) => props.onChange("vet", e.target.value)}
        />
        <Select
          id="raggruppa"
          label={t.raggruppa}
          value={props.group}
          options={props.groupOptions}
          onChange={(e) => props.onChange("group", e.target.value)}
        />
      </div>
    </div>
  );
}

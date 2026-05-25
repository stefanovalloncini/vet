import { useState, type ReactNode } from "react";
import { Download, SlidersHorizontal, X } from "lucide-react";
import { Badge, Button, Dialog, Select, TextField } from "../../../shared/ui";
import { attivitaI18n as t } from "../i18n";
import { dateInputValue } from "../../../shared/lib/format";
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

export interface AttivitaFilterBarProps {
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
  canExport: boolean;
  onChange: (key: string, value: string) => void;
  onClearAll: () => void;
  onExport: () => void;
}

type ControlsProps = Pick<
  AttivitaFilterBarProps,
  | "from"
  | "to"
  | "aziendaId"
  | "tipoId"
  | "vetUid"
  | "group"
  | "aziendaOptions"
  | "tipoOptions"
  | "vetOptions"
  | "groupOptions"
  | "onChange"
> & { idPrefix?: string };

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
          className="px-3 py-1 text-xs rounded-full border border-(--color-border) text-(--color-text-muted) hover:text-(--color-text) hover:border-(--color-border-strong) transition-colors"
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
          className="px-3 py-1 text-xs rounded-full border border-(--color-border) text-(--color-text-muted) hover:text-(--color-danger) hover:border-(--color-danger)/40 transition-colors"
        >
          Pulisci
        </button>
      ) : null}
    </div>
  );
}

function countActiveFilters(p: ControlsProps): number {
  let n = 0;
  if (p.from) n += 1;
  if (p.to) n += 1;
  if (p.aziendaId) n += 1;
  if (p.tipoId) n += 1;
  if (p.vetUid) n += 1;
  if (p.group !== "none") n += 1;
  return n;
}

function FilterControls({
  from,
  to,
  aziendaId,
  tipoId,
  vetUid,
  group,
  aziendaOptions,
  tipoOptions,
  vetOptions,
  groupOptions,
  onChange,
  idPrefix = "",
}: ControlsProps) {
  return (
    <>
      <TextField
        id={`${idPrefix}from`}
        type="date"
        label={t.filtroDataDa}
        value={from}
        onChange={(e) => onChange("from", e.target.value)}
      />
      <TextField
        id={`${idPrefix}to`}
        type="date"
        label={t.filtroDataA}
        value={to}
        onChange={(e) => onChange("to", e.target.value)}
      />
      <Select
        id={`${idPrefix}filtro-azienda`}
        label={t.filtroAzienda}
        value={aziendaId}
        options={aziendaOptions}
        onChange={(e) => onChange("azienda", e.target.value)}
      />
      <Select
        id={`${idPrefix}filtro-tipo`}
        label={t.filtroTipo}
        value={tipoId}
        options={tipoOptions}
        onChange={(e) => onChange("tipo", e.target.value)}
      />
      <Select
        id={`${idPrefix}filtro-vet`}
        label={t.filtroVet}
        value={vetUid}
        options={vetOptions}
        onChange={(e) => onChange("vet", e.target.value)}
      />
      <Select
        id={`${idPrefix}raggruppa`}
        label={t.raggruppa}
        value={group}
        options={groupOptions}
        onChange={(e) => onChange("group", e.target.value)}
      />
    </>
  );
}

export function AttivitaFilterBar(props: AttivitaFilterBarProps) {
  const [open, setOpen] = useState(false);
  const active = countActiveFilters(props);
  const exportButton = props.canExport ? (
    <IconButton
      label={t.esporta}
      onClick={props.onExport}
      icon={<Download size={18} strokeWidth={1.75} aria-hidden="true" />}
    />
  ) : null;

  return (
    <div className="mb-6">
      <div className="sm:hidden flex items-center gap-2 print:hidden">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => setOpen(true)}
          aria-label={t.filtri}
          aria-haspopup="dialog"
          leadingIcon={<SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />}
          className="flex-1 justify-between"
        >
          <span className="flex items-center gap-2">
            {t.filtri}
            {active > 0 ? (
              <Badge tone="accent" size="sm" aria-label={`${active} filtri attivi`}>
                {active}
              </Badge>
            ) : null}
          </span>
        </Button>
        {exportButton}
      </div>

      <div className="hidden sm:flex sm:items-end sm:gap-3 print:hidden">
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 flex-1">
          <FilterControls {...props} />
        </div>
        {exportButton}
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        labelledBy="filtri-dialog-title"
        size="md"
      >
        <div className="p-5">
          <header className="flex items-center justify-between mb-4">
            <h2
              id="filtri-dialog-title"
              className="text-lg font-medium text-(--color-text)"
            >
              {t.filtri}
            </h2>
            <IconButton
              label={t.chiudi}
              onClick={() => setOpen(false)}
              size="sm"
              icon={<X size={18} strokeWidth={1.75} aria-hidden="true" />}
            />
          </header>
          <div className="grid grid-cols-2 gap-3">
            <FilterControls {...props} idPrefix="m-" />
          </div>
          <footer className="flex items-center justify-end gap-2 mt-6">
            {active > 0 ? (
              <Button type="button" variant="ghost" onClick={props.onClearAll}>
                {t.pulisciFiltri}
              </Button>
            ) : null}
            <Button type="button" variant="primary" onClick={() => setOpen(false)}>
              {t.applicaFiltri}
            </Button>
          </footer>
        </div>
      </Dialog>
    </div>
  );
}

interface IconButtonProps {
  label: string;
  onClick: () => void;
  icon: ReactNode;
  size?: "sm" | "md";
}

function IconButton({ label, onClick, icon, size = "md" }: IconButtonProps) {
  const sizing =
    size === "sm"
      ? "h-9 w-9 rounded-lg"
      : "h-11 w-11 rounded-xl border border-(--color-border) bg-(--color-surface)";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`${sizing} inline-flex items-center justify-center text-(--color-text-muted) hover:text-(--color-text) hover:border-(--color-border-strong) hover:bg-(--color-surface-muted) transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2 active:scale-[0.97] active:duration-(--motion-press) flex-shrink-0`}
    >
      {icon}
    </button>
  );
}

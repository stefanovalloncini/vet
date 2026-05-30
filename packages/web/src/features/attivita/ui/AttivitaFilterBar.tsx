import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Badge, Button, Card, Dialog, IconButton, Select, TextField } from "../../../shared/ui";
import { attivitaI18n as t } from "../i18n";
import { QUICK_RANGES } from "../lib/quickRanges";

export interface AttivitaFilterBarProps {
  from: string;
  to: string;
  aziendaId: string;
  tipoId: string;
  vetUid: string;
  aziendaOptions: ReadonlyArray<{ value: string; label: string }>;
  tipoOptions: ReadonlyArray<{ value: string; label: string }>;
  vetOptions: ReadonlyArray<{ value: string; label: string }>;
  onChange: (key: string, value: string) => void;
  onChangeRange: (from: string, to: string) => void;
  onClearAll: () => void;
}

type ControlsProps = Pick<
  AttivitaFilterBarProps,
  | "from"
  | "to"
  | "aziendaId"
  | "tipoId"
  | "vetUid"
  | "aziendaOptions"
  | "tipoOptions"
  | "vetOptions"
  | "onChange"
> & { idPrefix?: string };

function QuickRanges({
  from,
  to,
  onChangeRange,
}: {
  from: string;
  to: string;
  onChangeRange: (from: string, to: string) => void;
}) {
  const isActive = (id: string): boolean => {
    if (!from && !to) return false;
    const r = QUICK_RANGES.find((q) => q.id === id);
    if (!r) return false;
    const { from: rf, to: rt } = r.compute(new Date());
    return from === rf && to === rt;
  };
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t.filtroPeriodo}>
      {QUICK_RANGES.map((q) => {
        const on = isActive(q.id);
        return (
          <button
            key={q.id}
            type="button"
            onClick={() => {
              const range = q.compute(new Date());
              onChangeRange(range.from, range.to);
            }}
            className={[
              "inline-flex min-h-9 items-center rounded-full border px-3.5 text-xs transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2 active:scale-[0.97] active:duration-(--motion-press)",
              on
                ? "border-(--color-accent) bg-(--color-accent-soft) text-(--color-accent)"
                : "border-(--color-border) text-(--color-text-muted) hover:text-(--color-text) hover:border-(--color-border-strong)",
            ].join(" ")}
            aria-pressed={on}
          >
            {q.label}
          </button>
        );
      })}
    </div>
  );
}

function FilterControls({
  from,
  to,
  aziendaId,
  tipoId,
  vetUid,
  aziendaOptions,
  tipoOptions,
  vetOptions,
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
    </>
  );
}

function countActiveFilters(p: AttivitaFilterBarProps): number {
  let n = 0;
  if (p.from) n += 1;
  if (p.to) n += 1;
  if (p.aziendaId) n += 1;
  if (p.tipoId) n += 1;
  if (p.vetUid) n += 1;
  return n;
}

function FilterHeader({
  active,
  onClearAll,
}: {
  active: number;
  onClearAll: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-baseline gap-2 min-w-0">
        <h2 className="text-sm font-medium text-(--color-text)">{t.filtri}</h2>
        {active > 0 ? (
          <Badge tone="accent" size="sm">
            {active === 1 ? t.filtroUno : t.filtriN(active)}
          </Badge>
        ) : (
          <span className="text-xs text-(--color-text-subtle)">
            {t.filtriNessuno}
          </span>
        )}
      </div>
      {active > 0 ? (
        <Button type="button" variant="ghost" size="sm" onClick={onClearAll}>
          {t.pulisciFiltri}
        </Button>
      ) : null}
    </div>
  );
}

export function AttivitaFilterBar(props: AttivitaFilterBarProps) {
  const [open, setOpen] = useState(false);
  const active = countActiveFilters(props);

  return (
    <div className="mb-6 print:hidden">
      <div className="sm:hidden flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => setOpen(true)}
          aria-label={t.filtri}
          aria-haspopup="dialog"
          leadingIcon={
            <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
          }
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
        {active > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={props.onClearAll}
          >
            {t.pulisciFiltri}
          </Button>
        ) : null}
      </div>

      <Card className="hidden sm:block" padding="md">
        <FilterHeader active={active} onClearAll={props.onClearAll} />
        <QuickRanges
          from={props.from}
          to={props.to}
          onChangeRange={props.onChangeRange}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
          <FilterControls {...props} />
        </div>
      </Card>

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
          <QuickRanges
            from={props.from}
            to={props.to}
            onChangeRange={props.onChangeRange}
          />
          <div className="grid grid-cols-2 gap-3 mt-4">
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


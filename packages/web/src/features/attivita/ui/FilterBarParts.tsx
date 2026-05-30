import { Badge, Button, Select, TextField } from "../../../shared/ui";
import { attivitaI18n as t } from "../i18n";
import { QUICK_RANGES } from "../lib/quickRanges";

interface QuickRangesProps {
  from: string;
  to: string;
  onChangeRange: (from: string, to: string) => void;
}

export function QuickRanges({ from, to, onChangeRange }: QuickRangesProps) {
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

interface ControlsProps {
  from: string;
  to: string;
  aziendaId: string;
  tipoId: string;
  vetUid: string;
  aziendaOptions: ReadonlyArray<{ value: string; label: string }>;
  tipoOptions: ReadonlyArray<{ value: string; label: string }>;
  vetOptions: ReadonlyArray<{ value: string; label: string }>;
  onChange: (key: string, value: string) => void;
  idPrefix?: string;
}

export function FilterControls({
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

interface FilterHeaderProps {
  active: number;
  onClearAll: () => void;
}

export function FilterHeader({ active, onClearAll }: FilterHeaderProps) {
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

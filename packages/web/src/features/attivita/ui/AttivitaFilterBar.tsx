import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Badge, Button, Card, Dialog, IconButton } from "../../../shared/ui";
import { attivitaI18n as t } from "../i18n";
import { FilterControls, FilterHeader, QuickRanges } from "./FilterBarParts";

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

function countActiveFilters(p: AttivitaFilterBarProps): number {
  let n = 0;
  if (p.from) n += 1;
  if (p.to) n += 1;
  if (p.aziendaId) n += 1;
  if (p.tipoId) n += 1;
  if (p.vetUid) n += 1;
  return n;
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


import { Switch } from "../../../../shared/ui";
import { formatEuro } from "../../../../shared/lib/format";
import { contiI18n as t } from "../../i18n";
import type { ContiCounters } from "../../lib/groupContiByAzienda";

interface ContiToolbarProps {
  onlyUnsaldati: boolean;
  onToggle: (next: boolean) => void;
  counters: ContiCounters;
}

export function ContiToolbar({
  onlyUnsaldati,
  onToggle,
  counters,
}: ContiToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Switch
        checked={onlyUnsaldati}
        onChange={onToggle}
        label={t.mostraSoloNonSaldati}
      />
      {counters.total > 0 ? (
        <span
          aria-live="polite"
          className="text-xs text-(--color-text-muted) tabular-nums"
        >
          {t.counterPending(counters.pending, counters.total)}
        </span>
      ) : null}
      {counters.totaleUnsaldati > 0 ? (
        <span className="ml-auto flex items-baseline gap-1.5 text-sm tabular-nums">
          <span className="text-(--color-text-muted)">
            {t.totaleDaRiscuotere}
          </span>
          <span className="font-medium text-(--color-text)">
            {formatEuro(counters.totaleUnsaldati)}
          </span>
        </span>
      ) : null}
    </div>
  );
}

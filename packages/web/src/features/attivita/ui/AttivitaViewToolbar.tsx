import { Download } from "lucide-react";
import { Select } from "../../../shared/ui";
import { attivitaI18n as t } from "../i18n";
import type { GroupKey } from "../lib/totals";

interface AttivitaViewToolbarProps {
  group: GroupKey;
  groupOptions: ReadonlyArray<{ value: string; label: string }>;
  canExport: boolean;
  onChange: (key: string, value: string) => void;
  onExport: () => void;
}

export function AttivitaViewToolbar({
  group,
  groupOptions,
  canExport,
  onChange,
  onExport,
}: AttivitaViewToolbarProps) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4 print:hidden">
      <div className="min-w-0 max-w-[16rem] sm:max-w-[18rem] flex-1">
        <Select
          id="raggruppa"
          label={t.raggruppa}
          value={group}
          options={groupOptions}
          onChange={(e) => onChange("group", e.target.value)}
        />
      </div>
      {canExport ? (
        <button
          type="button"
          onClick={onExport}
          aria-label={t.esporta}
          title={t.esporta}
          className="h-11 inline-flex items-center gap-2 px-4 rounded-xl border border-(--color-border) bg-(--color-surface) text-sm text-(--color-text-muted) hover:text-(--color-text) hover:border-(--color-border-strong) hover:bg-(--color-surface-muted) transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2 active:scale-[0.97] active:duration-(--motion-press)"
        >
          <Download size={16} strokeWidth={1.75} aria-hidden="true" />
          <span className="hidden sm:inline">{t.esporta}</span>
        </button>
      ) : null}
    </div>
  );
}

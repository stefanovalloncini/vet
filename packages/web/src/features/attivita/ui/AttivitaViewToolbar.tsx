import { Download } from "lucide-react";
import { Button, Select } from "../../../shared/ui";
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
      <div className="min-w-0 max-w-[14rem] sm:max-w-[18rem] flex-1">
        <Select
          id="raggruppa"
          label={t.raggruppa}
          value={group}
          options={groupOptions}
          onChange={(e) => onChange("group", e.target.value)}
        />
      </div>
      {canExport ? (
        <Button
          type="button"
          variant="secondary"
          onClick={onExport}
          aria-label={t.esporta}
          title={t.esporta}
          className="shrink-0"
          leadingIcon={<Download size={16} strokeWidth={1.75} aria-hidden="true" />}
        >
          <span className="hidden sm:inline">{t.esporta}</span>
        </Button>
      ) : null}
    </div>
  );
}

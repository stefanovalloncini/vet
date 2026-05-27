import { Trash2 } from "lucide-react";
import { Badge, Button } from "../../../shared/ui";
import type { AllowlistEntry } from "@vet/shared";
import { allowlistI18n as t } from "../i18n";

interface AllowlistEntryRowProps {
  entry: AllowlistEntry;
  roles: ReadonlyArray<{ id: string; name: string }>;
  canManage: boolean;
  busy: boolean;
  onRemove: (entry: AllowlistEntry) => void;
}

export function AllowlistEntryRow({
  entry,
  roles,
  canManage,
  busy,
  onRemove,
}: AllowlistEntryRowProps) {
  const roleLabel =
    roles.find((r) => r.id === entry.defaultRoleId)?.name ?? entry.defaultRoleId;
  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-2xl px-4 py-2.5 grid grid-cols-[1fr_auto] items-center gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm font-mono text-(--color-text) truncate">
          {entry.email}
        </p>
        {entry.notes ? (
          <p className="text-xs text-(--color-text-subtle) mt-0.5 truncate">
            {entry.notes}
          </p>
        ) : null}
      </div>
      <div className="hidden sm:block">
        <Badge tone="neutral">{roleLabel}</Badge>
      </div>
      <div className="hidden sm:block text-xs text-(--color-text-muted) tabular-nums truncate">
        {entry.invitedAt.toLocaleDateString("it-IT")}
        <span className="text-(--color-text-subtle)"> {t.invitedBy} </span>
        <span>{entry.invitedBy}</span>
      </div>
      <div className="flex items-center gap-1 justify-end">
        {canManage ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(entry)}
            disabled={busy}
            aria-label={t.elimina}
            leadingIcon={<Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />}
          >
            <span className="hidden md:inline">{t.elimina}</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

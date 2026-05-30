import { Trash2 } from "lucide-react";
import { Badge, Button } from "../../../shared/ui";
import { formatDate } from "../../../shared/lib/format";
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
    <div className="sm:col-span-2 lg:col-span-3 bg-(--color-surface) border border-(--color-border) rounded-xl sm:rounded-2xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto] md:items-center">
      <div className="min-w-0 basis-full md:basis-auto">
        <p className="text-sm font-mono text-(--color-text) break-all">
          {entry.email}
        </p>
        {entry.notes ? (
          <p className="text-xs text-(--color-text-subtle) mt-0.5 break-words line-clamp-2">
            {entry.notes}
          </p>
        ) : null}
      </div>
      <div className="min-w-0">
        <Badge tone="neutral">
          <span className="truncate max-w-[14ch]">{roleLabel}</span>
        </Badge>
      </div>
      <p className="min-w-0 hidden md:block text-xs text-(--color-text-muted) truncate">
        <span className="tabular-nums">
          {formatDate(entry.invitedAt)}
        </span>
        <span className="text-(--color-text-subtle)"> {t.invitedBy} </span>
        <span>{entry.invitedBy}</span>
      </p>
      <div className="ml-auto md:ml-0 flex items-center justify-end shrink-0">
        {canManage ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(entry)}
            disabled={busy}
            aria-label={`${t.elimina} ${entry.email}`}
            leadingIcon={<Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />}
          >
            <span className="hidden md:inline">{t.elimina}</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

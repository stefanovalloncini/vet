import { Button, Card } from "../../../shared/ui";
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
    <li>
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-base font-medium text-(--color-text) truncate">
              {entry.email}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 rounded-md bg-(--color-surface-muted) text-(--color-text-muted)">
                {roleLabel}
              </span>
              <span className="text-xs text-(--color-text-subtle)">
                {t.invitedAt} {entry.invitedAt.toLocaleDateString("it-IT")}{" "}
                {t.invitedBy} {entry.invitedBy}
              </span>
            </div>
            {entry.notes ? (
              <p className="text-xs text-(--color-text-muted) mt-2">{entry.notes}</p>
            ) : null}
          </div>
          {canManage ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(entry)}
              disabled={busy}
            >
              {t.elimina}
            </Button>
          ) : null}
        </div>
      </Card>
    </li>
  );
}

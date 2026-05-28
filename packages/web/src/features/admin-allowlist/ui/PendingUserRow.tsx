import { Check, X } from "lucide-react";
import { Badge, Button, Select } from "../../../shared/ui";
import type { User } from "@vet/shared";
import { allowlistI18n as t } from "../i18n";

interface PendingUserRowProps {
  user: User;
  roleOptions: ReadonlyArray<{ value: string; label: string }>;
  roleValue: string;
  busy: boolean;
  onRoleChange: (roleId: string) => void;
  onApprove: (user: User) => void;
  onReject: (user: User) => void;
}

export function PendingUserRow({
  user,
  roleOptions,
  roleValue,
  busy,
  onRoleChange,
  onApprove,
  onReject,
}: PendingUserRowProps) {
  return (
    <div className="sm:col-span-2 lg:col-span-3 bg-(--color-surface) border border-(--color-border) rounded-xl sm:rounded-2xl px-4 py-3 flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,14rem)_auto] md:gap-4 md:items-end">
      <div className="min-w-0 md:pb-1.5">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <p className="text-sm font-mono text-(--color-text) break-all min-w-0">
            {user.email}
          </p>
          <Badge tone="warning">{t.statoInAttesa}</Badge>
        </div>
        <p className="text-xs text-(--color-text-muted) mt-0.5 truncate">
          {user.displayName}
          <span className="text-(--color-text-subtle)">
            {" · "}
            {t.pendingSignedUpAt}{" "}
          </span>
          <span className="tabular-nums">
            {user.createdAt.toLocaleDateString("it-IT")}
          </span>
        </p>
      </div>
      <Select
        id={`role-${user.uid}`}
        label={t.pendingRuolo}
        value={roleValue}
        onChange={(e) => onRoleChange(e.target.value)}
        options={roleOptions}
        disabled={busy}
      />
      <div className="flex items-center gap-1 justify-end shrink-0 md:pb-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onApprove(user)}
          disabled={busy}
          aria-label={`${t.pendingApprova} ${user.email}`}
          leadingIcon={<Check size={14} strokeWidth={1.75} aria-hidden="true" />}
        >
          <span className="hidden md:inline">{t.pendingApprova}</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onReject(user)}
          disabled={busy}
          aria-label={`${t.pendingRifiuta} ${user.email}`}
          leadingIcon={<X size={14} strokeWidth={1.75} aria-hidden="true" />}
        >
          <span className="hidden md:inline">{t.pendingRifiuta}</span>
        </Button>
      </div>
    </div>
  );
}

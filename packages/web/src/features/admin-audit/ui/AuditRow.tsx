import type { AuditEvent } from "@vet/shared";
import { ACTION_LABELS, auditI18n as t } from "../i18n";

const TIME_FMT = new Intl.DateTimeFormat("it-IT", {
  hour: "2-digit",
  minute: "2-digit",
});

export function AuditRow({ event }: { event: AuditEvent }) {
  const actor = event.actorEmail || event.actorUid || "—";
  return (
    <div className="sm:col-span-2 lg:col-span-3 bg-(--color-surface) border border-(--color-border) rounded-xl sm:rounded-2xl px-4 py-3">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 sm:grid-cols-[5ch_minmax(0,2fr)_minmax(0,1fr)]">
        <span className="text-xs text-(--color-text-muted) font-mono tabular-nums shrink-0 pt-0.5">
          {TIME_FMT.format(event.at)}
        </span>
        <div className="min-w-0">
          <p className="text-sm text-(--color-text) leading-snug">
            {ACTION_LABELS[event.action] ?? event.action}
          </p>
          <p className="text-[11px] text-(--color-text-subtle) mt-0.5 font-mono break-all">
            {event.targetType}/{event.targetId}
          </p>
          <p className="sm:hidden text-[11px] text-(--color-text-muted) font-mono truncate mt-0.5">
            {actor}
          </p>
        </div>
        <p className="hidden sm:block min-w-0 text-xs text-(--color-text-muted) font-mono truncate sm:text-right">
          {actor}
        </p>
        {event.details ? (
          <details className="col-start-2 sm:col-span-2 mt-1">
            <summary className="inline-flex text-[11px] text-(--color-text-subtle) cursor-pointer rounded-sm hover:text-(--color-text-muted) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-1">
              {t.dettagli}
            </summary>
            <pre className="text-[11px] text-(--color-text-subtle) mt-2 overflow-x-auto whitespace-pre-wrap break-words bg-(--color-surface-muted) rounded-md p-2 font-mono">
              {JSON.stringify(event.details, null, 2)}
            </pre>
          </details>
        ) : null}
      </div>
    </div>
  );
}

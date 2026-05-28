import { Link } from "react-router-dom";
import { ChevronRight, Star } from "lucide-react";
import { Badge } from "../../../shared/ui";
import { aziendeI18n as t } from "../i18n";
import { routes } from "../../../routes";
import type { Azienda, CadenzaFatturazione } from "@vet/shared";
import type { RowAction } from "../../../shared/ui/data-grid";
import { statoFor, type StatoKey, type StatoMeta } from "../../pagamenti";

const CADENZA_LABEL: Record<CadenzaFatturazione, string> = {
  monthly: t.campoCadenzaMensile,
  quarterly: t.campoCadenzaTrimestrale,
  semiannual: t.campoCadenzaSemestrale,
};

export type StatusTone = StatoMeta["tone"];
export type StatusKey = StatoKey;

export interface Status {
  tone: StatusTone;
  label: string;
  key: StatusKey;
}

const CARD_LABEL: Record<StatoKey, string> = {
  unpaid: "Conti non saldati",
  todo: "Da emettere",
  ok: "Tutto saldato",
};

export function statusFor(
  hasUnsaldatiConti: boolean,
  needsNewConto: boolean
): Status {
  const meta = statoFor({ hasUnpaid: hasUnsaldatiConti, needsNewConto });
  return { tone: meta.tone, label: CARD_LABEL[meta.key], key: meta.key };
}

export interface AziendaCardProps {
  azienda: Azienda;
  canEdit: boolean;
  pinned: boolean;
  onTogglePin: () => void;
  hasUnsaldatiConti: boolean;
  needsNewConto: boolean;
  actions?: ReadonlyArray<RowAction<Azienda>>;
}

export function AziendaCard({
  azienda: a,
  canEdit,
  pinned,
  hasUnsaldatiConti,
  needsNewConto,
  actions,
}: AziendaCardProps) {
  const status = statusFor(hasUnsaldatiConti, needsNewConto);
  const tipo = a.tipoAllevamento
    ? a.tipoAllevamento.charAt(0).toUpperCase() + a.tipoAllevamento.slice(1)
    : null;
  const capi = a.numeroCapi !== undefined ? `${a.numeroCapi} capi` : null;
  const meta = [tipo, capi].filter((x): x is string => Boolean(x));

  const inner = (
    <article
      className={[
        "group h-full bg-(--color-surface) border border-(--color-border) rounded-2xl",
        "p-4 sm:p-5 flex flex-col gap-3",
        "transition-[border-color,background-color] duration-(--motion-fast) ease-(--ease-out-quart)",
        canEdit
          ? "hover:border-(--color-border-strong) hover:bg-(--color-surface-muted)/40 cursor-pointer"
          : "",
      ].join(" ")}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 flex items-start gap-2.5">
          <span
            aria-label={status.label}
            title={status.label}
            className="mt-2"
          >
            <Badge dot tone={status.tone} aria-label={status.label} />
          </span>
          <h2 className="text-base sm:text-lg font-medium text-(--color-text) leading-snug break-words">
            {a.nome}
          </h2>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {actions?.map((action) => {
            const disabled = action.disabled ? action.disabled(a) : false;
            const isPinAction = action.id === "pin";
            const label = isPinAction
              ? pinned
                ? "Rimuovi dai preferiti"
                : "Aggiungi ai preferiti"
              : action.label;
            const pinTinted = isPinAction && pinned;
            return (
              <button
                key={action.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!disabled) action.onClick(a);
                }}
                aria-label={label}
                title={label}
                disabled={disabled}
                className={[
                  "p-1.5 rounded-md transition-colors duration-(--motion-fast)",
                  pinTinted
                    ? "text-(--color-accent)"
                    : "text-(--color-text-subtle) hover:text-(--color-text-muted)",
                  disabled ? "opacity-50 cursor-not-allowed" : "",
                ].join(" ")}
              >
                {isPinAction ? (
                  <Star
                    size={16}
                    strokeWidth={1.75}
                    fill={pinned ? "currentColor" : "none"}
                    aria-hidden="true"
                  />
                ) : (
                  action.icon
                )}
              </button>
            );
          })}
          {canEdit ? (
            <ChevronRight
              size={16}
              strokeWidth={1.75}
              className="text-(--color-text-subtle) group-hover:text-(--color-text-muted)"
              aria-hidden="true"
            />
          ) : null}
        </div>
      </header>

      {a.indirizzo ? (
        <p className="text-xs text-(--color-text-subtle) leading-relaxed line-clamp-2">
          {a.indirizzo}
        </p>
      ) : null}

      {meta.length > 0 ? (
        <p className="text-xs text-(--color-text-muted) tabular-nums">
          {meta.join(" · ")}
        </p>
      ) : null}

      <footer className="mt-auto flex items-center justify-between gap-2 pt-1">
        {a.cadenzaFatturazione ? (
          <Badge tone="neutral" size="sm">
            {CADENZA_LABEL[a.cadenzaFatturazione]}
          </Badge>
        ) : (
          <span className="text-[11px] text-(--color-text-subtle)">
            Cadenza non impostata
          </span>
        )}
        {a.telefono ? (
          <span className="text-[11px] text-(--color-text-muted) tabular-nums truncate">
            {a.telefono}
          </span>
        ) : null}
      </footer>
    </article>
  );

  return canEdit ? (
    <Link to={routes.aziendaDetail.to({ id: a.id })} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}

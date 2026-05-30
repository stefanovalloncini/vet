import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Badge } from "../../../shared/ui";
import { aziendeI18n as t } from "../i18n";
import { routes } from "../../../routes";
import type { Azienda, CadenzaFatturazione } from "@vet/shared";
import type { RowAction } from "../../../shared/ui/data-grid";
import { statusFor } from "../lib/cardStatus";

const CADENZA_LABEL: Record<CadenzaFatturazione, string> = {
  monthly: t.campoCadenzaMensile,
  quarterly: t.campoCadenzaTrimestrale,
  semiannual: t.campoCadenzaSemestrale,
};

const capiFormatter = new Intl.NumberFormat("it-IT", {
  maximumFractionDigits: 0,
});

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
  const capi =
    a.numeroCapi !== undefined
      ? `${capiFormatter.format(a.numeroCapi)} capi`
      : null;
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
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 flex items-start gap-2.5">
          <span
            role="img"
            aria-label={status.label}
            title={status.label}
            className="flex h-6 shrink-0 items-center"
          >
            <Badge dot tone={status.tone} />
          </span>
          <h2 className="text-base sm:text-lg font-medium text-(--color-text) leading-snug break-words">
            {a.nome}
          </h2>
        </div>
        <div className="-mt-1 -mr-1.5 flex flex-shrink-0 items-center">
          {actions?.map((action) => (
            <CardActionButton
              key={action.id}
              azienda={a}
              action={action}
              pinned={pinned}
            />
          ))}
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
        <span className="min-w-0 shrink-0">
          {a.cadenzaFatturazione ? (
            <Badge tone="neutral" size="sm">
              {CADENZA_LABEL[a.cadenzaFatturazione]}
            </Badge>
          ) : (
            <span className="text-[11px] text-(--color-text-subtle)">
              Cadenza non impostata
            </span>
          )}
        </span>
        {a.telefono ? (
          <span className="min-w-0 truncate text-[11px] text-(--color-text-muted) tabular-nums">
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

interface CardActionButtonProps {
  azienda: Azienda;
  action: RowAction<Azienda>;
  pinned: boolean;
}

function CardActionButton({ azienda: a, action, pinned }: CardActionButtonProps) {
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
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) action.onClick(a);
      }}
      aria-label={label}
      aria-pressed={isPinAction ? pinned : undefined}
      title={label}
      disabled={disabled}
      className={[
        "inline-flex h-11 w-11 items-center justify-center rounded-lg transition-colors duration-(--motion-fast)",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2",
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
}

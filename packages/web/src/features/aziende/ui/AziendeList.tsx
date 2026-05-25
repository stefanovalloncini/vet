import { Link } from "react-router-dom";
import { Star, ChevronRight } from "lucide-react";
import { Badge, DataLoader, EmptyState } from "../../../shared/ui";
import { aziendeI18n as t } from "../i18n";
import type { Azienda, CadenzaFatturazione } from "@vet/shared";

interface AziendeListProps {
  items: ReadonlyArray<Azienda>;
  loading: boolean;
  error: string | null;
  canEdit: boolean;
  canCreate: boolean;
  searching: boolean;
  isPinned: (id: string) => boolean;
  onTogglePin: (id: string) => void;
  hasUnsaldatiContiBy?: ReadonlySet<string>;
  needsNewContoBy?: ReadonlySet<string>;
}

const CADENZA_LABEL: Record<CadenzaFatturazione, string> = {
  monthly: t.campoCadenzaMensile,
  quarterly: t.campoCadenzaTrimestrale,
  semiannual: t.campoCadenzaSemestrale,
};

type StatusTone = "success" | "warning" | "danger";

interface Status {
  tone: StatusTone;
  label: string;
}

function statusFor(hasUnsaldatiConti: boolean, needsNewConto: boolean): Status {
  if (hasUnsaldatiConti) return { tone: "danger", label: "Conti non saldati" };
  if (needsNewConto) return { tone: "warning", label: "Da emettere" };
  return { tone: "success", label: "Tutto saldato" };
}

export function AziendeList({
  items,
  loading,
  error,
  canEdit,
  canCreate,
  searching,
  isPinned,
  onTogglePin,
  hasUnsaldatiContiBy,
  needsNewContoBy,
}: AziendeListProps) {
  return (
    <DataLoader
      loading={loading}
      error={error}
      empty={items.length === 0}
      emptyState={renderEmpty(searching, canCreate)}
    >
      <ul className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((a) => (
          <li key={a.id}>
            <AziendaCard
              azienda={a}
              canEdit={canEdit}
              pinned={isPinned(a.id)}
              onTogglePin={() => onTogglePin(a.id)}
              hasUnsaldatiConti={hasUnsaldatiContiBy?.has(a.id) ?? false}
              needsNewConto={needsNewContoBy?.has(a.id) ?? false}
            />
          </li>
        ))}
      </ul>
    </DataLoader>
  );
}

interface AziendaCardProps {
  azienda: Azienda;
  canEdit: boolean;
  pinned: boolean;
  onTogglePin: () => void;
  hasUnsaldatiConti: boolean;
  needsNewConto: boolean;
}

function AziendaCard({
  azienda: a,
  canEdit,
  pinned,
  onTogglePin,
  hasUnsaldatiConti,
  needsNewConto,
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
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTogglePin();
            }}
            aria-label={pinned ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
            className={[
              "p-1.5 rounded-md transition-colors duration-(--motion-fast)",
              pinned
                ? "text-(--color-accent)"
                : "text-(--color-text-subtle) hover:text-(--color-text-muted)",
            ].join(" ")}
          >
            <Star
              size={16}
              strokeWidth={1.75}
              fill={pinned ? "currentColor" : "none"}
              aria-hidden="true"
            />
          </button>
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
    <Link to={`/aziende/${a.id}`} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function renderEmpty(searching: boolean, canCreate: boolean) {
  if (searching) return <EmptyState title={t.emptySearch} />;
  if (!canCreate) return <EmptyState title={t.empty} />;
  return (
    <EmptyState
      title={t.empty}
      action={
        <Link
          to="/aziende/nuova"
          className="text-sm text-(--color-accent) hover:underline"
        >
          {t.nuovaAzienda}
        </Link>
      }
    />
  );
}

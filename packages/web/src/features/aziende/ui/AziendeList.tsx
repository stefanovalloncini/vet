import { Link } from "react-router-dom";
import { Star, ChevronRight } from "lucide-react";
import { DataLoader, EmptyState } from "../../../shared/ui";
import { aziendeI18n as t } from "../i18n";
import type { Azienda } from "@vet/shared";

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
}

const CADENZA_LABEL = {
  monthly: t.campoCadenzaMensile,
  quarterly: t.campoCadenzaTrimestrale,
  semiannual: t.campoCadenzaSemestrale,
} as const;

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
}: AziendeListProps) {
  return (
    <DataLoader
      loading={loading}
      error={error}
      empty={items.length === 0}
      emptyState={renderEmpty(searching, canCreate)}
    >
      <ul className="bg-(--color-surface) border border-(--color-border) rounded-2xl overflow-hidden divide-y divide-(--color-border)">
        {items.map((a) => (
          <li key={a.id}>
            <AziendaRow
              azienda={a}
              canEdit={canEdit}
              pinned={isPinned(a.id)}
              onTogglePin={() => onTogglePin(a.id)}
              hasUnsaldatiConti={hasUnsaldatiContiBy?.has(a.id) ?? false}
            />
          </li>
        ))}
      </ul>
    </DataLoader>
  );
}

interface AziendaRowProps {
  azienda: Azienda;
  canEdit: boolean;
  pinned: boolean;
  onTogglePin: () => void;
  hasUnsaldatiConti: boolean;
}

function AziendaRow({
  azienda: a,
  canEdit,
  pinned,
  onTogglePin,
  hasUnsaldatiConti,
}: AziendaRowProps) {
  const tipo = a.tipoAllevamento
    ? a.tipoAllevamento.charAt(0).toUpperCase() + a.tipoAllevamento.slice(1)
    : null;
  const meta = [
    tipo,
    a.numeroCapi !== undefined ? `${a.numeroCapi} capi` : null,
    a.cadenzaFatturazione ? CADENZA_LABEL[a.cadenzaFatturazione] : null,
    a.telefono ?? null,
  ].filter(Boolean) as string[];
  const inner = (
    <div className="flex items-start justify-between gap-4 px-4 py-3 min-h-[56px] hover:bg-(--color-surface-muted) transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            title={hasUnsaldatiConti ? "Ci sono conti non saldati" : "Tutti i conti saldati"}
            className={[
              "w-2 h-2 rounded-full flex-shrink-0",
              hasUnsaldatiConti
                ? "bg-(--color-danger)"
                : "bg-(--color-success)",
            ].join(" ")}
          />
          <h2 className="text-base font-medium text-(--color-text) truncate">{a.nome}</h2>
        </div>
        {a.indirizzo ? (
          <p className="text-xs text-(--color-text-subtle) mt-0.5 truncate">{a.indirizzo}</p>
        ) : null}
        {meta.length > 0 ? (
          <p className="text-xs text-(--color-text-muted) mt-1 truncate">{meta.join(" · ")}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 self-center">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTogglePin();
          }}
          aria-label={pinned ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
          className={[
            "p-2 rounded-md hover:bg-(--color-surface)",
            pinned ? "text-(--color-accent)" : "text-(--color-text-subtle)",
          ].join(" ")}
        >
          <Star size={16} strokeWidth={1.75} fill={pinned ? "currentColor" : "none"} aria-hidden="true" />
        </button>
        {canEdit ? (
          <ChevronRight size={16} strokeWidth={1.75} className="text-(--color-text-subtle)" aria-hidden="true" />
        ) : null}
      </div>
    </div>
  );
  return canEdit ? (
    <Link to={`/aziende/${a.id}`} className="block">
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
        <Link to="/aziende/nuova" className="text-sm text-(--color-accent) hover:underline">
          {t.nuovaAzienda}
        </Link>
      }
    />
  );
}

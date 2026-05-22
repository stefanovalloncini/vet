import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Star, ChevronRight } from "lucide-react";
import {
  AppShell,
  BoxedList,
  Button,
  DataLoader,
  EmptyState,
  PageHeader,
  TextField,
} from "../../../shared/ui";
import { useAuthState } from "../../auth";
import { useAziende } from "../hooks/useAziende";
import { usePinned } from "../hooks/usePinned";
import { aziendeI18n as t } from "../i18n";
import { normalizeAziendaNome, type Azienda } from "@vet/shared";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const CADENZA_LABEL = {
  monthly: t.campoCadenzaMensile,
  quarterly: t.campoCadenzaTrimestrale,
  semiannual: t.campoCadenzaSemestrale,
} as const;

export function AziendeListPage() {
  const { user } = useAuthState();
  const { aziende, loading, error } = useAziende();
  const { pinned, toggle: togglePin, isPinned } = usePinned();
  const [search, setSearch] = useState("");

  const canCreate = user?.caps.has("aziende.create") ?? false;
  const canUpdate = user?.caps.has("aziende.update") ?? false;

  const filtered = useMemo(() => {
    const base = search.trim()
      ? aziende.filter((a) => a.nomeNorm.includes(normalizeAziendaNome(search)))
      : aziende;
    return [...base].sort((a, b) => {
      const ap = pinned.has(a.id) ? 0 : 1;
      const bp = pinned.has(b.id) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return a.nomeNorm.localeCompare(b.nomeNorm, "it");
    });
  }, [aziende, search, pinned]);

  return (
    <AppShell>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          canCreate ? (
            <>
              <Link
                to="/aziende/importa"
                className="text-sm text-(--color-text-muted) hover:text-(--color-text)"
              >
                Importa CSV
              </Link>
              <Link to="/aziende/nuova">
                <Button type="button" variant="primary">
                  {t.nuovaAzienda}
                </Button>
              </Link>
            </>
          ) : null
        }
      />

      <div className="mb-6 max-w-md">
        <TextField
          id="cerca-aziende"
          label="Cerca"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.cercaPlaceholder}
        />
      </div>

      <DataLoader
        loading={loading}
        error={error ? t.erroreSalvataggio : null}
        empty={filtered.length === 0}
        emptyState={renderEmpty(search.trim().length > 0, canCreate)}
      >
        <BoxedList>
          {filtered.map((a) => (
            <li key={a.id}>
              <AziendaRow
                azienda={a}
                canEdit={canUpdate}
                pinned={isPinned(a.id)}
                onTogglePin={() => togglePin(a.id)}
              />
            </li>
          ))}
        </BoxedList>
      </DataLoader>
    </AppShell>
  );
}

function AziendaRow({
  azienda: a,
  canEdit,
  pinned,
  onTogglePin,
}: {
  azienda: Azienda;
  canEdit: boolean;
  pinned: boolean;
  onTogglePin: () => void;
}) {
  const meta = [
    a.tipoAllevamento ? capitalize(a.tipoAllevamento) : null,
    a.numeroCapi !== undefined ? `${a.numeroCapi} capi` : null,
    a.cadenzaFatturazione ? CADENZA_LABEL[a.cadenzaFatturazione] : null,
    a.telefono ?? null,
  ].filter(Boolean) as string[];

  const inner = (
    <div className="flex items-start justify-between gap-4 px-4 py-3 min-h-[56px] hover:bg-(--color-surface-muted) transition-colors">
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-medium text-(--color-text) truncate">
          {a.nome}
        </h2>
        {a.indirizzo ? (
          <p className="text-xs text-(--color-text-subtle) mt-0.5 truncate">
            {a.indirizzo}
          </p>
        ) : null}
        {meta.length > 0 ? (
          <p className="text-xs text-(--color-text-muted) mt-1 truncate">
            {meta.join(" · ")}
          </p>
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
            className="text-(--color-text-subtle)"
            aria-hidden="true"
          />
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

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Star, ChevronRight, Building2 } from "lucide-react";
import {
  AppShell,
  Button,
  Card,
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
          label={t.cercaPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.cercaPlaceholder}
        />
      </div>

      <DataLoader
        loading={loading}
        error={error ? t.erroreSalvataggio : null}
        empty={filtered.length === 0}
        emptyState={
          <EmptyState
            title={search.trim() ? t.emptySearch : t.empty}
            icon={<Building2 size={32} strokeWidth={1.5} />}
          />
        }
      >
        <ul className="space-y-3">
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
        </ul>
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
  const chips = [
    a.tipoAllevamento ? capitalize(a.tipoAllevamento) : null,
    a.numeroCapi !== undefined ? `${a.numeroCapi} capi` : null,
    a.telefono ?? null,
    a.piva ? `P.IVA ${a.piva}` : null,
    a.cadenzaFatturazione ? CADENZA_LABEL[a.cadenzaFatturazione] : null,
    a.emailFatturazione ?? null,
  ].filter(Boolean) as string[];

  const inner = (
    <Card className="hover:border-(--color-border-strong) transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-medium text-(--color-text) truncate">
            {a.nome}
          </h2>
          {a.indirizzo ? (
            <p className="text-sm text-(--color-text-muted) mt-1 truncate">
              {a.indirizzo}
            </p>
          ) : null}
          {chips.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-3">
              {chips.map((c) => (
                <span
                  key={c}
                  className="px-2 py-0.5 rounded-md text-xs bg-(--color-surface-muted) text-(--color-text-muted)"
                >
                  {c}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTogglePin();
            }}
            aria-label={pinned ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
            className={[
              "p-1 rounded-md hover:bg-(--color-surface-muted)",
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
    </Card>
  );

  return canEdit ? (
    <Link to={`/aziende/${a.id}`} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

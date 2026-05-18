import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AppShell,
  Button,
  Card,
  TextField,
} from "../../../shared/ui";
import { useAuthState } from "../../auth";
import { useAziende } from "../hooks/useAziende";
import { aziendeI18n as t } from "../i18n";
import { normalizeAziendaNome, type Azienda } from "@vet/shared";

const CADENZA_LABEL = {
  monthly: t.campoCadenzaMensile,
  quarterly: t.campoCadenzaTrimestrale,
  semiannual: t.campoCadenzaSemestrale,
} as const;

export function AziendeListPage() {
  const { user } = useAuthState();
  const { aziende, loading, error } = useAziende();
  const [search, setSearch] = useState("");

  const canCreate = user?.caps.has("aziende.create") ?? false;
  const canUpdate = user?.caps.has("aziende.update") ?? false;

  const filtered = useMemo(() => {
    if (!search.trim()) return aziende;
    const needle = normalizeAziendaNome(search);
    return aziende.filter((a) => a.nomeNorm.includes(needle));
  }, [aziende, search]);

  return (
    <AppShell>
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-(--color-text)">
            {t.title}
          </h1>
          <p className="text-(--color-text-muted) mt-2 text-sm">
            {t.subtitle}
          </p>
        </div>
        {canCreate ? (
          <Link to="/aziende/nuova">
            <Button type="button" variant="primary">
              {t.nuovaAzienda}
            </Button>
          </Link>
        ) : null}
      </header>

      <div className="mb-6 max-w-md">
        <TextField
          id="cerca-aziende"
          label={t.cercaPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.cercaPlaceholder}
        />
      </div>

      {loading ? (
        <p className="text-sm text-(--color-text-muted)">{t.loading}</p>
      ) : error ? (
        <p className="text-sm text-(--color-danger)">{t.erroreSalvataggio}</p>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-(--color-text-muted) text-center py-4">
            {search.trim() ? t.emptySearch : t.empty}
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((a) => (
            <li key={a.id}>
              <AziendaRow azienda={a} canEdit={canUpdate} />
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}

function AziendaRow({
  azienda: a,
  canEdit,
}: {
  azienda: Azienda;
  canEdit: boolean;
}) {
  const chips = [
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
        {canEdit ? (
          <span className="text-xs text-(--color-text-subtle) flex-shrink-0 mt-1">
            →
          </span>
        ) : null}
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

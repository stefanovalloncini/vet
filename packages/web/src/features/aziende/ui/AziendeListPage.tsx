import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell, Button, PageHeader, TextField } from "../../../shared/ui";
import { useAuthState } from "../../auth";
import { useAziende } from "../hooks/useAziende";
import { usePinned } from "../hooks/usePinned";
import { aziendeI18n as t } from "../i18n";
import { normalizeAziendaNome } from "@vet/shared";
import { AziendeList } from "./AziendeList";

export function AziendeListPage() {
  const { user } = useAuthState();
  const { data: aziende = [], isLoading, isError } = useAziende();
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

      <AziendeList
        items={filtered}
        loading={isLoading}
        error={isError ? t.erroreSalvataggio : null}
        canEdit={canUpdate}
        canCreate={canCreate}
        searching={search.trim().length > 0}
        isPinned={isPinned}
        onTogglePin={togglePin}
      />
    </AppShell>
  );
}

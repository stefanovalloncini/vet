import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell, Button, PageHeader } from "../../../shared/ui";
import type { FilterDef } from "../../../shared/ui/data-grid";
import { useAuthState } from "../../auth";
import { useAziende } from "../hooks/useAziende";
import { usePinned } from "../hooks/usePinned";
import { aziendeI18n as t } from "../i18n";
import { AziendeList } from "./AziendeList";
import { usePagamentiOverview } from "../../pagamenti";

const STATO_OPTIONS = [
  { value: "", label: "Tutti" },
  { value: "unpaid", label: "Conti non saldati" },
  { value: "todo", label: "Da emettere" },
  { value: "ok", label: "Tutto saldato" },
] as const;

export function AziendeListPage() {
  const { user } = useAuthState();
  const { data: aziende = [], isLoading, isError } = useAziende();
  const { pinned, toggle: togglePin, isPinned } = usePinned();
  const [search, setSearch] = useState("");
  const [statoFilter, setStatoFilter] = useState<string>("");
  const now = useMemo(() => new Date(), []);
  const overview = usePagamentiOverview(now);
  const { hasUnsaldatiContiBy, needsNewContoBy, totaleApertoBy } = useMemo(() => {
    const unpaid = new Set<string>();
    const needs = new Set<string>();
    const aperto = new Map<string, number>();
    for (const row of overview.rows) {
      if (row.hasUnpaid) unpaid.add(row.azienda.id);
      if (row.needsNewConto) needs.add(row.azienda.id);
      if (row.totaleAperto > 0) aperto.set(row.azienda.id, row.totaleAperto);
    }
    return {
      hasUnsaldatiContiBy: unpaid,
      needsNewContoBy: needs,
      totaleApertoBy: aperto,
    };
  }, [overview.rows]);

  const canCreate = user?.caps.has("aziende.create") ?? false;
  const canUpdate = user?.caps.has("aziende.update") ?? false;

  const sorted = useMemo(
    () =>
      [...aziende].sort((a, b) => {
        const ap = pinned.has(a.id) ? 0 : 1;
        const bp = pinned.has(b.id) ? 0 : 1;
        if (ap !== bp) return ap - bp;
        return a.nomeNorm.localeCompare(b.nomeNorm, "it");
      }),
    [aziende, pinned]
  );

  const filters = useMemo<ReadonlyArray<FilterDef>>(
    () => [
      {
        id: "search",
        label: "Cerca",
        kind: "text",
        value: search,
      },
      {
        id: "stato",
        label: "Stato",
        kind: "select",
        value: statoFilter,
        options: STATO_OPTIONS,
      },
    ],
    [search, statoFilter]
  );

  const handleFiltersChange = (next: ReadonlyArray<FilterDef>) => {
    const nextSearch = next.find((f) => f.id === "search");
    const stato = next.find((f) => f.id === "stato");
    setSearch(typeof nextSearch?.value === "string" ? nextSearch.value : "");
    setStatoFilter(typeof stato?.value === "string" ? stato.value : "");
  };

  return (
    <AppShell wide>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          canCreate ? (
            <Link to="/aziende/nuova">
              <Button type="button" variant="primary">
                {t.nuovaAzienda}
              </Button>
            </Link>
          ) : null
        }
      />

      <AziendeList
        items={sorted}
        loading={isLoading}
        error={isError ? t.erroreSalvataggio : null}
        canEdit={canUpdate}
        canCreate={canCreate}
        searching={search.trim().length > 0}
        isPinned={isPinned}
        onTogglePin={togglePin}
        hasUnsaldatiContiBy={hasUnsaldatiContiBy}
        needsNewContoBy={needsNewContoBy}
        totaleApertoBy={totaleApertoBy}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />
    </AppShell>
  );
}

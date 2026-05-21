import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppShell, Button, Tabs } from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { useReminders } from "../../reminders/hooks/useReminders";
import { useTags } from "../hooks/useTags";
import { useAziendaDetail } from "../hooks/useAziendaDetail";
import { AziendaInfoCard } from "./AziendaInfoCard";
import { PagamentiTab, PromemoriaTab, StoricoTab } from "./AziendaTabs";

type Tab = "storico" | "pagamenti" | "promemoria";

export function AziendaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthState();
  const { aziende, attivita, payments } = useRepositories();
  const [tab, setTab] = useState<Tab>("storico");
  const { reminders } = useReminders();
  const { tagsFor, setForAzienda } = useTags();

  const detail = useAziendaDetail({ id, aziende, attivita, payments });

  const reminderCount = useMemo(
    () => reminders.filter((r) => r.aziendaId === id && !r.done).length,
    [reminders, id]
  );

  const total = useMemo(
    () => detail.items.reduce((s, x) => s + x.totale, 0),
    [detail.items]
  );
  const paidTotal = useMemo(
    () => detail.payments.reduce((s, x) => s + (x.importoPagato ?? 0), 0),
    [detail.payments]
  );

  const canUpdate = user?.caps.has("aziende.update") ?? false;
  const canExport = user?.caps.has("activities.export") ?? false;

  if (detail.error) {
    return (
      <AppShell>
        <p role="alert" className="text-sm text-(--color-danger)">
          Errore caricamento azienda: {detail.error}
        </p>
      </AppShell>
    );
  }

  if (detail.loading || !detail.azienda) {
    return (
      <AppShell>
        <p className="text-sm text-(--color-text-muted)">Caricamento…</p>
      </AppShell>
    );
  }

  const azienda = detail.azienda;
  const tabs: ReadonlyArray<{ id: Tab; label: string; count?: number }> = [
    { id: "storico", label: "Storico", count: detail.items.length },
    { id: "pagamenti", label: "Pagamenti", count: detail.payments.length },
    { id: "promemoria", label: "Promemoria", count: reminderCount },
  ];

  return (
    <AppShell>
      <header className="mb-6">
        <button
          type="button"
          onClick={() => navigate("/aziende")}
          className="text-sm text-(--color-text-muted) hover:text-(--color-text) mb-3"
        >
          ← Aziende
        </button>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl text-(--color-text)">{azienda.nome}</h1>
            {azienda.indirizzo ? (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(azienda.indirizzo)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-(--color-text-muted) hover:text-(--color-accent) mt-1 inline-block"
              >
                {azienda.indirizzo} ↗
              </a>
            ) : null}
          </div>
          {canUpdate ? (
            <Link to={`/aziende/${azienda.id}/modifica`}>
              <Button type="button" variant="secondary">
                Modifica
              </Button>
            </Link>
          ) : null}
        </div>
      </header>

      <AziendaInfoCard
        azienda={azienda}
        total={total}
        paidTotal={paidTotal}
        tags={tagsFor(azienda.id)}
        onTagsChange={(next) => setForAzienda(azienda.id, next)}
        canExport={canExport}
      />

      <div className="mb-4">
        <Tabs
          items={tabs.map((tt) => ({
            value: tt.id,
            label: tt.label,
            ...(tt.count !== undefined ? { badge: tt.count } : {}),
          }))}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === "storico" ? (
        <StoricoTab items={detail.items} />
      ) : tab === "pagamenti" ? (
        <PagamentiTab payments={detail.payments} />
      ) : (
        <PromemoriaTab aziendaId={azienda.id} />
      )}
    </AppShell>
  );
}

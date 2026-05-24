import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell, Tabs } from "../../../shared/ui";
import { useAuthState } from "../../auth";
import { useReminders } from "../../reminders/hooks/useReminders";
import { useTags } from "../hooks/useTags";
import { useAziendaDetail } from "../hooks/useAziendaDetail";
import { AziendaDetailSummary } from "./AziendaDetailSummary";
import { AziendaInfoCard } from "./AziendaInfoCard";
import { PagamentiTab, PromemoriaTab, StoricoTab } from "./AziendaTabs";
import {
  ContiPerAziendaTab,
  EmettiContoPanel,
  useContiForAzienda,
} from "../../conti";

type Tab = "storico" | "conti" | "pagamenti" | "promemoria";

export function AziendaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthState();
  const [tab, setTab] = useState<Tab>("storico");
  const { reminders } = useReminders();
  const { tagsFor, setForAzienda } = useTags();

  const detail = useAziendaDetail(id);
  const contiQuery = useContiForAzienda(id);

  const reminderCount = useMemo(
    () => reminders.filter((r) => r.aziendaId === id && !r.done).length,
    [reminders, id]
  );
  const contiCount = contiQuery.data?.length ?? 0;
  const canViewConti = user?.caps.has("conti.proforma") ?? false;

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

  if (detail.isError) {
    return (
      <AppShell>
        <p role="alert" className="text-sm text-(--color-danger)">
          Errore caricamento azienda: {detail.error?.message ?? "errore"}
        </p>
      </AppShell>
    );
  }

  if (detail.isLoading || !detail.azienda) {
    return (
      <AppShell>
        <p className="text-sm text-(--color-text-muted)">Caricamento…</p>
      </AppShell>
    );
  }

  const azienda = detail.azienda;
  const baseTabs: ReadonlyArray<{ id: Tab; label: string; count?: number }> = [
    { id: "storico", label: "Storico", count: detail.items.length },
    ...(canViewConti
      ? [{ id: "conti" as const, label: "Conti", count: contiCount }]
      : []),
    { id: "pagamenti", label: "Pagamenti", count: detail.payments.length },
    { id: "promemoria", label: "Promemoria", count: reminderCount },
  ];

  return (
    <AppShell>
      <AziendaDetailSummary
        azienda={azienda}
        canEdit={canUpdate}
        onBack={() => navigate("/aziende")}
      />
      <AziendaInfoCard
        azienda={azienda}
        total={total}
        paidTotal={paidTotal}
        tags={tagsFor(azienda.id)}
        onTagsChange={(next) => setForAzienda(azienda.id, next)}
        canExport={canExport}
      />
      {canViewConti ? (
        <div className="mb-4">
          <EmettiContoPanel azienda={azienda} items={detail.items} />
        </div>
      ) : null}
      <div className="mb-4">
        <Tabs
          items={baseTabs.map((tt) => ({
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
      ) : tab === "conti" ? (
        <ContiPerAziendaTab aziendaId={azienda.id} />
      ) : tab === "pagamenti" ? (
        <PagamentiTab payments={detail.payments} />
      ) : (
        <PromemoriaTab aziendaId={azienda.id} />
      )}
    </AppShell>
  );
}

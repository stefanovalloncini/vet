import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Attivita, Conto } from "@vet/shared";
import { AppShell, ConfirmDialog, Tabs, useToast } from "../../../shared/ui";
import { useAuthState } from "../../auth";
import { useReminders } from "../../reminders/hooks/useReminders";
import { useTags } from "../hooks/useTags";
import { useAziendaDetail } from "../hooks/useAziendaDetail";
import { useDeleteAzienda } from "../hooks/useAziende";
import { AziendaDetailSummary } from "./AziendaDetailSummary";
import { AziendaInfoCard } from "./AziendaInfoCard";
import { PromemoriaTab, StoricoTab } from "./AziendaTabs";
import { aziendeI18n as t } from "../i18n";
import {
  ContiPerAziendaTab,
  EmettiContoPanel,
  useContiForAzienda,
} from "../../conti";

type Tab = "storico" | "conti" | "promemoria";

function parseInitialTab(raw: string | null): Tab {
  return raw === "conti" || raw === "promemoria" ? raw : "storico";
}

export function AziendaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthState();
  const { notify } = useToast();
  const initialTab: Tab = parseInitialTab(searchParams.get("tab"));
  const [tab, setTab] = useState<Tab>(initialTab);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const { reminders } = useReminders();
  const { tagsFor, setForAzienda } = useTags();

  const detail = useAziendaDetail(id);
  const contiQuery = useContiForAzienda(id);
  const del = useDeleteAzienda();

  const reminderCount = useMemo(
    () => reminders.filter((r) => r.aziendaId === id && !r.done).length,
    [reminders, id]
  );
  const contiCount = contiQuery.data?.length ?? 0;
  const canViewConti = user?.caps.has("conti.proforma") ?? false;

  const total = useMemo(
    () => detail.items.reduce((s: number, x: Attivita) => s + x.totale, 0),
    [detail.items]
  );
  const paidTotal = useMemo(
    () =>
      (contiQuery.data ?? [])
        .filter((c: Conto) => c.modalita === "emesso" && c.saldato)
        .reduce((s: number, c: Conto) => s + (c.importoSaldato ?? c.totaleConto), 0),
    [contiQuery.data]
  );

  const canUpdate = user?.caps.has("aziende.update") ?? false;
  const canExport = user?.caps.has("activities.export") ?? false;

  async function onConfirmArchive(): Promise<void> {
    if (!user || !id) return;
    try {
      await del.mutateAsync({ id, actor: user });
      notify("Azienda archiviata", "success");
      navigate("/aziende");
    } catch {
      // Error toast handled by global mutation handler (meta.errorMessage)
    } finally {
      setConfirmArchive(false);
    }
  }

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
    { id: "promemoria", label: "Promemoria", count: reminderCount },
  ];

  return (
    <AppShell>
      <AziendaDetailSummary
        azienda={azienda}
        canEdit={canUpdate}
        {...(canUpdate
          ? { onArchive: () => setConfirmArchive(true) }
          : {})}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="space-y-4 min-w-0">
          <div>
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
          <div className="min-w-0">
            {tab === "storico" ? (
              <StoricoTab items={detail.items} />
            ) : tab === "conti" ? (
              <ContiPerAziendaTab aziendaId={azienda.id} />
            ) : (
              <PromemoriaTab aziendaId={azienda.id} />
            )}
          </div>
        </div>
        <aside className="space-y-4 min-w-0">
          <AziendaInfoCard
            azienda={azienda}
            total={total}
            paidTotal={paidTotal}
            tags={tagsFor(azienda.id)}
            onTagsChange={(next) => setForAzienda(azienda.id, next)}
            canExport={canExport}
          />
          {canViewConti ? (
            <EmettiContoPanel azienda={azienda} items={detail.items} />
          ) : null}
        </aside>
      </div>
      <ConfirmDialog
        open={confirmArchive}
        title="Archiviare questa azienda?"
        message={t.confermaEliminazioneDescr}
        confirmLabel="Archivia"
        cancelLabel={t.annulla}
        variant="danger"
        busy={del.isPending}
        onConfirm={onConfirmArchive}
        onClose={() => {
          if (del.isPending) return;
          setConfirmArchive(false);
        }}
      />
    </AppShell>
  );
}

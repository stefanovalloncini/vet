import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AppShell,
  Button,
  Card,
} from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { useReminders } from "../../reminders/hooks/useReminders";
import { formatDate, formatEuro } from "../../attivita/lib/format";
import type { Attivita, Azienda, Payment } from "@vet/shared";

type Tab = "storico" | "pagamenti" | "promemoria";

export function AziendaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthState();
  const { aziende, attivita, payments } = useRepositories();
  const [tab, setTab] = useState<Tab>("storico");
  const [a, setA] = useState<Azienda | null>(null);
  const [items, setItems] = useState<Attivita[]>([]);
  const [pays, setPays] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { reminders } = useReminders();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      const [az, list, pa] = await Promise.all([
        aziende.getById(id),
        attivita.list({ aziendaId: id }),
        payments.listForAzienda(id),
      ]);
      if (cancelled) return;
      if (!az) {
        navigate("/aziende", { replace: true });
        return;
      }
      setA(az);
      setItems(list);
      setPays(pa);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, aziende, attivita, payments, navigate]);

  const reminderCount = useMemo(
    () => reminders.filter((r) => r.aziendaId === id && !r.done).length,
    [reminders, id]
  );

  const canUpdate = user?.caps.has("aziende.update") ?? false;
  const canExport = user?.caps.has("activities.export") ?? false;

  const total = useMemo(() => items.reduce((s, x) => s + x.totale, 0), [items]);
  const paidTotal = useMemo(
    () => pays.reduce((s, x) => s + (x.importoPagato ?? 0), 0),
    [pays]
  );

  if (loading || !a) {
    return (
      <AppShell>
        <p className="text-sm text-(--color-text-muted)">Caricamento…</p>
      </AppShell>
    );
  }

  const tabs: ReadonlyArray<{ id: Tab; label: string; count?: number }> = [
    { id: "storico", label: "Storico", count: items.length },
    { id: "pagamenti", label: "Pagamenti", count: pays.length },
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
            <h1 className="text-3xl text-(--color-text)">{a.nome}</h1>
            {a.indirizzo ? (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(a.indirizzo)}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-(--color-text-muted) hover:text-(--color-accent) mt-1 inline-block"
              >
                {a.indirizzo} ↗
              </a>
            ) : null}
          </div>
          {canUpdate ? (
            <Link to={`/aziende/${a.id}/modifica`}>
              <Button type="button" variant="secondary">Modifica</Button>
            </Link>
          ) : null}
        </div>
      </header>

      <Card className="mb-6">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          {a.tipoAllevamento ? (
            <div>
              <dt className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                Allevamento
              </dt>
              <dd className="text-(--color-text) mt-1 capitalize">
                {a.tipoAllevamento}
              </dd>
            </div>
          ) : null}
          {a.numeroCapi !== undefined ? (
            <div>
              <dt className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                Capi
              </dt>
              <dd className="text-(--color-text) mt-1 tabular-nums">
                {a.numeroCapi}
              </dd>
            </div>
          ) : null}
          {a.telefono ? (
            <div>
              <dt className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                Telefono
              </dt>
              <dd className="text-(--color-text) mt-1">
                <a href={`tel:${a.telefono}`} className="hover:underline">
                  {a.telefono}
                </a>
              </dd>
            </div>
          ) : null}
          {a.piva ? (
            <div>
              <dt className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                P.IVA
              </dt>
              <dd className="text-(--color-text) mt-1 font-mono text-xs">
                {a.piva}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs uppercase tracking-wider text-(--color-text-muted)">
              Totale storico
            </dt>
            <dd className="text-(--color-text) mt-1 font-medium tabular-nums">
              {formatEuro(total)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-(--color-text-muted)">
              Incassato
            </dt>
            <dd className="text-(--color-text) mt-1 font-medium tabular-nums">
              {formatEuro(paidTotal)}
            </dd>
          </div>
        </dl>
        {a.note ? (
          <p className="text-sm text-(--color-text-muted) mt-4 pt-4 border-t border-(--color-border)">
            {a.note}
          </p>
        ) : null}
        {canExport ? (
          <div className="mt-4 pt-4 border-t border-(--color-border)">
            <Link
              to={`/aziende/${a.id}/riepilogo`}
              className="text-sm text-(--color-accent) hover:underline"
            >
              Apri riepilogo stampabile →
            </Link>
          </div>
        ) : null}
      </Card>

      <div
        role="tablist"
        className="inline-flex rounded-xl bg-(--color-surface-muted) p-1 border border-(--color-border) mb-4"
      >
        {tabs.map((tt) => (
          <button
            key={tt.id}
            type="button"
            role="tab"
            aria-selected={tab === tt.id}
            onClick={() => setTab(tt.id)}
            className={[
              "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
              tab === tt.id
                ? "bg-(--color-surface) text-(--color-text) shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "text-(--color-text-muted) hover:text-(--color-text)",
            ].join(" ")}
          >
            {tt.label}
            {tt.count !== undefined ? (
              <span className="ml-2 text-xs text-(--color-text-subtle) tabular-nums">
                {tt.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "storico" ? (
        <StoricoTab items={items} />
      ) : tab === "pagamenti" ? (
        <PagamentiTab payments={pays} />
      ) : (
        <PromemoriaTab aziendaId={a.id} />
      )}
    </AppShell>
  );
}

function StoricoTab({ items }: { items: Attivita[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <p className="text-sm text-(--color-text-muted) text-center py-4">
          Nessuna attività ancora.
        </p>
      </Card>
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((a) => (
        <li key={a.id}>
          <Link to={`/attivita/${a.id}`} className="block">
            <Card className="hover:border-(--color-border-strong) transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-(--color-text-muted) tabular-nums">
                    {formatDate(a.data)}
                  </p>
                  <p className="text-base font-medium text-(--color-text) mt-1">
                    {a.tipoNome}
                  </p>
                  {a.note ? (
                    <p className="text-xs text-(--color-text-subtle) mt-1">
                      {a.note}
                    </p>
                  ) : null}
                </div>
                <span className="text-base font-medium text-(--color-text) tabular-nums">
                  {formatEuro(a.totale)}
                </span>
              </div>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PagamentiTab({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return (
      <Card>
        <p className="text-sm text-(--color-text-muted) text-center py-4">
          Nessun pagamento registrato.
        </p>
      </Card>
    );
  }
  return (
    <ul className="space-y-2">
      {payments.map((p) => (
        <li key={p.id}>
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base text-(--color-text)">
                  Pagato fino al {p.periodoFinoA.toLocaleDateString("it-IT")}
                </p>
                <p className="text-xs text-(--color-text-muted) mt-1">
                  {p.metodoPagamento ?? "metodo non indicato"}
                  {p.note ? ` · ${p.note}` : ""}
                </p>
              </div>
              {p.importoPagato !== undefined ? (
                <span className="text-base font-medium text-(--color-text) tabular-nums">
                  {formatEuro(p.importoPagato)}
                </span>
              ) : null}
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

function PromemoriaTab({ aziendaId }: { aziendaId: string }) {
  const { reminders } = useReminders();
  const filtered = reminders.filter((r) => r.aziendaId === aziendaId);
  if (filtered.length === 0) {
    return (
      <Card>
        <p className="text-sm text-(--color-text-muted) text-center py-4">
          Nessun promemoria attivo.
        </p>
      </Card>
    );
  }
  return (
    <ul className="space-y-2">
      {filtered.map((r) => (
        <li key={r.id}>
          <Card>
            <div className="flex items-baseline justify-between gap-3">
              <p
                className={[
                  "text-base",
                  r.done ? "text-(--color-text-muted) line-through" : "text-(--color-text)",
                ].join(" ")}
              >
                {r.titolo}
              </p>
              <span className="text-xs text-(--color-text-muted) tabular-nums">
                {r.dueAt.toLocaleDateString("it-IT")}
              </span>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

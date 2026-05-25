import { useMemo, useState } from "react";
import type { Conto, MetodoPagamento } from "@vet/shared";
import {
  AppShell,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  InlineError,
  LoadingHint,
  PageHeader,
  Select,
  TextField,
  useToast,
} from "../../../shared/ui";
import { useAuthState } from "../../auth";
import { formatDate, formatEuro } from "../../../shared/lib/format";
import { useConti, useSaldaConto } from "../hooks/useConti";
import { contiI18n as t } from "../i18n";

export function ContiPage() {
  const { user } = useAuthState();
  const query = useConti();
  const conti = query.data ?? [];
  const [onlyUnsaldati, setOnlyUnsaldati] = useState(true);
  const [saldando, setSaldando] = useState<Conto | null>(null);

  const canSaldare = user?.caps.has("conti.saldo") ?? false;

  const filtered = useMemo(() => {
    if (!onlyUnsaldati) return conti;
    return conti.filter((c) => c.modalita === "emesso" && !c.saldato);
  }, [conti, onlyUnsaldati]);

  return (
    <AppShell>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <label className="flex items-center gap-2 text-sm text-(--color-text-muted) mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={onlyUnsaldati}
          onChange={(e) => setOnlyUnsaldati(e.target.checked)}
          className="w-4 h-4 accent-(--color-accent)"
        />
        {t.mostraSoloNonSaldati}
      </label>

      {query.isPending ? (
        <LoadingHint label="Caricamento…" />
      ) : query.isError ? (
        <InlineError>{t.loadError}</InlineError>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={
            conti.length === 0 ? t.emptyAll : t.emptyFiltered
          }
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((c) => (
            <li key={c.id}>
              <ContoRow
                conto={c}
                canSaldare={canSaldare}
                onSaldare={() => setSaldando(c)}
              />
            </li>
          ))}
        </ul>
      )}

      {saldando ? (
        <SaldaContoDialog
          conto={saldando}
          onClose={() => setSaldando(null)}
        />
      ) : null}
    </AppShell>
  );
}

interface ContoRowProps {
  conto: Conto;
  canSaldare: boolean;
  onSaldare: () => void;
}

function ContoRow({ conto, canSaldare, onSaldare }: ContoRowProps) {
  const period = `${formatDate(conto.periodoFrom)} – ${formatDate(conto.periodoTo)}`;
  const isEmesso = conto.modalita === "emesso";
  const statusLabel = !isEmesso
    ? t.proforma
    : conto.saldato
      ? t.saldato
      : t.nonSaldato;
  const statusClass = !isEmesso
    ? "bg-(--color-surface-muted) text-(--color-text-muted)"
    : conto.saldato
      ? "bg-(--color-accent-soft) text-(--color-text)"
      : "bg-(--color-danger)/10 text-(--color-danger)";
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-medium text-(--color-text) truncate">
            {conto.aziendaNome}
          </h2>
          <p className="text-xs text-(--color-text-muted) mt-1">
            {t.periodoLabel}: {period}
          </p>
          <p className="text-[11px] text-(--color-text-subtle) mt-1">
            {t.emessoIl} {formatDate(conto.emittedAt)} · {conto.emittedByName}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span
            className={`px-2 py-0.5 rounded-md text-xs ${statusClass}`}
          >
            {statusLabel}
          </span>
          <span className="text-lg font-medium text-(--color-text) tabular-nums">
            {formatEuro(conto.totaleConto)}
          </span>
          {isEmesso && !conto.saldato && canSaldare ? (
            <Button type="button" variant="secondary" size="sm" onClick={onSaldare}>
              {t.segnaSaldato}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

interface SaldaContoDialogProps {
  conto: Conto;
  onClose: () => void;
}

const METODO_OPTIONS = [
  { value: "", label: t.metodoVuoto },
  { value: "bonifico", label: t.metodoBonifico },
  { value: "contanti", label: t.metodoContanti },
  { value: "altro", label: t.metodoAltro },
];

function SaldaContoDialog({ conto, onClose }: SaldaContoDialogProps) {
  const { user } = useAuthState();
  const { notify } = useToast();
  const saldo = useSaldaConto();
  const [importo, setImporto] = useState(String(conto.totaleConto));
  const [metodo, setMetodo] = useState<MetodoPagamento | "">("");
  const [note, setNote] = useState("");

  async function onConfirm(): Promise<void> {
    if (!user) return;
    const importoNum = Number(importo);
    try {
      await saldo.mutateAsync({
        input: {
          contoId: conto.id,
          ...(Number.isFinite(importoNum) && importoNum > 0
            ? { importoSaldato: importoNum }
            : {}),
          ...(metodo ? { metodoPagamento: metodo } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        },
        actor: user,
      });
      notify("Conto segnato come saldato", "success");
      onClose();
    } catch {
      notify("Salvataggio non riuscito", "error");
    }
  }

  return (
    <ConfirmDialog
      open
      title={`${t.segnaSaldato}: ${conto.aziendaNome}`}
      message={
        <div className="space-y-3">
          <TextField
            id="saldo-importo"
            type="number"
            step="10"
            min="0"
            label={t.importoSaldato}
            value={importo}
            onChange={(e) => setImporto(e.target.value)}
          />
          <Select
            id="saldo-metodo"
            label={t.metodoPagamento}
            value={metodo}
            options={METODO_OPTIONS}
            onChange={(e) => setMetodo(e.target.value as MetodoPagamento | "")}
          />
          <TextField
            id="saldo-note"
            label={t.note}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      }
      confirmLabel={t.conferma}
      cancelLabel={t.annulla}
      busy={saldo.isPending}
      onConfirm={onConfirm}
      onClose={() => {
        if (saldo.isPending) return;
        onClose();
      }}
    />
  );
}


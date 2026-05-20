import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import {
  Button,
  Dialog,
  Select,
  TextField,
  useToast,
} from "../../shared/ui";
import { useRepositories } from "../../infrastructure/RepositoriesContext";
import { useAuthState } from "../auth";
import { useReferenceData } from "../attivita/hooks/useReferenceData";
import { QuickAddAziendaDialog } from "../aziende/ui/QuickAddAziendaDialog";
import { QuickAddTipoDialog } from "../activity-types/ui/QuickAddTipoDialog";
import { nextOrdine } from "../activity-types/lib/ordine";
import { dateInputValue, formatEuro } from "../attivita/lib/format";
import {
  attivitaInputSchema,
  GINECOLOGIA_TIPO_ID,
  type Attivita,
  type AttivitaInput,
} from "@vet/shared";

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function meanTariffaByTipo(items: Attivita[]): Map<string, number> {
  const sums = new Map<string, { sum: number; n: number }>();
  for (const a of items) {
    if (a.tariffa <= 0) continue;
    const cur = sums.get(a.tipoId) ?? { sum: 0, n: 0 };
    cur.sum += a.tariffa;
    cur.n += 1;
    sums.set(a.tipoId, cur);
  }
  const out = new Map<string, number>();
  for (const [k, { sum, n }] of sums) {
    if (n >= 3) out.set(k, sum / n);
  }
  return out;
}

export function QuickEntryFab() {
  const { user } = useAuthState();
  const { attivita } = useRepositories();
  const ref = useReferenceData();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<string>(() => dateInputValue(new Date()));
  const [aziendaId, setAziendaId] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [tariffa, setTariffa] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [items, setItems] = useState<Attivita[]>([]);
  const [skipDupCheck, setSkipDupCheck] = useState(false);
  const [addAziendaOpen, setAddAziendaOpen] = useState(false);
  const [addTipoOpen, setAddTipoOpen] = useState(false);

  const canCreate = user?.caps.has("activities.create") ?? false;
  const canCreateAzienda = user?.caps.has("aziende.create") ?? false;
  const canCreateTipo = user?.caps.has("activity_types.manage") ?? false;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      try {
        const recent = await attivita.list();
        if (cancelled) return;
        setItems(recent);
        const order: string[] = [];
        for (const a of recent) {
          if (!order.includes(a.aziendaId)) order.push(a.aziendaId);
          if (order.length >= 6) break;
        }
        setRecentIds(order);
      } catch {
        setItems([]);
        setRecentIds([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, attivita]);

  useEffect(() => {
    if (!open || !tipoId || tariffa) return;
    if (tipoId === GINECOLOGIA_TIPO_ID) {
      if (!aziendaId) return;
      let cancelled = false;
      void (async () => {
        const last = await attivita.findLastByAziendaAndTipo(aziendaId, GINECOLOGIA_TIPO_ID);
        if (cancelled || !last) return;
        setTariffa(String(last.tariffa));
      })();
      return () => {
        cancelled = true;
      };
    }
    const tipo = ref.tipi.find((t) => t.id === tipoId);
    if (tipo?.tariffaStandard !== undefined) {
      setTariffa(String(tipo.tariffaStandard));
    }
  }, [aziendaId, tipoId, tariffa, open, attivita, ref.tipi]);

  useEffect(() => {
    setSkipDupCheck(false);
  }, [aziendaId, tipoId, data]);

  const means = useMemo(() => meanTariffaByTipo(items), [items]);
  const tariffaNum = tariffa.trim() === "" ? null : Number(tariffa);
  const rangeWarning = useMemo(() => {
    if (tariffaNum === null || !Number.isFinite(tariffaNum) || tariffaNum <= 0) return null;
    if (!tipoId) return null;
    const mean = means.get(tipoId);
    if (mean === undefined) return null;
    if (tariffaNum < mean * 0.5 || tariffaNum > mean * 2) {
      return `Tariffa fuori dal range solito per questo tipo (media ${formatEuro(mean)}).`;
    }
    return null;
  }, [tariffaNum, tipoId, means]);

  const candidateDate = useMemo(() => new Date(`${data}T00:00:00`), [data]);
  const duplicateExists = useMemo(() => {
    if (!aziendaId || !tipoId) return false;
    return items.some(
      (a) =>
        a.aziendaId === aziendaId &&
        a.tipoId === tipoId &&
        isSameDay(a.data, candidateDate)
    );
  }, [items, aziendaId, tipoId, candidateDate]);

  const aziendaOptions = useMemo(() => {
    const sorted = [...ref.aziende].sort((a, b) => {
      const ai = recentIds.indexOf(a.id);
      const bi = recentIds.indexOf(b.id);
      if (ai === -1 && bi === -1) return a.nome.localeCompare(b.nome, "it");
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    return [
      { value: "", label: "Scegli azienda" },
      ...sorted.map((a) => ({
        value: a.id,
        label: recentIds.includes(a.id) ? `★ ${a.nome}` : a.nome,
      })),
    ];
  }, [ref.aziende, recentIds]);
  const tipoOptions = useMemo(
    () => [
      { value: "", label: "Scegli tipo" },
      ...ref.tipi.map((t) => ({ value: t.id, label: t.nome })),
    ],
    [ref.tipi]
  );
  const nextTipoOrdine = useMemo(() => nextOrdine(ref.tipi), [ref.tipi]);

  if (!canCreate) return null;

  function reset(opts: { keepDate?: boolean } = {}) {
    if (!opts.keepDate) setData(dateInputValue(new Date()));
    setAziendaId("");
    setTipoId("");
    setTariffa("");
    setError(null);
    setSkipDupCheck(false);
  }

  async function performSave(): Promise<string | null> {
    if (!user) return null;
    const parsed = attivitaInputSchema.safeParse({
      data: candidateDate,
      aziendaId,
      tipoId,
      oraria: false,
      tariffa: Number(tariffa),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dati non validi");
      return null;
    }
    const azienda = ref.aziende.find((a) => a.id === aziendaId);
    const tipo = ref.tipi.find((t) => t.id === tipoId);
    if (!azienda || !tipo) {
      setError("Cliente o tipo non valido");
      return null;
    }
    if (duplicateExists && !skipDupCheck) {
      setError("Esiste già un'attività identica oggi. Premi Salva di nuovo per confermare.");
      setSkipDupCheck(true);
      return null;
    }
    setBusy(true);
    setError(null);
    try {
      const input: AttivitaInput = parsed.data;
      const newId = await attivita.create(
        input,
        { aziendaNome: azienda.nome, tipoNome: tipo.nome },
        user
      );
      return newId;
    } catch (err) {
      console.error("quick entry save failed", err);
      setError("Salvataggio non riuscito");
      return null;
    } finally {
      setBusy(false);
    }
  }

  function notifySavedWithUndo(id: string) {
    if (!user) return;
    notify("Attività salvata", {
      kind: "success",
      action: {
        label: "Annulla",
        onClick: () => {
          void (async () => {
            try {
              await attivita.softDelete(id, user);
              notify("Attività annullata");
            } catch (err) {
              console.error("undo failed", err);
              notify("Annullamento non riuscito", "error");
            }
          })();
        },
      },
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const id = await performSave();
    if (!id) return;
    notifySavedWithUndo(id);
    reset();
    setOpen(false);
  }

  async function handleSaveAndNew() {
    const id = await performSave();
    if (!id) return;
    notifySavedWithUndo(id);
    reset({ keepDate: true });
  }

  return (
    <>
      <button
        type="button"
        aria-label="Voce rapida"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-5 sm:bottom-5 z-30 w-12 h-12 rounded-full bg-(--color-accent) text-white shadow-lg hover:bg-(--color-accent-hover) print:hidden flex items-center justify-center"
      >
        <Plus size={22} strokeWidth={2} aria-hidden="true" />
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        labelledBy="quick-entry-title"
        size="md"
      >
        <div className="p-5">
          <h2 id="quick-entry-title" className="text-base font-medium text-(--color-text)">
            Voce rapida
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3 mt-5">
            <TextField
              id="qe-data"
              type="date"
              label="Data"
              value={data}
              onChange={(e) => setData(e.target.value)}
              required
            />
            <Select
              id="qe-azienda"
              label="Azienda"
              value={aziendaId}
              options={aziendaOptions}
              onChange={(e) => setAziendaId(e.target.value)}
              action={
                canCreateAzienda ? (
                  <button
                    type="button"
                    onClick={() => setAddAziendaOpen(true)}
                    className="text-(--color-accent) hover:underline font-medium"
                  >
                    + Nuova
                  </button>
                ) : null
              }
            />
            <Select
              id="qe-tipo"
              label="Tipo"
              value={tipoId}
              options={tipoOptions}
              onChange={(e) => setTipoId(e.target.value)}
              action={
                canCreateTipo ? (
                  <button
                    type="button"
                    onClick={() => setAddTipoOpen(true)}
                    className="text-(--color-accent) hover:underline font-medium"
                  >
                    + Nuovo
                  </button>
                ) : null
              }
            />
            <TextField
              id="qe-tariffa"
              type="number"
              step="0.01"
              min="0.01"
              label="Tariffa (€)"
              value={tariffa}
              onChange={(e) => setTariffa(e.target.value)}
              required
              hint={rangeWarning ?? undefined}
            />
            {tariffaNum !== null && tariffaNum > 0 ? (
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-(--color-text-muted)">Totale</span>
                <span className="font-medium text-(--color-text) tabular-nums">
                  {formatEuro(tariffaNum)}
                </span>
              </div>
            ) : null}
            {duplicateExists ? (
              <p className="text-xs text-(--color-danger)">
                Esiste già un&apos;attività con lo stesso cliente, tipo e data.
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="text-sm text-(--color-danger)">
                {error}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-3 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Chiudi
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSaveAndNew}
                  disabled={busy}
                >
                  Salva e nuova
                </Button>
                <Button type="submit" variant="primary" disabled={busy}>
                  Salva
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Dialog>
      <QuickAddAziendaDialog
        open={addAziendaOpen}
        onClose={() => setAddAziendaOpen(false)}
        onCreated={(a) => {
          ref.addAzienda(a);
          setAziendaId(a.id);
        }}
      />
      <QuickAddTipoDialog
        open={addTipoOpen}
        onClose={() => setAddTipoOpen(false)}
        nextOrdine={nextTipoOrdine}
        onCreated={(t) => {
          ref.addTipo(t);
          setTipoId(t.id);
        }}
      />
    </>
  );
}

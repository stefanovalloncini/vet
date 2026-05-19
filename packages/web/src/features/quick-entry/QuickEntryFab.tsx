import { useEffect, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import {
  Button,
  Dialog,
  Select,
  TextField,
} from "../../shared/ui";
import { useRepositories } from "../../infrastructure/RepositoriesContext";
import { useAuthState } from "../auth";
import { useReferenceData } from "../attivita/hooks/useReferenceData";
import { QuickAddAziendaDialog } from "../aziende/ui/QuickAddAziendaDialog";
import { QuickAddTipoDialog } from "../activity-types/ui/QuickAddTipoDialog";
import {
  attivitaInputSchema,
  GINECOLOGIA_TIPO_ID,
  type AttivitaInput,
} from "@vet/shared";

function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function QuickEntryFab() {
  const { user } = useAuthState();
  const { attivita } = useRepositories();
  const ref = useReferenceData();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<string>(todayIsoDate());
  const [aziendaId, setAziendaId] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [tariffa, setTariffa] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>([]);
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
        const order: string[] = [];
        for (const a of recent) {
          if (!order.includes(a.aziendaId)) order.push(a.aziendaId);
          if (order.length >= 6) break;
        }
        setRecentIds(order);
      } catch {
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

  if (!canCreate) return null;

  function reset() {
    setData(todayIsoDate());
    setAziendaId("");
    setTipoId("");
    setTariffa("");
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const candidate: Record<string, unknown> = {
      data: new Date(`${data}T00:00:00`),
      aziendaId,
      tipoId,
      oraria: false,
      tariffa: Number(tariffa),
    };
    const parsed = attivitaInputSchema.safeParse(candidate);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dati non validi");
      return;
    }
    const azienda = ref.aziende.find((a) => a.id === aziendaId);
    const tipo = ref.tipi.find((t) => t.id === tipoId);
    if (!azienda || !tipo) {
      setError("Cliente o tipo non valido");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const input: AttivitaInput = parsed.data;
      await attivita.create(
        input,
        { aziendaNome: azienda.nome, tipoNome: tipo.nome },
        user
      );
      setSavedAt(new Date());
      reset();
      setTimeout(() => setSavedAt(null), 2000);
    } catch {
      setError("Salvataggio non riuscito");
    } finally {
      setBusy(false);
    }
  }

  const sortedAziende = [...ref.aziende].sort((a, b) => {
    const ai = recentIds.indexOf(a.id);
    const bi = recentIds.indexOf(b.id);
    if (ai === -1 && bi === -1) return a.nome.localeCompare(b.nome, "it");
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  const aziendaOptions = [
    { value: "", label: "Scegli azienda" },
    ...sortedAziende.map((a) => ({
      value: a.id,
      label: recentIds.includes(a.id) ? `★ ${a.nome}` : a.nome,
    })),
  ];
  const tipoOptions = [
    { value: "", label: "Scegli tipo" },
    ...ref.tipi.map((t) => ({ value: t.id, label: t.nome })),
  ];

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
            />
            {error ? (
              <p role="alert" className="text-sm text-(--color-danger)">
                {error}
              </p>
            ) : null}
            {savedAt ? (
              <p className="text-sm text-(--color-success)">Salvato</p>
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
              <Button type="submit" variant="primary" disabled={busy}>
                Salva
              </Button>
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
        nextOrdine={
          (ref.tipi.reduce((m, t) => Math.max(m, t.ordine), 0) || 0) + 10
        }
        onCreated={(t) => {
          ref.addTipo(t);
          setTipoId(t.id);
        }}
      />
    </>
  );
}

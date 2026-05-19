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
import {
  attivitaInputSchema,
  GINECOLOGIA_TIPO_ID,
  type AttivitaInput,
} from "@vet/shared";

export function QuickEntryFab() {
  const { user } = useAuthState();
  const { attivita } = useRepositories();
  const ref = useReferenceData();
  const [open, setOpen] = useState(false);
  const [aziendaId, setAziendaId] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [tariffa, setTariffa] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const canCreate = user?.caps.has("activities.create") ?? false;

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
    if (!open) return;
    if (!aziendaId || tipoId !== GINECOLOGIA_TIPO_ID || tariffa) return;
    let cancelled = false;
    void (async () => {
      const last = await attivita.findLastByAziendaAndTipo(aziendaId, GINECOLOGIA_TIPO_ID);
      if (cancelled || !last) return;
      setTariffa(String(last.tariffa));
    })();
    return () => {
      cancelled = true;
    };
  }, [aziendaId, tipoId, tariffa, open, attivita]);

  if (!canCreate) return null;

  function reset() {
    setAziendaId("");
    setTipoId("");
    setTariffa("");
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const candidate: Record<string, unknown> = {
      data: new Date(),
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
          <p className="text-xs text-(--color-text-muted) mt-1">
            La data è impostata su oggi.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3 mt-5">
            <Select
              id="qe-azienda"
              label="Azienda"
              value={aziendaId}
              options={aziendaOptions}
              onChange={(e) => setAziendaId(e.target.value)}
            />
            <Select
              id="qe-tipo"
              label="Tipo"
              value={tipoId}
              options={tipoOptions}
              onChange={(e) => setTipoId(e.target.value)}
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
    </>
  );
}

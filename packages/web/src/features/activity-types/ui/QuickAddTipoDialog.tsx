import { useState, type FormEvent } from "react";
import { Button, Dialog, InlineError, TextField } from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { activityTypeInputSchema, slugify, type ActivityType } from "@vet/shared";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (tipo: ActivityType) => void;
  nextOrdine: number;
}

export function QuickAddTipoDialog({ open, onClose, onCreated, nextOrdine }: Props) {
  const { activityTypes } = useRepositories();
  const [nome, setNome] = useState("");
  const [tariffa, setTariffa] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedNome = nome.trim();
    if (!trimmedNome) {
      setError("Nome obbligatorio");
      return;
    }
    const tariffaTrim = tariffa.trim();
    const tariffaNum = tariffaTrim === "" ? undefined : Number(tariffaTrim);
    if (tariffaNum !== undefined && (!Number.isFinite(tariffaNum) || tariffaNum < 0)) {
      setError("Tariffa non valida");
      return;
    }
    const id = slugify(trimmedNome);
    if (!id) {
      setError("Nome non valido");
      return;
    }
    const parsed = activityTypeInputSchema.safeParse({
      nome: trimmedNome,
      ordine: nextOrdine,
      attivo: true,
      ...(tariffaNum !== undefined ? { tariffaStandard: tariffaNum } : {}),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dati non validi");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await activityTypes.upsert(id, parsed.data);
      const created = await activityTypes.getById(id);
      if (!created) throw new Error("Impossibile leggere il nuovo tipo");
      onCreated(created);
      setNome("");
      setTariffa("");
      onClose();
    } catch (err) {
      console.error("quick add tipo failed", err);
      setError(err instanceof Error ? err.message : "Salvataggio non riuscito");
    } finally {
      setBusy(false);
    }
  }

  function handleClose() {
    if (busy) return;
    setNome("");
    setTariffa("");
    setError(null);
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} labelledBy="quick-tipo-title" size="sm">
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <h2 id="quick-tipo-title" className="text-base font-medium text-(--color-text)">
            Nuovo tipo di attività
          </h2>
          <p className="text-xs text-(--color-text-muted) mt-1">
            Sarà disponibile in tutti i form. Puoi modificare ordine e tariffa dopo.
          </p>
        </div>
        <TextField
          id="quick-tipo-nome"
          label="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          autoFocus
          disabled={busy}
          placeholder="Es. Cesareo"
        />
        <TextField
          id="quick-tipo-tariffa"
          type="number"
          step="0.01"
          min="0"
          label="Tariffa standard (€)"
          value={tariffa}
          onChange={(e) => setTariffa(e.target.value)}
          disabled={busy}
          placeholder="opzionale"
          hint="Lascia vuoto se la tariffa cambia di volta in volta."
        />
        {error ? <InlineError>{error}</InlineError> : null}
        <div className="flex items-center justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={busy}>
            Annulla
          </Button>
          <Button type="submit" variant="primary" disabled={busy || !nome.trim()}>
            Crea
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

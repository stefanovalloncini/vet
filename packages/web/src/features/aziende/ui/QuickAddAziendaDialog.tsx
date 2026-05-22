import { useState, type FormEvent } from "react";
import { Button, Dialog, InlineError, TextField } from "../../../shared/ui";
import { useAuthState } from "../../auth";
import { aziendaInputSchema, type Azienda } from "@vet/shared";
import { useCreateAzienda } from "../hooks/useAziende";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (azienda: Azienda) => void;
  initialNome?: string;
}

export function QuickAddAziendaDialog({
  open,
  onClose,
  onCreated,
  initialNome = "",
}: Props) {
  const { user } = useAuthState();
  const { aziende: repo } = useRepositories();
  const create = useCreateAzienda();
  const [nome, setNome] = useState(initialNome);
  const [error, setError] = useState<string | null>(null);
  const busy = create.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const parsed = aziendaInputSchema.safeParse({ nome: nome.trim() });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dati non validi");
      return;
    }
    setError(null);
    try {
      const id = await create.mutateAsync({ input: parsed.data, actor: user });
      const created = await repo.getById(id);
      if (!created) throw new Error("Impossibile leggere la nuova azienda");
      onCreated(created);
      setNome("");
      onClose();
    } catch (err) {
      console.error("quick add azienda failed", err);
      setError(err instanceof Error ? err.message : "Salvataggio non riuscito");
    }
  }

  function handleClose() {
    if (busy) return;
    setNome("");
    setError(null);
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} labelledBy="quick-azienda-title" size="sm">
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <h2 id="quick-azienda-title" className="text-base font-medium text-(--color-text)">
            Nuova azienda
          </h2>
          <p className="text-xs text-(--color-text-muted) mt-1">
            Solo il nome è obbligatorio. Gli altri campi li puoi compilare dopo.
          </p>
        </div>
        <TextField
          id="quick-azienda-nome"
          label="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          autoFocus
          disabled={busy}
          placeholder="Nome azienda"
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

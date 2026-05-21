import { useState, type FormEvent } from "react";
import { Button, Dialog, Select, TextField, useToast } from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { useReferenceData } from "../../attivita/hooks/useReferenceData";
import { QuickAddAziendaDialog } from "../../aziende/ui/QuickAddAziendaDialog";
import { QuickAddTipoDialog } from "../../activity-types/ui/QuickAddTipoDialog";
import { nextOrdine } from "../../activity-types/lib/ordine";
import { formatEuro } from "../../attivita/lib/format";
import { useQuickEntryForm } from "../hooks/useQuickEntryForm";

interface QuickEntryDialogProps {
  open: boolean;
  onClose: () => void;
}

export function QuickEntryDialog({ open, onClose }: QuickEntryDialogProps) {
  const { user } = useAuthState();
  const { attivita } = useRepositories();
  const ref = useReferenceData();
  const { notify } = useToast();
  const form = useQuickEntryForm({ open, user, attivita, ref });
  const [addAziendaOpen, setAddAziendaOpen] = useState(false);
  const [addTipoOpen, setAddTipoOpen] = useState(false);

  const canCreateAzienda = user?.caps.has("aziende.create") ?? false;
  const canCreateTipo = user?.caps.has("activity_types.manage") ?? false;
  const nextTipoOrdine = nextOrdine(ref.tipi);

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
    const id = await form.save();
    if (!id) return;
    notifySavedWithUndo(id);
    form.reset();
    onClose();
  }

  async function handleSaveAndNew() {
    const id = await form.save();
    if (!id) return;
    notifySavedWithUndo(id);
    form.reset({ keepDate: true });
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} labelledBy="quick-entry-title" size="md">
        <div className="p-5">
          <h2
            id="quick-entry-title"
            className="text-base font-medium text-(--color-text)"
          >
            Voce rapida
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3 mt-5">
            <TextField
              id="qe-data"
              type="date"
              label="Data"
              value={form.data}
              onChange={(e) => form.setData(e.target.value)}
              required
            />
            <Select
              id="qe-azienda"
              label="Azienda"
              value={form.aziendaId}
              options={form.aziendaOptions}
              onChange={(e) => form.setAziendaId(e.target.value)}
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
              value={form.tipoId}
              options={form.tipoOptions}
              onChange={(e) => form.setTipoId(e.target.value)}
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
              value={form.tariffa}
              onChange={(e) => form.setTariffa(e.target.value)}
              required
              hint={form.rangeWarning ?? undefined}
            />
            {form.tariffaNum !== null && form.tariffaNum > 0 ? (
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-(--color-text-muted)">Totale</span>
                <span className="font-medium text-(--color-text) tabular-nums">
                  {formatEuro(form.tariffaNum)}
                </span>
              </div>
            ) : null}
            {form.duplicateExists ? (
              <p className="text-xs text-(--color-danger)">
                Esiste già un&apos;attività con lo stesso cliente, tipo e data.
              </p>
            ) : null}
            {form.error ? (
              <p role="alert" className="text-sm text-(--color-danger)">
                {form.error}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-3 pt-1">
              <Button type="button" variant="ghost" onClick={onClose} disabled={form.busy}>
                Chiudi
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSaveAndNew}
                  disabled={form.busy}
                >
                  Salva e nuova
                </Button>
                <Button type="submit" variant="primary" disabled={form.busy}>
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
          form.setAziendaId(a.id);
        }}
      />
      <QuickAddTipoDialog
        open={addTipoOpen}
        onClose={() => setAddTipoOpen(false)}
        nextOrdine={nextTipoOrdine}
        onCreated={(t) => {
          ref.addTipo(t);
          form.setTipoId(t.id);
        }}
      />
    </>
  );
}

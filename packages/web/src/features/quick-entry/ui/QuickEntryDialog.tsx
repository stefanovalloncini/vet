import { useState } from "react";
import { FormProvider } from "react-hook-form";
import {
  Button,
  Dialog,
  InlineError,
  useToast,
} from "../../../shared/ui";
import { RHFSelect, RHFTextField } from "../../../shared/ui/rhf";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { useReferenceData } from "../../attivita/hooks/useReferenceData";
import { QuickAddAziendaDialog } from "../../aziende/ui/QuickAddAziendaDialog";
import { QuickAddTipoDialog } from "../../activity-types/ui/QuickAddTipoDialog";
import { nextOrdine } from "../../activity-types/lib/ordine";
import { formatEuro } from "../../attivita/lib/format";
import { useUndoCreateAttivita } from "../hooks/useUndoCreateAttivita";
import {
  useQuickEntryFormState,
  type QuickEntryFormValues,
} from "../hooks/useQuickEntryFormState";
import type { ActorContext } from "@vet/shared";

interface QuickEntryDialogProps {
  open: boolean;
  onClose: () => void;
}

export function QuickEntryDialog({ open, onClose }: QuickEntryDialogProps) {
  const { user } = useAuthState();
  const { attivita } = useRepositories();
  const ref = useReferenceData();
  const { notify } = useToast();
  const undoCreate = useUndoCreateAttivita();
  const [addAziendaOpen, setAddAziendaOpen] = useState(false);
  const [addTipoOpen, setAddTipoOpen] = useState(false);

  const s = useQuickEntryFormState({ open, user, attivita, ref });

  const canCreateAzienda = user?.caps.has("aziende.create") ?? false;
  const canCreateTipo = user?.caps.has("activity_types.manage") ?? false;
  const nextTipoOrdine = nextOrdine(ref.tipi);

  function notifySavedWithUndo(id: string, currentUser: ActorContext) {
    notify("Attività salvata", {
      kind: "success",
      action: {
        label: "Annulla",
        onClick: () => {
          undoCreate.mutate(
            { id, user: currentUser },
            {
              onSuccess: () => notify("Attività annullata"),
              onError: (err) => {
                console.error("undo failed", err);
                notify("Annullamento non riuscito", "error");
              },
            }
          );
        },
      },
    });
  }

  async function onSubmit(values: QuickEntryFormValues) {
    const result = await s.submit(values);
    if (!result.ok || !user) return;
    notifySavedWithUndo(result.id, user);
    s.resetAll();
    onClose();
  }

  async function handleSaveAndNew() {
    const valid = await s.form.trigger();
    if (!valid) return;
    const values = s.form.getValues();
    const result = await s.submit(values);
    if (!result.ok || !user) return;
    notifySavedWithUndo(result.id, user);
    s.resetAll({ data: values.data });
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} labelledBy="quick-entry-title" size="md">
        <FormProvider {...s.form}>
          <div className="p-5">
            <h2
              id="quick-entry-title"
              className="text-base font-medium text-(--color-text)"
            >
              Voce rapida
            </h2>
            <form
              noValidate
              onSubmit={s.form.handleSubmit(onSubmit)}
              className="space-y-3 mt-5"
            >
              <RHFTextField<QuickEntryFormValues>
                name="data"
                type="date"
                label="Data"
                required
              />
              <RHFSelect<QuickEntryFormValues>
                name="aziendaId"
                label="Azienda"
                options={s.aziendaOptions}
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
              <RHFSelect<QuickEntryFormValues>
                name="tipoId"
                label="Tipo"
                options={s.tipoOptions}
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
              <RHFTextField<QuickEntryFormValues>
                name="tariffa"
                type="number"
                step="0.01"
                min="0.01"
                label="Tariffa (€)"
                required
                {...(s.rangeWarning ? { hint: s.rangeWarning } : {})}
              />
              {s.tariffaNum !== null && s.tariffaNum > 0 ? (
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-(--color-text-muted)">Totale</span>
                  <span className="font-medium text-(--color-text) tabular-nums">
                    {formatEuro(s.tariffaNum)}
                  </span>
                </div>
              ) : null}
              {s.duplicateExists ? (
                <p className="text-xs text-(--color-danger)">
                  Esiste già un&apos;attività con lo stesso cliente, tipo e data.
                </p>
              ) : null}
              {s.rootError ? <InlineError>{s.rootError}</InlineError> : null}
              <div className="flex items-center justify-between gap-3 pt-1">
                <Button type="button" variant="ghost" onClick={onClose} disabled={s.busy}>
                  Chiudi
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSaveAndNew}
                    disabled={s.busy}
                  >
                    Salva e nuova
                  </Button>
                  <Button type="submit" variant="primary" disabled={s.busy}>
                    Salva
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </FormProvider>
      </Dialog>
      <QuickAddAziendaDialog
        open={addAziendaOpen}
        onClose={() => setAddAziendaOpen(false)}
        onCreated={(a) => {
          ref.addAzienda(a);
          s.form.setValue("aziendaId", a.id, { shouldValidate: true });
        }}
      />
      <QuickAddTipoDialog
        open={addTipoOpen}
        onClose={() => setAddTipoOpen(false)}
        nextOrdine={nextTipoOrdine}
        onCreated={(t) => {
          ref.addTipo(t);
          s.form.setValue("tipoId", t.id, { shouldValidate: true });
        }}
      />
    </>
  );
}

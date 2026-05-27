import { useState } from "react";
import { FormProvider, useWatch } from "react-hook-form";
import type { ActorContext, Modalita } from "@vet/shared";
import {
  AddLink,
  Button,
  Dialog,
  InlineError,
  useToast,
} from "../../../shared/ui";
import {
  RHFNumberField,
  RHFSegmentedControl,
  RHFSelect,
  RHFTextArea,
  RHFTextField,
} from "../../../shared/ui/rhf";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { useReferenceData } from "../../attivita/hooks/useReferenceData";
import { QuickAddAziendaDialog } from "../../aziende";
import { QuickAddTipoDialog, nextOrdine } from "../../activity-types";
import { formatEuro } from "../../../shared/lib/format";
import { useUndoCreateAttivita } from "../hooks/useUndoCreateAttivita";
import {
  useQuickEntryFormState,
  type QuickEntryFormValues,
} from "../hooks/useQuickEntryFormState";
import { SuggestionsPanel } from "./SuggestionsPanel";
import type { Combo } from "../lib/recentCombos";

const MODALITA_SEGMENTS: ReadonlyArray<{ value: Modalita; label: string }> = [
  { value: "oraria", label: "Oraria" },
  { value: "adElemento", label: "Ad elemento" },
  { value: "fissa", label: "Fissa" },
];

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

  function pickCombo(c: Combo) {
    s.form.clearErrors();
    s.form.setValue("aziendaId", c.aziendaId, { shouldDirty: true, shouldValidate: false });
    s.form.setValue("tipoId", c.tipoId, { shouldDirty: true, shouldValidate: false });
    s.form.setValue("tariffa", String(c.tariffa), { shouldDirty: true, shouldValidate: false });
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        labelledBy="quick-entry-title"
        size="md"
      >
        <FormProvider {...s.form}>
          <div className="p-5 sm:p-6">
            <h2
              id="quick-entry-title"
              className="text-base font-medium text-(--color-text)"
            >
              Voce rapida
            </h2>
            <SuggestionsBridge combos={s.combos} onPick={pickCombo} />
            <form
              noValidate
              onSubmit={s.form.handleSubmit(onSubmit)}
              className="mt-5 space-y-4"
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
                    <AddLink
                      label="+ Nuova"
                      onClick={() => setAddAziendaOpen(true)}
                    />
                  ) : null
                }
              />
              <RHFSelect<QuickEntryFormValues>
                name="tipoId"
                label="Tipo"
                options={s.tipoOptions}
                action={
                  canCreateTipo ? (
                    <AddLink
                      label="+ Nuovo"
                      onClick={() => setAddTipoOpen(true)}
                    />
                  ) : null
                }
              />
              <RHFSegmentedControl<QuickEntryFormValues, Modalita>
                name="modalita"
                label="Modalità tariffa"
                segments={MODALITA_SEGMENTS}
              />
              <RHFNumberField<QuickEntryFormValues>
                name="tariffa"
                label="Tariffa (EUR)"
                step={0.01}
                min={0}
                {...(s.rangeWarning ? { hint: s.rangeWarning } : {})}
              />
              <QuantitaField />
              <RHFTextArea<QuickEntryFormValues>
                name="note"
                label="Note"
                rows={2}
                placeholder="Dettagli aggiuntivi"
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
              <div className="sticky bottom-[-1.25rem] sm:bottom-[-1.5rem] -mx-5 sm:-mx-6 px-5 sm:px-6 pt-3 pb-4 sm:pb-5 mt-2 bg-(--color-surface) border-t border-(--color-border) flex flex-col gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={s.busy}
                >
                  Salva
                </Button>
                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    disabled={s.busy}
                  >
                    Annulla
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSaveAndNew}
                    disabled={s.busy}
                  >
                    Salva e nuova
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

function QuantitaField() {
  const modalita = useWatch<QuickEntryFormValues>({ name: "modalita" }) as
    | QuickEntryFormValues["modalita"]
    | undefined;
  if (modalita === "oraria") {
    return (
      <RHFNumberField<QuickEntryFormValues>
        name="ore"
        label="Ore"
        step={0.5}
        min={0}
      />
    );
  }
  if (modalita === "adElemento") {
    return (
      <RHFNumberField<QuickEntryFormValues>
        name="elementi"
        label="Quantità"
        step={1}
        min={0}
      />
    );
  }
  return null;
}

interface SuggestionsBridgeProps {
  combos: ReturnType<typeof useQuickEntryFormState>["combos"];
  onPick: (c: Combo) => void;
}

function SuggestionsBridge({ combos, onPick }: SuggestionsBridgeProps) {
  const aziendaId = (useWatch<QuickEntryFormValues>({ name: "aziendaId" }) ?? "") as string;
  const tipoId = (useWatch<QuickEntryFormValues>({ name: "tipoId" }) ?? "") as string;
  const active = aziendaId && tipoId ? { aziendaId, tipoId } : null;
  return (
    <div className="mt-4">
      <SuggestionsPanel combos={combos} active={active} onPick={onPick} />
    </div>
  );
}

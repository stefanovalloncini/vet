import { FormProvider } from "react-hook-form";
import { Button, InlineError } from "../../../shared/ui";
import { RHFSelect, RHFTextArea, RHFTextField } from "../../../shared/ui/rhf";
import { remindersI18n as t } from "../i18n";
import {
  useReminderCreate,
  type ReminderCreateValues,
} from "../hooks/useReminderCreate";

interface ReminderCreateFormProps {
  aziendaOptions: ReadonlyArray<{ value: string; label: string }>;
  state: ReturnType<typeof useReminderCreate>;
  onCancel: () => void;
  onSubmit: () => void;
}

export function ReminderCreateForm({
  aziendaOptions,
  state,
  onCancel,
  onSubmit,
}: ReminderCreateFormProps) {
  return (
    <FormProvider {...state.form}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit();
        }}
        className="mb-6 border border-(--color-border) rounded-2xl p-5 space-y-4 bg-(--color-surface)"
      >
        <RHFSelect<ReminderCreateValues>
          name="aziendaId"
          label={t.campoAzienda}
          options={aziendaOptions}
          disabled={state.busy}
        />
        <RHFTextField<ReminderCreateValues>
          name="titolo"
          label={t.campoTitolo}
          hint={t.campoTitoloHint}
          disabled={state.busy}
        />
        <RHFTextField<ReminderCreateValues>
          name="data"
          type="date"
          label={t.campoData}
          disabled={state.busy}
        />
        <RHFTextArea<ReminderCreateValues>
          name="note"
          label={t.campoNote}
          maxLength={500}
          disabled={state.busy}
        />
        {state.rootError ? <InlineError>{state.rootError}</InlineError> : null}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={state.busy}>
            {t.annulla}
          </Button>
          <Button type="submit" variant="primary" disabled={state.busy}>
            {t.salva}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

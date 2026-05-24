import { useState } from "react";
import { FormProvider } from "react-hook-form";
import {
  AppShell,
  BoxedList,
  Button,
  ConfirmDialog,
  EmptyState,
  InlineError,
  LoadingHint,
  PageHeader,
} from "../../../shared/ui";
import { RHFSelect, RHFTextArea, RHFTextField } from "../../../shared/ui/rhf";
import { useAuthState } from "../../auth";
import { useReferenceData } from "../../attivita/hooks/useReferenceData";
import {
  useDeleteReminder,
  useReminders,
  useUpdateReminder,
} from "../hooks/useReminders";
import {
  useReminderCreate,
  type ReminderCreateValues,
} from "../hooks/useReminderCreate";
import { remindersI18n as t } from "../i18n";
import { ReminderRow } from "./ReminderRow";
import type { Reminder } from "@vet/shared";

export function RemindersPage() {
  const { user } = useAuthState();
  const ref = useReferenceData();
  const { reminders, loading, error: loadError } = useReminders();
  const update = useUpdateReminder();
  const remove = useDeleteReminder();
  const create = useReminderCreate({
    user,
    aziende: ref.aziende,
  });

  const canCreate = user?.caps.has("reminders.create") ?? false;
  const canUpdateAny = user?.caps.has("reminders.update.any") ?? false;
  const canUpdateOwn = user?.caps.has("reminders.update.own") ?? false;
  const canDeleteAny = user?.caps.has("reminders.delete.any") ?? false;
  const canDeleteOwn = user?.caps.has("reminders.delete.own") ?? false;
  const canUpdateOne = (r: Reminder) =>
    canUpdateAny || (canUpdateOwn && r.createdBy === user?.uid);
  const canDeleteOne = (r: Reminder) =>
    canDeleteAny || (canDeleteOwn && r.createdBy === user?.uid);

  const [adding, setAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Reminder | null>(null);

  async function handleAdd(): Promise<void> {
    const ok = await create.submit();
    if (ok) setAdding(false);
  }

  async function toggleDone(r: Reminder): Promise<void> {
    if (!canUpdateOne(r)) return;
    await update.mutateAsync({ id: r.id, done: !r.done });
  }

  async function handleDelete(r: Reminder): Promise<void> {
    if (!canDeleteOne(r)) return;
    await remove.mutateAsync(r.id);
  }

  const aziendaOptions = [
    { value: "", label: "Scegli azienda" },
    ...ref.aziende.map((a) => ({ value: a.id, label: a.nome })),
  ];

  return (
    <AppShell>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        {...(canCreate && !adding
          ? {
              actions: (
                <Button type="button" variant="primary" onClick={() => setAdding(true)}>
                  {t.nuovo}
                </Button>
              ),
            }
          : {})}
      />

      {adding ? (
        <ReminderCreateForm
          aziendaOptions={aziendaOptions}
          state={create}
          onCancel={() => {
            create.reset();
            setAdding(false);
          }}
          onSubmit={handleAdd}
        />
      ) : null}

      {loading ? (
        <LoadingHint label={t.loading} />
      ) : loadError ? (
        <InlineError>{t.loadError}</InlineError>
      ) : reminders.length === 0 ? (
        <EmptyState title={t.emptyAll} />
      ) : (
        <BoxedList>
          {reminders.map((r) => (
            <ReminderRow
              key={r.id}
              reminder={r}
              canUpdate={canUpdateOne(r)}
              canDelete={canDeleteOne(r)}
              onToggle={() => void toggleDone(r)}
              onDelete={() => setPendingDelete(r)}
            />
          ))}
        </BoxedList>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t.confermaEliminazioneTitolo}
        message={t.confermaEliminazione}
        confirmLabel={t.elimina}
        cancelLabel={t.annulla}
        variant="danger"
        onConfirm={() => {
          const r = pendingDelete;
          setPendingDelete(null);
          if (r) void handleDelete(r);
        }}
        onClose={() => setPendingDelete(null)}
      />
    </AppShell>
  );
}

interface ReminderCreateFormProps {
  aziendaOptions: ReadonlyArray<{ value: string; label: string }>;
  state: ReturnType<typeof useReminderCreate>;
  onCancel: () => void;
  onSubmit: () => void;
}

function ReminderCreateForm({
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

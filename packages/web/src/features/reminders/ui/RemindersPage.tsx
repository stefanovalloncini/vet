import { useState } from "react";
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
import { useAuthState } from "../../auth";
import { useReferenceData } from "../../attivita/hooks/useReferenceData";
import {
  useDeleteReminder,
  useReminders,
  useUpdateReminder,
} from "../hooks/useReminders";
import { useReminderCreate } from "../hooks/useReminderCreate";
import { remindersI18n as t } from "../i18n";
import { ReminderRow } from "./ReminderRow";
import { ReminderCreateForm } from "./ReminderCreateForm";
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
        <EmptyState title={t.emptyAll} description={t.emptyAllHint} />
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


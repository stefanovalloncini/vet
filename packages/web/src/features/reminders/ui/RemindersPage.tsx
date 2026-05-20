import { useState } from "react";
import {
  AppShell,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Select,
  TextArea,
  TextField,
} from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { useReferenceData } from "../../attivita/hooks/useReferenceData";
import { useReminders } from "../hooks/useReminders";
import { remindersI18n as t } from "../i18n";
import {
  dateInputValue,
  parseDateInput,
} from "../../attivita/lib/format";
import {
  reminderInputSchema,
  type Reminder,
} from "@vet/shared";

export function RemindersPage() {
  const { user } = useAuthState();
  const { reminders: repo } = useRepositories();
  const ref = useReferenceData();
  const { reminders, loading, refresh } = useReminders();

  const canCreate = user?.caps.has("reminders.create") ?? false;
  const canUpdateAny = user?.caps.has("reminders.update.any") ?? false;
  const canUpdateOwn = user?.caps.has("reminders.update.own") ?? false;
  const canDeleteAny = user?.caps.has("reminders.delete.any") ?? false;
  const canDeleteOwn = user?.caps.has("reminders.delete.own") ?? false;
  const canUpdate = (r: Reminder) =>
    canUpdateAny || (canUpdateOwn && r.createdBy === user?.uid);
  const canDelete = (r: Reminder) =>
    canDeleteAny || (canDeleteOwn && r.createdBy === user?.uid);

  const [adding, setAdding] = useState(false);
  const [aziendaId, setAziendaId] = useState("");
  const [titolo, setTitolo] = useState("");
  const [data, setData] = useState(dateInputValue(addDays(new Date(), 7)));
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Reminder | null>(null);

  async function handleAdd() {
    if (!user) return;
    const due = parseDateInput(data);
    if (!due) {
      setError(t.saveError);
      return;
    }
    const noteTrim = note.trim();
    const parsed = reminderInputSchema.safeParse({
      aziendaId,
      titolo: titolo.trim(),
      dueAt: due,
      ...(noteTrim ? { note: noteTrim } : {}),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t.saveError);
      return;
    }
    const azienda = ref.aziende.find((a) => a.id === aziendaId);
    if (!azienda) {
      setError(t.saveError);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await repo.create(parsed.data, { aziendaNome: azienda.nome }, user);
      setAdding(false);
      setTitolo("");
      setNote("");
      setAziendaId("");
      setData(dateInputValue(addDays(new Date(), 7)));
      await refresh();
    } catch {
      setError(t.saveError);
    } finally {
      setBusy(false);
    }
  }

  async function toggleDone(r: Reminder) {
    if (!canUpdate(r)) return;
    await repo.markDone(r.id, !r.done);
    await refresh();
  }

  async function handleDelete(r: Reminder) {
    if (!canDelete(r)) return;
    await repo.delete(r.id);
    await refresh();
  }

  const aziendaOptions = [
    { value: "", label: "Scegli azienda" },
    ...ref.aziende.map((a) => ({ value: a.id, label: a.nome })),
  ];

  return (
    <AppShell>
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl text-(--color-text)">{t.title}</h1>
          <p className="text-(--color-text-muted) mt-2 text-sm">{t.subtitle}</p>
        </div>
        {canCreate && !adding ? (
          <Button
            type="button"
            variant="primary"
            onClick={() => setAdding(true)}
          >
            {t.nuovo}
          </Button>
        ) : null}
      </header>

      {adding ? (
        <Card className="mb-6">
          <div className="space-y-4">
            <Select
              id="rem-azienda"
              label={t.campoAzienda}
              value={aziendaId}
              options={aziendaOptions}
              onChange={(e) => setAziendaId(e.target.value)}
            />
            <TextField
              id="rem-titolo"
              label={t.campoTitolo}
              value={titolo}
              onChange={(e) => setTitolo(e.target.value)}
              hint={t.campoTitoloHint}
            />
            <TextField
              id="rem-data"
              type="date"
              label={t.campoData}
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
            <TextArea
              id="rem-note"
              label={t.campoNote}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
            />
            {error ? (
              <p role="alert" className="text-sm text-(--color-danger)">
                {error}
              </p>
            ) : null}
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAdding(false)}
                disabled={busy}
              >
                {t.annulla}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleAdd}
                disabled={busy}
              >
                {t.salva}
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {loading ? (
        <p className="text-sm text-(--color-text-muted)">{t.loading}</p>
      ) : reminders.length === 0 ? (
        <EmptyState title={t.emptyAll} />
      ) : (
        <ul className="space-y-2">
          {reminders.map((r) => (
            <li key={r.id}>
              <ReminderRow
                reminder={r}
                canUpdate={canUpdate(r)}
                canDelete={canDelete(r)}
                onToggle={() => toggleDone(r)}
                onDelete={() => setPendingDelete(r)}
              />
            </li>
          ))}
        </ul>
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

function ReminderRow({
  reminder: r,
  canUpdate,
  canDelete,
  onToggle,
  onDelete,
}: {
  reminder: Reminder;
  canUpdate: boolean;
  canDelete: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const days = daysUntil(r.dueAt);
  const overdue = !r.done && days < 0;
  return (
    <Card
      className={overdue ? "border-(--color-danger)/40" : undefined}
    >
      <div className="flex items-start gap-3">
        {canUpdate ? (
          <input
            type="checkbox"
            checked={r.done}
            onChange={onToggle}
            className="mt-1 w-4 h-4 accent-(--color-accent) flex-shrink-0"
            aria-label={r.done ? t.fatto : t.nonFatto}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p
            className={[
              "text-base font-medium",
              r.done
                ? "text-(--color-text-muted) line-through"
                : "text-(--color-text)",
            ].join(" ")}
          >
            {r.titolo}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
            <span className="text-(--color-text-muted)">{r.aziendaNome}</span>
            <span
              className={[
                "px-2 py-0.5 rounded-md",
                overdue
                  ? "bg-(--color-danger)/10 text-(--color-danger)"
                  : "bg-(--color-surface-muted) text-(--color-text-muted)",
              ].join(" ")}
            >
              {humanDays(days, r.done)}
              {" · "}
              {r.dueAt.toLocaleDateString("it-IT")}
            </span>
          </div>
          {r.note ? (
            <p className="text-xs text-(--color-text-subtle) mt-2">{r.note}</p>
          ) : null}
        </div>
        {canDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
          >
            {t.elimina}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function daysUntil(d: Date): number {
  const a = new Date(d);
  a.setHours(0, 0, 0, 0);
  const b = new Date();
  b.setHours(0, 0, 0, 0);
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

function humanDays(days: number, done: boolean): string {
  if (done) return t.fatto;
  if (days < 0) return `${t.scaduto} di ${-days} ${t.giorni}`;
  if (days === 0) return t.oggi;
  if (days === 1) return t.domani;
  return `${t.tra} ${days} ${t.giorni}`;
}

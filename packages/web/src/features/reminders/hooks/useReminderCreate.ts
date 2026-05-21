import { useState } from "react";
import {
  reminderInputSchema,
  type ActorContext,
  type Azienda,
  type RemindersRepository,
} from "@vet/shared";
import { dateInputValue, parseDateInput } from "../../attivita/lib/format";
import { remindersI18n as t } from "../i18n";
import { addDays } from "../lib/dates";

interface UseReminderCreateArgs {
  user: ActorContext | null;
  aziende: ReadonlyArray<Azienda>;
  repo: RemindersRepository;
  onCreated: () => Promise<void>;
}

const DEFAULT_LEAD_DAYS = 7;

function emptyDate(): string {
  return dateInputValue(addDays(new Date(), DEFAULT_LEAD_DAYS));
}

export interface ReminderCreateState {
  aziendaId: string;
  setAziendaId: (next: string) => void;
  titolo: string;
  setTitolo: (next: string) => void;
  data: string;
  setData: (next: string) => void;
  note: string;
  setNote: (next: string) => void;
  busy: boolean;
  error: string | null;
  submit: () => Promise<boolean>;
  reset: () => void;
}

export function useReminderCreate({
  user,
  aziende,
  repo,
  onCreated,
}: UseReminderCreateArgs): ReminderCreateState {
  const [aziendaId, setAziendaId] = useState("");
  const [titolo, setTitolo] = useState("");
  const [data, setData] = useState<string>(emptyDate);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset(): void {
    setAziendaId("");
    setTitolo("");
    setNote("");
    setData(emptyDate());
    setError(null);
  }

  async function submit(): Promise<boolean> {
    if (!user) return false;
    const due = parseDateInput(data);
    if (!due) {
      setError(t.saveError);
      return false;
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
      return false;
    }
    const azienda = aziende.find((a) => a.id === aziendaId);
    if (!azienda) {
      setError(t.saveError);
      return false;
    }
    setBusy(true);
    setError(null);
    try {
      await repo.create(parsed.data, { aziendaNome: azienda.nome }, user);
      reset();
      await onCreated();
      return true;
    } catch {
      setError(t.saveError);
      return false;
    } finally {
      setBusy(false);
    }
  }

  return {
    aziendaId,
    setAziendaId,
    titolo,
    setTitolo,
    data,
    setData,
    note,
    setNote,
    busy,
    error,
    submit,
    reset,
  };
}

import { useState } from "react";
import {
  reminderInputSchema,
  type ActorContext,
  type Azienda,
} from "@vet/shared";
import { dateInputValue, parseDateInput } from "../../attivita/lib/format";
import { remindersI18n as t } from "../i18n";
import { addDays } from "../lib/dates";
import { useCreateReminder } from "./useReminders";

interface UseReminderCreateArgs {
  user: ActorContext | null;
  aziende: ReadonlyArray<Azienda>;
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
}: UseReminderCreateArgs): ReminderCreateState {
  const [aziendaId, setAziendaId] = useState("");
  const [titolo, setTitolo] = useState("");
  const [data, setData] = useState<string>(emptyDate);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const create = useCreateReminder();

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
    setError(null);
    try {
      await create.mutateAsync({
        input: parsed.data,
        denorm: { aziendaNome: azienda.nome },
        actor: user,
      });
      reset();
      return true;
    } catch {
      setError(t.saveError);
      return false;
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
    busy: create.isPending,
    error,
    submit,
    reset,
  };
}

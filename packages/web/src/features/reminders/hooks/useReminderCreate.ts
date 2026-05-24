import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const formSchema = z.object({
  aziendaId: z.string().min(1, "Scegli un'azienda"),
  titolo: z.string().min(1, "Titolo obbligatorio").max(120),
  data: z.string().min(1, "Data obbligatoria"),
  note: z.string().max(500),
});

export type ReminderCreateValues = z.infer<typeof formSchema>;

function defaults(): ReminderCreateValues {
  return {
    aziendaId: "",
    titolo: "",
    data: dateInputValue(addDays(new Date(), DEFAULT_LEAD_DAYS)),
    note: "",
  };
}

export interface ReminderCreateState {
  form: UseFormReturn<ReminderCreateValues>;
  busy: boolean;
  rootError: string | undefined;
  submit: () => Promise<boolean>;
  reset: () => void;
}

export function useReminderCreate({
  user,
  aziende,
}: UseReminderCreateArgs): ReminderCreateState {
  const form = useForm<ReminderCreateValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults(),
    mode: "onSubmit",
  });
  const create = useCreateReminder();

  function reset(): void {
    form.reset(defaults());
  }

  async function submit(): Promise<boolean> {
    const valid = await form.trigger();
    if (!valid || !user) return false;
    const values = form.getValues();
    const due = parseDateInput(values.data);
    if (!due) {
      form.setError("data", { message: "Data non valida" });
      return false;
    }
    const noteTrim = values.note.trim();
    const parsed = reminderInputSchema.safeParse({
      aziendaId: values.aziendaId,
      titolo: values.titolo.trim(),
      dueAt: due,
      ...(noteTrim ? { note: noteTrim } : {}),
    });
    if (!parsed.success) {
      form.setError("root", {
        message: parsed.error.issues[0]?.message ?? t.saveError,
      });
      return false;
    }
    const azienda = aziende.find((a) => a.id === values.aziendaId);
    if (!azienda) {
      form.setError("root", { message: t.saveError });
      return false;
    }
    try {
      await create.mutateAsync({
        input: parsed.data,
        denorm: { aziendaNome: azienda.nome },
        actor: user,
      });
      reset();
      return true;
    } catch (err) {
      console.error("reminder create failed", err);
      form.setError("root", { message: t.saveError });
      return false;
    }
  }

  return {
    form,
    busy: create.isPending || form.formState.isSubmitting,
    rootError: form.formState.errors.root?.message,
    submit,
    reset,
  };
}

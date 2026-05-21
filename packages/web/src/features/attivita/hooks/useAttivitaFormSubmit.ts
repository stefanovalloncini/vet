import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  attivitaInputSchema,
  type ActorContext,
  type AttivitaInput,
  type AttivitaRepository,
  type Azienda,
  type ActivityType,
  type RemindersRepository,
} from "@vet/shared";
import { useToast } from "../../../shared/ui";
import { parseDateInput } from "../lib/format";
import { attivitaI18n as t } from "../i18n";
import type { AttivitaFormState } from "../ui/AttivitaFormFields";

interface UseAttivitaFormSubmitArgs {
  isEdit: boolean;
  id: string | undefined;
  user: ActorContext | null;
  form: AttivitaFormState;
  aziende: ReadonlyArray<Azienda>;
  tipi: ReadonlyArray<ActivityType>;
  repo: AttivitaRepository;
  reminders: RemindersRepository;
}

type FieldErrors = Partial<Record<keyof AttivitaFormState, string>>;

export interface AttivitaFormSubmitResult {
  busy: boolean;
  errors: FieldErrors;
  globalError: string | null;
  submit: (e: FormEvent) => Promise<void>;
  deleteEntry: () => Promise<void>;
  clearFieldError: (key: keyof AttivitaFormState) => void;
}

export function useAttivitaFormSubmit({
  isEdit,
  id,
  user,
  form,
  aziende,
  tipi,
  repo,
  reminders,
}: UseAttivitaFormSubmitArgs): AttivitaFormSubmitResult {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  function clearFieldError(key: keyof AttivitaFormState): void {
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  function buildInput(): AttivitaInput | null {
    const date = parseDateInput(form.data);
    if (!date) {
      setErrors((e) => ({ ...e, data: "Data non valida" }));
      return null;
    }
    const note = form.note.trim();
    const parsed = attivitaInputSchema.safeParse({
      data: date,
      aziendaId: form.aziendaId,
      tipoId: form.tipoId,
      oraria: form.oraria,
      tariffa: Number(form.tariffa),
      ...(form.oraria ? { ore: Number(form.ore) } : {}),
      ...(note ? { note } : {}),
    });
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as keyof AttivitaFormState;
        if (path && !fieldErrors[path]) fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return null;
    }
    return parsed.data;
  }

  async function maybeCreateReminder(azienda: Azienda): Promise<void> {
    if (!user) return;
    const dueDate = parseDateInput(form.reminderAt);
    const title = form.reminderTitle.trim();
    if (!dueDate || !title) return;
    try {
      await reminders.create(
        { aziendaId: azienda.id, titolo: title, dueAt: dueDate },
        { aziendaNome: azienda.nome },
        user
      );
      notify("Promemoria creato", "success");
    } catch {
      // reminder creation is best-effort
    }
  }

  async function submit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!user) return;
    setGlobalError(null);
    const input = buildInput();
    if (!input) return;
    const azienda = aziende.find((a) => a.id === input.aziendaId);
    const tipo = tipi.find((tp) => tp.id === input.tipoId);
    if (!azienda || !tipo) {
      setGlobalError(t.erroreSalvataggio);
      return;
    }
    setBusy(true);
    try {
      const denorm = { aziendaNome: azienda.nome, tipoNome: tipo.nome };
      if (isEdit && id) {
        await repo.update(id, input, denorm, user);
        notify("Attività aggiornata", "success");
      } else {
        await repo.create(input, denorm, user);
        notify("Attività registrata", "success");
        await maybeCreateReminder(azienda);
      }
      navigate("/attivita");
    } catch {
      setGlobalError(t.erroreSalvataggio);
      notify(t.erroreSalvataggio, "error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteEntry(): Promise<void> {
    if (!isEdit || !id || !user) return;
    setBusy(true);
    try {
      await repo.softDelete(id, user);
      navigate("/attivita");
    } catch {
      setGlobalError(t.erroreSalvataggio);
      setBusy(false);
    }
  }

  return {
    busy,
    errors,
    globalError,
    submit,
    deleteEntry,
    clearFieldError,
  };
}

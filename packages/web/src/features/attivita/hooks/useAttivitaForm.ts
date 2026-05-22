import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  attivitaInputSchema,
  type ActivityType,
  type ActorContext,
  type Attivita,
  type AttivitaInput,
  type Azienda,
} from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useToast } from "../../../shared/ui";
import { useCreateReminder } from "../../reminders/hooks/useReminders";
import { attivitaI18n as t } from "../i18n";
import { dateInputValue, parseDateInput } from "../lib/format";
import {
  useCreateAttivita,
  useSoftDeleteAttivita,
  useUpdateAttivita,
} from "./useAttivita";
import type { AttivitaFormState } from "../ui/AttivitaFormFields";

interface UseAttivitaFormArgs {
  id: string | undefined;
  user: ActorContext | null;
  aziende: ReadonlyArray<Azienda>;
  tipi: ReadonlyArray<ActivityType>;
}

type FieldErrors = Partial<Record<keyof AttivitaFormState, string>>;

export interface UseAttivitaFormResult {
  isEdit: boolean;
  initialLoading: boolean;
  loaded: Attivita | null;
  form: AttivitaFormState;
  setForm: React.Dispatch<React.SetStateAction<AttivitaFormState>>;
  update: <K extends keyof AttivitaFormState>(
    key: K,
    value: AttivitaFormState[K]
  ) => void;
  errors: FieldErrors;
  globalError: string | null;
  busy: boolean;
  submit: (e: FormEvent) => Promise<void>;
  remove: () => Promise<void>;
}

function emptyForm(presetDate: string | null): AttivitaFormState {
  return {
    data: presetDate ?? dateInputValue(new Date()),
    aziendaId: "",
    tipoId: "",
    oraria: false,
    tariffa: "",
    ore: "",
    note: "",
    reminderAt: "",
    reminderTitle: "",
  };
}

function formFromAttivita(a: Attivita, isEdit: boolean): AttivitaFormState {
  return {
    data: isEdit ? dateInputValue(a.data) : dateInputValue(new Date()),
    aziendaId: a.aziendaId,
    tipoId: a.tipoId,
    oraria: a.oraria,
    tariffa: String(a.tariffa),
    ore: a.ore !== undefined ? String(a.ore) : "",
    note: isEdit ? a.note ?? "" : "",
    reminderAt: "",
    reminderTitle: "",
  };
}

export function useAttivitaForm({
  id,
  user,
  aziende,
  tipi,
}: UseAttivitaFormArgs): UseAttivitaFormResult {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const cloneId = params.get("clone");
  const presetDate = params.get("data");
  const isEdit = id !== undefined;
  const targetId = id ?? cloneId;
  const { attivita: repo } = useRepositories();
  const { notify } = useToast();
  const createMutation = useCreateAttivita();
  const updateMutation = useUpdateAttivita();
  const deleteMutation = useSoftDeleteAttivita();
  const createReminder = useCreateReminder();

  const [form, setForm] = useState<AttivitaFormState>(() => emptyForm(presetDate));
  const [loaded, setLoaded] = useState<Attivita | null>(null);
  const [initialLoading, setInitialLoading] = useState<boolean>(
    isEdit || cloneId !== null
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const busy =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  useEffect(() => {
    if (!targetId) return;
    let cancelled = false;
    void (async () => {
      const a = await repo.getById(targetId);
      if (cancelled) return;
      if (!a) {
        navigate("/attivita", { replace: true });
        return;
      }
      if (isEdit) setLoaded(a);
      setForm(formFromAttivita(a, isEdit));
      setInitialLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [targetId, isEdit, navigate, repo]);

  const update = useCallback(
    <K extends keyof AttivitaFormState>(key: K, value: AttivitaFormState[K]) => {
      setForm((s) => ({ ...s, [key]: value }));
      setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    },
    []
  );

  const buildInput = useCallback((): AttivitaInput | null => {
    const date = parseDateInput(form.data);
    if (!date) {
      setErrors((prev) => ({ ...prev, data: "Data non valida" }));
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
  }, [form]);

  const maybeCreateReminder = useCallback(
    async (azienda: Azienda): Promise<void> => {
      if (!user) return;
      const dueDate = parseDateInput(form.reminderAt);
      const title = form.reminderTitle.trim();
      if (!dueDate || !title) return;
      try {
        await createReminder.mutateAsync({
          input: { aziendaId: azienda.id, titolo: title, dueAt: dueDate },
          denorm: { aziendaNome: azienda.nome },
          actor: user,
        });
        notify("Promemoria creato", "success");
      } catch {
        void 0;
      }
    },
    [user, form.reminderAt, form.reminderTitle, createReminder, notify]
  );

  const submit = useCallback(
    async (e: FormEvent): Promise<void> => {
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
      const denorm = { aziendaNome: azienda.nome, tipoNome: tipo.nome };
      try {
        if (isEdit && id) {
          await updateMutation.mutateAsync({ id, input, denorm, actor: user });
          notify("Attività aggiornata", "success");
        } else {
          await createMutation.mutateAsync({ input, denorm, actor: user });
          notify("Attività registrata", "success");
          await maybeCreateReminder(azienda);
        }
        navigate("/attivita");
      } catch {
        setGlobalError(t.erroreSalvataggio);
        notify(t.erroreSalvataggio, "error");
      }
    },
    [
      user,
      buildInput,
      aziende,
      tipi,
      isEdit,
      id,
      updateMutation,
      createMutation,
      notify,
      maybeCreateReminder,
      navigate,
    ]
  );

  const remove = useCallback(async (): Promise<void> => {
    if (!isEdit || !id || !user) return;
    try {
      await deleteMutation.mutateAsync({ id, actor: user });
      navigate("/attivita");
    } catch {
      setGlobalError(t.erroreSalvataggio);
    }
  }, [isEdit, id, user, deleteMutation, navigate]);

  return {
    isEdit,
    initialLoading,
    loaded,
    form,
    setForm,
    update,
    errors,
    globalError,
    busy,
    submit,
    remove,
  };
}

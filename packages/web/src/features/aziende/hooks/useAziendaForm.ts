import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  normalizeAziendaNome,
  type ActorContext,
  type AziendaInput,
  type AziendeRepository,
} from "@vet/shared";
import { useToast } from "../../../shared/ui";
import { aziendeI18n as t } from "../i18n";
import { emptyAziendaForm, type AziendaFormState } from "../ui/AziendaFormFields";
import {
  formFromAzienda,
  parseAziendaForm,
  type FieldErrors,
  type UseAziendaFormResult,
} from "./aziendaForm";
import {
  useAzienda,
  useCreateAzienda,
  useDeleteAzienda,
  useUpdateAzienda,
} from "./useAziende";

interface UseAziendaFormArgs {
  id: string | undefined;
  user: ActorContext | null;
  repo: AziendeRepository;
}

export type { UseAziendaFormResult } from "./aziendaForm";

export function useAziendaForm({
  id,
  user,
  repo,
}: UseAziendaFormArgs): UseAziendaFormResult {
  const navigate = useNavigate();
  const { notify } = useToast();
  const isEdit = id !== undefined;
  const azienda = useAzienda(id);
  const create = useCreateAzienda();
  const update = useUpdateAzienda();
  const del = useDeleteAzienda();
  const [form, setForm] = useState<AziendaFormState>(emptyAziendaForm);
  const [hydrated, setHydrated] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const loaded = azienda.data ?? null;

  useEffect(() => {
    if (!isEdit) return;
    if (hydrated) return;
    if (azienda.isSuccess && loaded === null) {
      navigate("/aziende", { replace: true });
      return;
    }
    if (!loaded) return;
    setForm(formFromAzienda(loaded));
    setHydrated(true);
  }, [isEdit, hydrated, loaded, azienda.isSuccess, navigate]);

  function clearFieldError(key: keyof AziendaFormState): void {
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  function updateField<K extends keyof AziendaFormState>(
    key: K,
    value: AziendaFormState[K]
  ): void {
    setForm((s) => ({ ...s, [key]: value }));
    clearFieldError(key);
  }

  async function ensureUnique(input: AziendaInput): Promise<boolean> {
    const norm = normalizeAziendaNome(input.nome);
    if (isEdit && loaded && loaded.nomeNorm === norm) return true;
    const existing = await repo.findByNomeNorm(norm);
    if (existing && existing.id !== id) {
      setErrors({ nome: t.erroreNomeDuplicato });
      return false;
    }
    return true;
  }

  async function submit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!user) return;
    setGlobalError(null);
    const parsed = parseAziendaForm(form);
    if (parsed.input === null) {
      setErrors(parsed.errors);
      return;
    }
    try {
      if (!(await ensureUnique(parsed.input))) return;
      if (isEdit && id) {
        await update.mutateAsync({ id, input: parsed.input, actor: user });
        notify("Azienda aggiornata", "success");
      } else {
        await create.mutateAsync({ input: parsed.input, actor: user });
        notify("Azienda creata", "success");
      }
      navigate("/aziende");
    } catch {
      setGlobalError(t.erroreSalvataggio);
      notify(t.erroreSalvataggio, "error");
    }
  }

  async function deleteEntry(): Promise<void> {
    if (!isEdit || !id || !user) return;
    setGlobalError(null);
    try {
      await del.mutateAsync({ id, actor: user });
      notify("Azienda archiviata", "success");
      navigate("/aziende");
    } catch {
      setGlobalError(t.erroreSalvataggio);
    }
  }

  const loading = isEdit && azienda.isLoading;
  const busy = create.isPending || update.isPending || del.isPending;

  return {
    isEdit,
    form,
    loaded,
    loading,
    busy,
    errors,
    globalError,
    update: updateField,
    clearFieldError,
    submit,
    deleteEntry,
  };
}

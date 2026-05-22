import type { ActorContext, AziendeRepository } from "@vet/shared";
import type { AziendaFormState } from "../ui/AziendaFormFields";
import {
  useAziendaFormLoader,
  type AziendaFormLoaderResult,
} from "./useAziendaFormLoader";
import {
  useAziendaFormSubmit,
  type AziendaFormSubmitResult,
} from "./useAziendaFormSubmit";

interface UseAziendaFormArgs {
  id: string | undefined;
  user: ActorContext | null;
  repo: AziendeRepository;
}

export interface UseAziendaFormResult
  extends Omit<AziendaFormLoaderResult, "setForm">,
    AziendaFormSubmitResult {
  isEdit: boolean;
  update<K extends keyof AziendaFormState>(
    key: K,
    value: AziendaFormState[K]
  ): void;
}

export function useAziendaForm({
  id,
  user,
  repo,
}: UseAziendaFormArgs): UseAziendaFormResult {
  const isEdit = id !== undefined;
  const { form, setForm, loaded, loading } = useAziendaFormLoader({ id, repo });
  const submit = useAziendaFormSubmit({ isEdit, id, user, form, loaded, repo });

  function update<K extends keyof AziendaFormState>(
    key: K,
    value: AziendaFormState[K]
  ) {
    setForm((s) => ({ ...s, [key]: value }));
    submit.clearFieldError(key);
  }

  return {
    isEdit,
    form,
    loaded,
    loading,
    update,
    busy: submit.busy,
    errors: submit.errors,
    globalError: submit.globalError,
    submit: submit.submit,
    deleteEntry: submit.deleteEntry,
    clearFieldError: submit.clearFieldError,
  };
}

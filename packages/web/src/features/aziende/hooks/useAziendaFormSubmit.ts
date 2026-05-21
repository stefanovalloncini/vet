import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  aziendaInputSchema,
  normalizeAziendaNome,
  type ActorContext,
  type AziendaInput,
  type Azienda,
  type AziendeRepository,
} from "@vet/shared";
import { useToast } from "../../../shared/ui";
import { aziendeI18n as t } from "../i18n";
import type { AziendaFormState } from "../ui/AziendaFormFields";

interface UseAziendaFormSubmitArgs {
  isEdit: boolean;
  id: string | undefined;
  user: ActorContext | null;
  form: AziendaFormState;
  loaded: Azienda | null;
  repo: AziendeRepository;
}

type FieldErrors = Partial<Record<keyof AziendaFormState, string>>;

export interface AziendaFormSubmitResult {
  busy: boolean;
  errors: FieldErrors;
  globalError: string | null;
  submit: (e: FormEvent) => Promise<void>;
  deleteEntry: () => Promise<void>;
  clearFieldError: (key: keyof AziendaFormState) => void;
}

export function useAziendaFormSubmit({
  isEdit,
  id,
  user,
  form,
  loaded,
  repo,
}: UseAziendaFormSubmitArgs): AziendaFormSubmitResult {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  function clearFieldError(key: keyof AziendaFormState): void {
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  function buildInput(): AziendaInput | null {
    const indirizzo = form.indirizzo.trim();
    const telefono = form.telefono.trim();
    const piva = form.piva.trim();
    const emailFatturazione = form.emailFatturazione.trim();
    const numeroCapiStr = form.numeroCapi.trim();
    const note = form.note.trim();
    const parsed = aziendaInputSchema.safeParse({
      nome: form.nome,
      ...(indirizzo ? { indirizzo } : {}),
      ...(telefono ? { telefono } : {}),
      ...(piva ? { piva } : {}),
      ...(emailFatturazione ? { emailFatturazione } : {}),
      ...(form.cadenzaFatturazione
        ? { cadenzaFatturazione: form.cadenzaFatturazione }
        : {}),
      ...(form.tipoAllevamento ? { tipoAllevamento: form.tipoAllevamento } : {}),
      ...(numeroCapiStr ? { numeroCapi: Number(numeroCapiStr) } : {}),
      ...(note ? { note } : {}),
    });
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as keyof AziendaFormState;
        if (path === "piva") fieldErrors.piva = t.errorePivaNonValida;
        else if (path === "emailFatturazione")
          fieldErrors.emailFatturazione = t.erroreEmailNonValida;
        else if (path && !fieldErrors[path]) fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return null;
    }
    return parsed.data;
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
    setBusy(true);
    setGlobalError(null);
    try {
      const input = buildInput();
      if (!input) return;
      if (!(await ensureUnique(input))) return;
      if (isEdit && id) {
        await repo.update(id, input, user);
        notify("Azienda aggiornata", "success");
      } else {
        await repo.create(input, user);
        notify("Azienda creata", "success");
      }
      navigate("/aziende");
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
    setGlobalError(null);
    try {
      await repo.softDelete(id, user);
      notify("Azienda archiviata", "success");
      navigate("/aziende");
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

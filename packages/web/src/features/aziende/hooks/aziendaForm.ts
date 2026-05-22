import type { FormEvent } from "react";
import {
  aziendaInputSchema,
  type Azienda,
  type AziendaInput,
} from "@vet/shared";
import { aziendeI18n as t } from "../i18n";
import type { AziendaFormState } from "../ui/AziendaFormFields";

export type FieldErrors = Partial<Record<keyof AziendaFormState, string>>;

export interface UseAziendaFormResult {
  isEdit: boolean;
  form: AziendaFormState;
  loaded: Azienda | null;
  loading: boolean;
  busy: boolean;
  errors: FieldErrors;
  globalError: string | null;
  update<K extends keyof AziendaFormState>(
    key: K,
    value: AziendaFormState[K]
  ): void;
  clearFieldError: (key: keyof AziendaFormState) => void;
  submit: (e: FormEvent) => Promise<void>;
  deleteEntry: () => Promise<void>;
}

export function formFromAzienda(a: Azienda): AziendaFormState {
  return {
    nome: a.nome,
    indirizzo: a.indirizzo ?? "",
    telefono: a.telefono ?? "",
    piva: a.piva ?? "",
    emailFatturazione: a.emailFatturazione ?? "",
    cadenzaFatturazione: a.cadenzaFatturazione ?? "",
    tipoAllevamento: a.tipoAllevamento ?? "",
    numeroCapi: a.numeroCapi !== undefined ? String(a.numeroCapi) : "",
    note: a.note ?? "",
  };
}

type ParseResult =
  | { input: AziendaInput; errors: null }
  | { input: null; errors: FieldErrors };

export function parseAziendaForm(form: AziendaFormState): ParseResult {
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
    const errors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0] as keyof AziendaFormState;
      if (path === "piva") errors.piva = t.errorePivaNonValida;
      else if (path === "emailFatturazione")
        errors.emailFatturazione = t.erroreEmailNonValida;
      else if (path && !errors[path]) errors[path] = issue.message;
    }
    return { input: null, errors };
  }
  return { input: parsed.data, errors: null };
}

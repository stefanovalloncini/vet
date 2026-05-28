import { z } from "zod";
import {
  CADENZA_FATTURAZIONE,
  TIPI_ALLEVAMENTO,
  isValidPartitaIva,
  type Azienda,
  type AziendaInput,
  type CadenzaFatturazione,
  type TipoAllevamento,
} from "@vet/shared";
import { aziendeI18n as t } from "../i18n";

const CADENZA_WITH_EMPTY = ["", ...CADENZA_FATTURAZIONE] as const;
const TIPO_WITH_EMPTY = ["", ...TIPI_ALLEVAMENTO] as const;

const numeroCapiSchema = z.string().refine(
  (v) => {
    const s = v.trim();
    if (s === "") return true;
    const n = Number(s);
    return Number.isInteger(n) && n >= 0 && n <= 100_000;
  },
  { message: "Numero non valido" }
);

const canoneFormSchema = z.string().refine(
  (v) => {
    const s = v.trim();
    if (s === "") return true;
    const n = Number(s);
    return (
      Number.isFinite(n) && n > 0 && n <= 100_000 && Math.round(n * 100) === n * 100
    );
  },
  { message: "Canone non valido" }
);

const pivaFormSchema = z.string().max(13).refine(
  (v) => v.trim() === "" || isValidPartitaIva(v.trim().replace(/^IT/i, "")),
  { message: t.errorePivaNonValida }
);

const emailFormSchema = z.string().max(120).refine(
  (v) => v.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  { message: t.erroreEmailNonValida }
);

export const aziendaFormSchema = z.object({
  nome: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "Campo obbligatorio").max(200)),
  indirizzo: z.string().max(300),
  telefono: z.string().max(40),
  piva: pivaFormSchema,
  emailFatturazione: emailFormSchema,
  cadenzaFatturazione: z.enum(CADENZA_WITH_EMPTY),
  tipoAllevamento: z.enum(TIPO_WITH_EMPTY),
  numeroCapi: numeroCapiSchema,
  note: z.string().max(1000),
  armadiettoCanoneAnnuo: canoneFormSchema,
});

export type AziendaFormValues = z.infer<typeof aziendaFormSchema>;

export const emptyAziendaForm: AziendaFormValues = {
  nome: "",
  indirizzo: "",
  telefono: "",
  piva: "",
  emailFatturazione: "",
  cadenzaFatturazione: "",
  tipoAllevamento: "",
  numeroCapi: "",
  note: "",
  armadiettoCanoneAnnuo: "",
};

export function formFromAzienda(a: Azienda): AziendaFormValues {
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
    armadiettoCanoneAnnuo:
      a.armadiettoCanoneAnnuo !== undefined
        ? String(a.armadiettoCanoneAnnuo)
        : "",
  };
}

export function formToAziendaInput(values: AziendaFormValues): AziendaInput {
  const indirizzo = values.indirizzo.trim();
  const telefono = values.telefono.trim();
  const piva = values.piva.trim().replace(/^IT/i, "");
  const email = values.emailFatturazione.trim();
  const capi = values.numeroCapi.trim();
  const note = values.note.trim();
  const canone = values.armadiettoCanoneAnnuo.trim();
  return {
    nome: values.nome.trim(),
    ...(indirizzo ? { indirizzo } : {}),
    ...(telefono ? { telefono } : {}),
    ...(piva ? { piva } : {}),
    ...(email ? { emailFatturazione: email } : {}),
    ...(values.cadenzaFatturazione
      ? { cadenzaFatturazione: values.cadenzaFatturazione as CadenzaFatturazione }
      : {}),
    ...(values.tipoAllevamento
      ? { tipoAllevamento: values.tipoAllevamento as TipoAllevamento }
      : {}),
    ...(capi ? { numeroCapi: Number(capi) } : {}),
    ...(note ? { note } : {}),
    ...(canone ? { armadiettoCanoneAnnuo: Number(canone) } : {}),
  };
}

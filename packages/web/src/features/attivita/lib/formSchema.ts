import { z } from "zod";
import {
  attivitaInputSchema,
  type Attivita,
  type AttivitaInput,
} from "@vet/shared";
import { dateInputValue, parseDateInput } from "../../../shared/lib/format";

export const attivitaFormSchema = z
  .object({
    data: z.string().min(1, "Data obbligatoria"),
    aziendaId: z.string().min(1, "Scegli un'azienda"),
    tipoId: z.string().min(1, "Scegli un tipo"),
    oraria: z.boolean(),
    adElemento: z.boolean(),
    tariffa: z.string().min(1, "Tariffa obbligatoria"),
    ore: z.string(),
    elementi: z.string(),
    note: z.string().max(2000),
    reminderAt: z.string(),
    reminderTitle: z.string().max(120),
  })
  .superRefine((val, ctx) => {
    const date = parseDateInput(val.data);
    if (!date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["data"],
        message: "Data non valida",
      });
    }
    const tariffaNum = Number(val.tariffa);
    if (!Number.isFinite(tariffaNum) || tariffaNum <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tariffa"],
        message: "Tariffa non valida",
      });
    }
    if (val.oraria && val.adElemento) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["adElemento"],
        message: "Scegli oraria o ad elemento, non entrambi",
      });
    }
    if (val.oraria) {
      const oreNum = Number(val.ore);
      if (!val.ore || !Number.isFinite(oreNum) || oreNum <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ore"],
          message: "Ore obbligatorie",
        });
      }
    }
    if (val.adElemento) {
      const elNum = Number(val.elementi);
      if (
        !val.elementi ||
        !Number.isFinite(elNum) ||
        elNum <= 0 ||
        !Number.isInteger(elNum)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["elementi"],
          message: "Numero elementi non valido",
        });
      }
    }
  });

export type AttivitaFormValues = z.infer<typeof attivitaFormSchema>;

export function emptyFormValues(presetDate?: string | null): AttivitaFormValues {
  return {
    data: presetDate ?? dateInputValue(new Date()),
    aziendaId: "",
    tipoId: "",
    oraria: false,
    adElemento: false,
    tariffa: "",
    ore: "",
    elementi: "",
    note: "",
    reminderAt: "",
    reminderTitle: "",
  };
}

export function attivitaToFormValues(
  a: Attivita,
  isEdit: boolean
): AttivitaFormValues {
  return {
    data: isEdit ? dateInputValue(a.data) : dateInputValue(new Date()),
    aziendaId: a.aziendaId,
    tipoId: a.tipoId,
    oraria: a.oraria,
    adElemento: a.adElemento,
    tariffa: String(a.tariffa),
    ore: a.ore !== undefined ? String(a.ore) : "",
    elementi: a.elementi !== undefined ? String(a.elementi) : "",
    note: isEdit ? a.note ?? "" : "",
    reminderAt: "",
    reminderTitle: "",
  };
}

export function formValuesToInput(values: AttivitaFormValues): AttivitaInput {
  const date = parseDateInput(values.data);
  if (!date) throw new Error("invalid-date");
  const note = values.note.trim();
  return attivitaInputSchema.parse({
    data: date,
    aziendaId: values.aziendaId,
    tipoId: values.tipoId,
    oraria: values.oraria,
    adElemento: values.adElemento,
    tariffa: Number(values.tariffa),
    ...(values.oraria ? { ore: Number(values.ore) } : {}),
    ...(values.adElemento ? { elementi: Number(values.elementi) } : {}),
    ...(note ? { note } : {}),
  });
}

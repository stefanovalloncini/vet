import { z } from "zod";
import { ALTRO_TIPO_ID, hasAtMostTwoDecimals, modalitaSchema } from "@vet/shared";

const positiveNumberString = z.string().superRefine((value, ctx) => {
  if (value.trim() === "") return;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Valore non valido",
    });
  }
});

export const quickEntryFormSchema = z
  .object({
    data: z.string().min(1, "Data obbligatoria"),
    aziendaId: z.string().min(1, "Scegli un'azienda"),
    tipoId: z.string().min(1, "Scegli un tipo"),
    modalita: modalitaSchema,
    tariffa: z
      .string()
      .min(1, "Tariffa obbligatoria")
      .superRefine((value, ctx) => {
        const num = Number(value);
        if (
          !Number.isFinite(num) ||
          num <= 0 ||
          num > 100_000 ||
          !hasAtMostTwoDecimals(num)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Tariffa non valida",
          });
        }
      }),
    ore: positiveNumberString,
    elementi: positiveNumberString,
    note: z.string().max(2000),
  })
  .superRefine((val, ctx) => {
    if (val.modalita === "oraria") {
      const oreNum = Number(val.ore);
      if (!val.ore.trim() || !Number.isFinite(oreNum) || oreNum <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ore"],
          message: "Ore obbligatorie",
        });
      }
    }
    if (val.modalita === "adElemento") {
      const elNum = Number(val.elementi);
      if (
        !val.elementi.trim() ||
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
    if (val.tipoId === ALTRO_TIPO_ID && val.note.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["note"],
        message: "La nota è obbligatoria per il tipo Altro",
      });
    }
  });

export type QuickEntryFormValues = z.infer<typeof quickEntryFormSchema>;

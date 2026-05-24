import { z } from "zod";
import { safeName } from "./safeString.js";

function hasAtMostTwoDecimals(n: number): boolean {
  return Math.round(n * 100) === n * 100;
}

const tariffaSchema = z
  .number()
  .positive()
  .max(100_000)
  .refine(hasAtMostTwoDecimals, { message: "Massimo 2 decimali" });

const oreSchema = z.number().positive().max(24);

const inputBase = z.object({
  data: z.date(),
  aziendaId: z.string().min(1).max(64),
  tipoId: z.string().min(1).max(64),
  oraria: z.boolean(),
  tariffa: tariffaSchema,
  ore: oreSchema.optional(),
  note: z.string().max(2000).optional(),
});

export const ALTRO_TIPO_ID = "altro";

export const attivitaInputSchema = inputBase.strict().superRefine((val, ctx) => {
  if (val.oraria && val.ore === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ore"],
      message: "Le ore sono obbligatorie quando oraria=true",
    });
  }
  if (!val.oraria && val.ore !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ore"],
      message: "Le ore non vanno indicate quando oraria=false",
    });
  }
  if (val.tipoId === ALTRO_TIPO_ID && (val.note === undefined || val.note.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["note"],
      message: "La nota è obbligatoria per il tipo 'Altro'",
    });
  }
});

export const attivitaDocSchema = z
  .object({
    data: z.date(),
    aziendaId: z.string().min(1).max(64),
    aziendaNome: z.string().min(1).max(200),
    tipoId: z.string().min(1).max(64),
    tipoNome: z.string().min(1).max(80),
    oraria: z.boolean(),
    tariffa: tariffaSchema,
    ore: oreSchema.optional(),
    totale: z.number().nonnegative().max(2_400_000),
    note: z.string().max(2000).optional(),
    ownerUid: z.string().min(1).max(128),
    ownerEmail: z.string().email().max(120),
    ownerName: safeName(80),
    createdAt: z.date(),
    updatedAt: z.date(),
    isDeleted: z.boolean(),
    deletedAt: z.date().optional(),
    deletedBy: z.string().min(1).max(128).optional(),
    updatedBy: z.string().min(1).max(128).optional(),
    updatedByName: safeName(80).optional(),
    schemaVersion: z.literal(1),
  })
  .strict();

export type AttivitaInput = z.infer<typeof attivitaInputSchema>;
export type AttivitaDoc = z.infer<typeof attivitaDocSchema>;

export function computeTotale(input: {
  oraria: boolean;
  tariffa: number;
  ore?: number | undefined;
}): number {
  const raw = input.oraria && input.ore !== undefined
    ? input.tariffa * input.ore
    : input.tariffa;
  return Math.round(raw * 100) / 100;
}

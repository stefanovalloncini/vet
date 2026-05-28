import { z } from "zod";
import { euroAmountSchema } from "./money.js";
import { safeEmail, safeName } from "./safeString.js";

export const CADENZA_FATTURAZIONE = ["monthly", "quarterly", "semiannual"] as const;
export type CadenzaFatturazione = (typeof CADENZA_FATTURAZIONE)[number];
export const cadenzaFatturazioneSchema = z.enum(CADENZA_FATTURAZIONE);

export function normalizeAziendaNome(nome: string): string {
  return nome.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isValidPartitaIva(piva: string): boolean {
  if (!/^\d{11}$/.test(piva)) return false;
  if (piva === "00000000000") return false;
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = Number(piva[i]);
    if (i % 2 === 0) {
      sum += digit;
    } else {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    }
  }
  return sum % 10 === 0;
}

const pivaSchema = z
  .string()
  .transform((s) => s.trim().replace(/^IT/i, ""))
  .refine(isValidPartitaIva, { message: "P.IVA non valida" });

const nomeSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(1).max(200));

export const TIPI_ALLEVAMENTO = [
  "bovini",
  "ovini",
  "caprini",
  "suini",
  "avicoli",
  "equini",
  "misto",
  "altro",
] as const;
export type TipoAllevamento = (typeof TIPI_ALLEVAMENTO)[number];
export const tipoAllevamentoSchema = z.enum(TIPI_ALLEVAMENTO);

export const aziendaInputSchema = z
  .object({
    nome: nomeSchema,
    indirizzo: z.string().max(300).optional(),
    piva: pivaSchema.optional(),
    emailFatturazione: safeEmail(120).optional(),
    cadenzaFatturazione: cadenzaFatturazioneSchema.optional(),
    tipoAllevamento: tipoAllevamentoSchema.optional(),
    numeroCapi: z.number().int().nonnegative().max(100_000).optional(),
    telefono: z.string().max(40).optional(),
    note: z.string().max(1000).optional(),
    armadiettoCanoneAnnuo: euroAmountSchema.optional(),
  })
  .strict();

export const aziendaDocSchema = z
  .object({
    nome: z.string().min(1).max(200),
    nomeNorm: z.string().min(1).max(200),
    indirizzo: z.string().max(300).optional(),
    piva: z.string().regex(/^\d{11}$/).optional(),
    emailFatturazione: safeEmail(120).optional(),
    cadenzaFatturazione: cadenzaFatturazioneSchema.optional(),
    tipoAllevamento: tipoAllevamentoSchema.optional(),
    numeroCapi: z.number().int().nonnegative().max(100_000).optional(),
    telefono: z.string().max(40).optional(),
    note: z.string().max(1000).optional(),
    armadiettoCanoneAnnuo: euroAmountSchema.optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    createdBy: z.string().min(1).max(128),
    updatedBy: z.string().min(1).max(128),
    createdByName: safeName(80),
    updatedByName: safeName(80),
    isDeleted: z.boolean(),
    deletedAt: z.date().optional(),
    schemaVersion: z.literal(1),
  })
  .strict();

export type AziendaInput = z.infer<typeof aziendaInputSchema>;
export type AziendaDoc = z.infer<typeof aziendaDocSchema>;

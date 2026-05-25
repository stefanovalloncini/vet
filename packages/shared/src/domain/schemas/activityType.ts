import { z } from "zod";

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const nomeSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(1).max(80));

export const modalitaSchema = z.enum(["fissa", "oraria", "adElemento"]);
export type Modalita = z.infer<typeof modalitaSchema>;

export const activityTypeInputSchema = z
  .object({
    nome: nomeSchema,
    ordine: z.number().int().min(0).max(1000),
    attivo: z.boolean().default(true),
    tariffaStandard: z.number().min(0).max(100000).optional(),
    modalitaDefault: modalitaSchema.optional(),
  })
  .strict();

export const activityTypeDocSchema = z
  .object({
    nome: z.string().min(1).max(80),
    ordine: z.number().int().min(0).max(1000),
    attivo: z.boolean(),
    tariffaStandard: z.number().min(0).max(100000).optional(),
    modalitaDefault: modalitaSchema.optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    schemaVersion: z.literal(1),
  })
  .strict();

export type ActivityTypeInput = z.infer<typeof activityTypeInputSchema>;
export type ActivityTypeDoc = z.infer<typeof activityTypeDocSchema>;

export const GINECOLOGIA_TIPO_ID = "ginecologia";
export const ALTRO_TIPO_ID = "altro";

export const ACTIVITY_TYPE_SEEDS: ReadonlyArray<{
  id: string;
  nome: string;
  ordine: number;
  tariffaStandard?: number;
  modalitaDefault?: Modalita;
}> = [
  { id: GINECOLOGIA_TIPO_ID, nome: "Ginecologia", ordine: 1 },
];

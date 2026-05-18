import { z } from "zod";

export function slugifyActivityType(nome: string): string {
  return nome
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

export const activityTypeInputSchema = z
  .object({
    nome: nomeSchema,
    ordine: z.number().int().min(0).max(1000),
    attivo: z.boolean().default(true),
  })
  .strict();

export const activityTypeDocSchema = z
  .object({
    nome: z.string().min(1).max(80),
    ordine: z.number().int().min(0).max(1000),
    attivo: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
    schemaVersion: z.literal(1),
  })
  .strict();

export type ActivityTypeInput = z.infer<typeof activityTypeInputSchema>;
export type ActivityTypeDoc = z.infer<typeof activityTypeDocSchema>;

export const GINECOLOGIA_TIPO_ID = "ginecologia";

export const ACTIVITY_TYPE_SEEDS: ReadonlyArray<{
  id: string;
  nome: string;
  ordine: number;
}> = [
  { id: "visita", nome: "Visita", ordine: 10 },
  { id: "visita-di-controllo", nome: "Visita di controllo", ordine: 20 },
  { id: "vaccinazione", nome: "Vaccinazione", ordine: 30 },
  { id: "profilassi", nome: "Profilassi", ordine: 40 },
  { id: "ginecologia", nome: "Ginecologia", ordine: 50 },
  { id: "ecografia", nome: "Ecografia", ordine: 60 },
  { id: "chirurgia", nome: "Chirurgia", ordine: 70 },
  { id: "emergenza", nome: "Emergenza", ordine: 80 },
  { id: "altro", nome: "Altro", ordine: 99 },
];

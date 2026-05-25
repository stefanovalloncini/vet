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
  { id: "ginecologia", nome: "Ginecologia", ordine: 1 },
  { id: "dislocazione-abomasale-sx", nome: "Dislocazione abomasale sx", ordine: 10, tariffaStandard: 200 },
  { id: "dislocazione-abomasale-dx", nome: "Dislocazione abomasale dx", ordine: 20, tariffaStandard: 200 },
  { id: "ecografie-polmonari", nome: "Ecografie polmonari", ordine: 30, tariffaStandard: 150, modalitaDefault: "oraria" },
  { id: "ecografia", nome: "Ecografia", ordine: 40 },
  { id: "campioni-sangue", nome: "Campioni sangue", ordine: 50, tariffaStandard: 2, modalitaDefault: "adElemento" },
  { id: "chirurgia", nome: "Chirurgia", ordine: 60 },
  { id: "emergenza", nome: "Emergenza", ordine: 70 },
  { id: "eutanasia-vacca", nome: "Eutanasia vacca", ordine: 80, tariffaStandard: 100 },
  { id: "eutanasia-vitello", nome: "Eutanasia vitello", ordine: 90, tariffaStandard: 50 },
  { id: "flebo", nome: "Flebo", ordine: 100, tariffaStandard: 70 },
  { id: "profilassi", nome: "Profilassi", ordine: 110 },
  { id: "vaccinazione", nome: "Vaccinazione", ordine: 120 },
  { id: "visita", nome: "Visita", ordine: 130 },
  { id: "visita-clinica", nome: "Visita clinica", ordine: 140, tariffaStandard: 70 },
  { id: "visita-di-controllo", nome: "Visita di controllo", ordine: 150 },
  { id: "altro", nome: "Altro", ordine: 999 },
];

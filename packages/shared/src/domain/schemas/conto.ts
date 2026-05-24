import { z } from "zod";
import { metodoPagamentoSchema } from "./payment.js";
import { safeName } from "./safeString.js";

export const CONTO_MODALITA = ["proforma", "emesso"] as const;
export type ContoModalita = (typeof CONTO_MODALITA)[number];
export const contoModalitaSchema = z.enum(CONTO_MODALITA);

const totaleSchema = z
  .number()
  .nonnegative()
  .max(2_400_000);

export const contoEmitInputSchema = z
  .object({
    aziendaId: z.string().min(1).max(64),
    periodoFrom: z.date(),
    periodoTo: z.date(),
    modalita: contoModalitaSchema,
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.periodoTo.getTime() < val.periodoFrom.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["periodoTo"],
        message: "Il periodo finale deve essere dopo l'iniziale",
      });
    }
  });

export const contoSaldoInputSchema = z
  .object({
    contoId: z.string().min(1).max(64),
    importoSaldato: z.number().nonnegative().max(1_000_000).optional(),
    metodoPagamento: metodoPagamentoSchema.optional(),
    note: z.string().max(500).optional(),
  })
  .strict();

export const contoDocSchema = z
  .object({
    aziendaId: z.string().min(1).max(64),
    aziendaNome: z.string().min(1).max(200),
    periodoFrom: z.date(),
    periodoTo: z.date(),
    attivitaIds: z.array(z.string().min(1).max(64)).max(10_000),
    totaleConto: totaleSchema,
    modalita: contoModalitaSchema,
    saldato: z.boolean(),
    emittedAt: z.date(),
    emittedBy: z.string().min(1).max(128),
    emittedByName: safeName(80),
    saldatoAt: z.date().optional(),
    saldatoBy: z.string().min(1).max(128).optional(),
    saldatoByName: safeName(80).optional(),
    importoSaldato: z.number().nonnegative().max(1_000_000).optional(),
    metodoPagamento: metodoPagamentoSchema.optional(),
    note: z.string().max(500).optional(),
    isDeleted: z.boolean(),
    deletedAt: z.date().optional(),
    deletedBy: z.string().min(1).max(128).optional(),
    schemaVersion: z.literal(1),
  })
  .strict();

export type ContoEmitInput = z.infer<typeof contoEmitInputSchema>;
export type ContoSaldoInput = z.infer<typeof contoSaldoInputSchema>;
export type ContoDoc = z.infer<typeof contoDocSchema>;

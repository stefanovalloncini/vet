import { z } from "zod";

export const METODI_PAGAMENTO = ["bonifico", "contanti", "altro"] as const;
export type MetodoPagamento = (typeof METODI_PAGAMENTO)[number];
export const metodoPagamentoSchema = z.enum(METODI_PAGAMENTO);

export const paymentInputSchema = z
  .object({
    aziendaId: z.string().min(1),
    periodoFinoA: z.date(),
    importoPagato: z.number().nonnegative().max(1_000_000).optional(),
    metodoPagamento: metodoPagamentoSchema.optional(),
    note: z.string().max(500).optional(),
  })
  .strict();

export const paymentDocSchema = z
  .object({
    aziendaId: z.string().min(1),
    aziendaNome: z.string().min(1).max(200),
    periodoFinoA: z.date(),
    importoPagato: z.number().nonnegative().max(1_000_000).optional(),
    metodoPagamento: metodoPagamentoSchema.optional(),
    note: z.string().max(500).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    createdBy: z.string().min(1),
    updatedBy: z.string().min(1),
    createdByName: z.string().min(1),
    updatedByName: z.string().min(1),
    schemaVersion: z.literal(1),
  })
  .strict();

export type PaymentInput = z.infer<typeof paymentInputSchema>;
export type PaymentDoc = z.infer<typeof paymentDocSchema>;

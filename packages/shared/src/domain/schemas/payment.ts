import { z } from "zod";
import { safeName } from "./safeString.js";
import { metodoPagamentoSchema } from "./money.js";

export {
  METODI_PAGAMENTO,
  metodoPagamentoSchema,
  type MetodoPagamento,
} from "./money.js";

export const paymentInputSchema = z
  .object({
    aziendaId: z.string().min(1).max(64),
    periodoFinoA: z.date(),
    importoPagato: z.number().nonnegative().max(1_000_000).optional(),
    metodoPagamento: metodoPagamentoSchema.optional(),
    note: z.string().max(500).optional(),
  })
  .strict();

export const paymentDocSchema = z
  .object({
    aziendaId: z.string().min(1).max(64),
    aziendaNome: z.string().min(1).max(200),
    periodoFinoA: z.date(),
    importoPagato: z.number().nonnegative().max(1_000_000).optional(),
    metodoPagamento: metodoPagamentoSchema.optional(),
    note: z.string().max(500).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    createdBy: z.string().min(1).max(128),
    updatedBy: z.string().min(1).max(128),
    createdByName: safeName(80),
    updatedByName: safeName(80),
    schemaVersion: z.literal(1),
  })
  .strict();

export type PaymentInput = z.infer<typeof paymentInputSchema>;
export type PaymentDoc = z.infer<typeof paymentDocSchema>;

import { z } from "zod";

export const METODI_PAGAMENTO = ["bonifico", "contanti", "altro"] as const;
export type MetodoPagamento = (typeof METODI_PAGAMENTO)[number];
export const metodoPagamentoSchema = z.enum(METODI_PAGAMENTO);

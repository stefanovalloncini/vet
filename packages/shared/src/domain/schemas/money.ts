import { z } from "zod";

export const METODI_PAGAMENTO = ["bonifico", "contanti", "altro"] as const;
export type MetodoPagamento = (typeof METODI_PAGAMENTO)[number];
export const metodoPagamentoSchema = z.enum(METODI_PAGAMENTO);

export function hasAtMostTwoDecimals(n: number): boolean {
  return Number(n.toFixed(2)) === n;
}

export const euroAmountSchema = z
  .number()
  .positive()
  .max(100_000)
  .refine(hasAtMostTwoDecimals, { message: "Massimo 2 decimali" });

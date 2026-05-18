import type { MetodoPagamento } from "../schemas/payment.js";

export interface Payment {
  id: string;
  aziendaId: string;
  aziendaNome: string;
  periodoFinoA: Date;
  importoPagato?: number;
  metodoPagamento?: MetodoPagamento;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  createdByName: string;
  updatedByName: string;
  schemaVersion: number;
}

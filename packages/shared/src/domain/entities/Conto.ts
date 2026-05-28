import type { MetodoPagamento } from "../schemas/money.js";

export interface Conto {
  id: string;
  aziendaId: string;
  aziendaNome: string;
  periodoFrom: Date;
  periodoTo: Date;
  attivitaIds: string[];
  totaleConto: number;
  armadiettoImporto?: number;
  modalita: "proforma" | "emesso";
  saldato: boolean;
  emittedAt: Date;
  emittedBy: string;
  emittedByName: string;
  saldatoAt?: Date;
  saldatoBy?: string;
  saldatoByName?: string;
  importoSaldato?: number;
  metodoPagamento?: MetodoPagamento;
  note?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  schemaVersion: number;
}

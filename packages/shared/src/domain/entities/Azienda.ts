import type { CadenzaFatturazione, TipoAllevamento } from "../schemas/azienda.js";

export interface Azienda {
  id: string;
  nome: string;
  nomeNorm: string;
  indirizzo?: string;
  piva?: string;
  emailFatturazione?: string;
  cadenzaFatturazione?: CadenzaFatturazione;
  tipoAllevamento?: TipoAllevamento;
  numeroCapi?: number;
  telefono?: string;
  note?: string;
  armadiettoCanoneAnnuo?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  createdByName: string;
  updatedByName: string;
  isDeleted: boolean;
  deletedAt?: Date;
  schemaVersion: number;
}

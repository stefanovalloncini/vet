import type { Modalita } from "../schemas/activityType.js";

export interface ActivityType {
  id: string;
  nome: string;
  ordine: number;
  attivo: boolean;
  tariffaStandard?: number;
  modalitaDefault?: Modalita;
  createdAt: Date;
  updatedAt: Date;
  schemaVersion: number;
}

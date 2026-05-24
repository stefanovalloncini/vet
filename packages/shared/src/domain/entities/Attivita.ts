export interface Attivita {
  id: string;
  data: Date;
  aziendaId: string;
  aziendaNome: string;
  tipoId: string;
  tipoNome: string;
  oraria: boolean;
  tariffa: number;
  ore?: number;
  totale: number;
  note?: string;
  ownerUid: string;
  ownerEmail: string;
  ownerName: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  updatedBy?: string;
  updatedByName?: string;
  schemaVersion: number;
}

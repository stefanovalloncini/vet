export interface ActivityType {
  id: string;
  nome: string;
  ordine: number;
  attivo: boolean;
  tariffaStandard?: number;
  createdAt: Date;
  updatedAt: Date;
  schemaVersion: number;
}

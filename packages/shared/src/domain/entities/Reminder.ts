export interface Reminder {
  id: string;
  aziendaId: string;
  aziendaNome: string;
  titolo: string;
  dueAt: Date;
  note?: string;
  done: boolean;
  doneAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  schemaVersion: number;
}

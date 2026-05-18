export interface TrashService {
  restoreAttivita(id: string): Promise<void>;
  purgeAttivita(id: string): Promise<void>;
  gdprDeleteMine(): Promise<{ attivita: number; userDoc: boolean }>;
}

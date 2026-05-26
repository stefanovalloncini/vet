import type { Conto } from "../entities/Conto.js";
import type {
  ContoEmitInput,
  ContoSaldoInput,
} from "../schemas/conto.js";
import type { ActorContext } from "../entities/ActorContext.js";

export interface ContiRepository {
  list(): Promise<Conto[]>;
  listForAzienda(aziendaId: string): Promise<Conto[]>;
  listUnsaldati(): Promise<Conto[]>;
  getById(id: string): Promise<Conto | null>;
  emit(
    input: ContoEmitInput,
    denorm: {
      aziendaNome: string;
      attivitaIds: string[];
      totaleConto: number;
    },
    actor: ActorContext
  ): Promise<string>;
  saldo(input: ContoSaldoInput, actor: ActorContext): Promise<void>;
  annulla(id: string, actor: ActorContext): Promise<void>;
  anonymizeOwnerReferences(
    ownerUid: string,
    args: { anonUid: string; anonName: string }
  ): Promise<number>;
}

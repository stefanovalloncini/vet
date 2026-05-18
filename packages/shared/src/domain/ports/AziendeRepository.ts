import type { Azienda } from "../entities/Azienda.js";
import type { AziendaInput } from "../schemas/azienda.js";
import type { ActorContext } from "../entities/ActorContext.js";

export interface AziendeRepository {
  list(): Promise<Azienda[]>;
  getById(id: string): Promise<Azienda | null>;
  findByNomeNorm(nomeNorm: string): Promise<Azienda | null>;
  create(input: AziendaInput, actor: ActorContext): Promise<string>;
  update(id: string, input: AziendaInput, actor: ActorContext): Promise<void>;
  softDelete(id: string, actor: ActorContext): Promise<void>;
}

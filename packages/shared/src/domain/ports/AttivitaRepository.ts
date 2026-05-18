import type { Attivita } from "../entities/Attivita.js";
import type { AttivitaInput } from "../schemas/attivita.js";
import type { ActorContext } from "../entities/ActorContext.js";

export interface AttivitaFilters {
  from?: Date;
  to?: Date;
  aziendaId?: string;
  tipoId?: string;
  ownerUid?: string;
}

export interface TrashFilters {
  ownerUid?: string;
}

export interface AttivitaRepository {
  list(filters?: AttivitaFilters): Promise<Attivita[]>;
  listDeleted(filters?: TrashFilters): Promise<Attivita[]>;
  getById(id: string): Promise<Attivita | null>;
  findLastByAziendaAndTipo(
    aziendaId: string,
    tipoId: string
  ): Promise<Attivita | null>;
  create(
    input: AttivitaInput,
    denorm: { aziendaNome: string; tipoNome: string },
    actor: ActorContext
  ): Promise<string>;
  update(
    id: string,
    input: AttivitaInput,
    denorm: { aziendaNome: string; tipoNome: string },
    actor: ActorContext
  ): Promise<void>;
  softDelete(id: string, actor: ActorContext): Promise<void>;
}

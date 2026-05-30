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
  ): Promise<Attivita>;
  update(
    id: string,
    input: AttivitaInput,
    denorm: { aziendaNome: string; tipoNome: string },
    actor: ActorContext
  ): Promise<void>;
  softDelete(id: string, actor: ActorContext): Promise<void>;
  /** Restore a previously soft-deleted attivita (clears isDeleted/deletedAt/deletedBy). */
  restore(id: string): Promise<void>;
  /** Hard-delete an attivita doc (purge). */
  hardDelete(id: string): Promise<void>;
  /** Purge all attivita matching the predicate; returns how many were deleted. */
  purgeOlderThanDeletedAt(cutoff: Date): Promise<number>;
  /** Delete all attivita owned by the given uid (GDPR). Returns count. */
  deleteAllForOwner(ownerUid: string): Promise<number>;
  /**
   * GDPR: replace updatedBy/updatedByName refs to the given editor with anon
   * values, on attivita owned by OTHER users that this editor touched. Returns
   * how many docs were anonymized.
   */
  anonymizeOwnerReferences(
    editorUid: string,
    args: { anonUid: string; anonName: string }
  ): Promise<number>;
}

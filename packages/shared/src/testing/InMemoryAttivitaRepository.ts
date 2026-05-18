import type { Attivita } from "../domain/entities/Attivita.js";
import type {
  AttivitaFilters,
  AttivitaRepository,
} from "../domain/ports/AttivitaRepository.js";
import type { ActorContext } from "../domain/entities/ActorContext.js";
import {
  computeTotale,
  type AttivitaInput,
} from "../domain/schemas/attivita.js";

export class InMemoryAttivitaRepository implements AttivitaRepository {
  private readonly map = new Map<string, Attivita>();
  private seq = 0;
  private readonly clock: () => Date;

  constructor(clock?: () => Date) {
    this.clock = clock ?? (() => new Date());
  }

  async list(filters: AttivitaFilters = {}): Promise<Attivita[]> {
    const items = [...this.map.values()].filter((a) => !a.isDeleted);
    return items.filter((a) => match(a, filters)).sort(byDataDesc);
  }

  async getById(id: string): Promise<Attivita | null> {
    return this.map.get(id) ?? null;
  }

  async findLastByAziendaAndTipo(
    aziendaId: string,
    tipoId: string
  ): Promise<Attivita | null> {
    const candidates = [...this.map.values()]
      .filter((a) => !a.isDeleted && a.aziendaId === aziendaId && a.tipoId === tipoId)
      .sort(byDataDesc);
    return candidates[0] ?? null;
  }

  async create(
    input: AttivitaInput,
    denorm: { aziendaNome: string; tipoNome: string },
    actor: ActorContext
  ): Promise<string> {
    const id = `attivita-${++this.seq}`;
    const now = this.clock();
    this.map.set(id, {
      id,
      data: input.data,
      aziendaId: input.aziendaId,
      aziendaNome: denorm.aziendaNome,
      tipoId: input.tipoId,
      tipoNome: denorm.tipoNome,
      oraria: input.oraria,
      tariffa: input.tariffa,
      ...(input.ore !== undefined ? { ore: input.ore } : {}),
      totale: computeTotale(input),
      ...(input.note !== undefined ? { note: input.note } : {}),
      ownerUid: actor.uid,
      ownerEmail: actor.email,
      ownerName: actor.displayName,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      schemaVersion: 1,
    });
    return id;
  }

  async update(
    id: string,
    input: AttivitaInput,
    denorm: { aziendaNome: string; tipoNome: string },
    actor: ActorContext
  ): Promise<void> {
    const existing = this.map.get(id);
    if (!existing || existing.isDeleted) throw new Error("not-found");
    const now = this.clock();
    const next: Attivita = {
      id: existing.id,
      data: input.data,
      aziendaId: input.aziendaId,
      aziendaNome: denorm.aziendaNome,
      tipoId: input.tipoId,
      tipoNome: denorm.tipoNome,
      oraria: input.oraria,
      tariffa: input.tariffa,
      totale: computeTotale(input),
      ownerUid: existing.ownerUid,
      ownerEmail: existing.ownerEmail,
      ownerName: existing.ownerName,
      createdAt: existing.createdAt,
      updatedAt: now,
      isDeleted: existing.isDeleted,
      schemaVersion: existing.schemaVersion,
      ...(input.ore !== undefined ? { ore: input.ore } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(existing.deletedAt !== undefined ? { deletedAt: existing.deletedAt } : {}),
      ...(existing.deletedBy !== undefined ? { deletedBy: existing.deletedBy } : {}),
    };
    this.map.set(id, next);
    void actor;
  }

  async softDelete(id: string, actor: ActorContext): Promise<void> {
    const existing = this.map.get(id);
    if (!existing || existing.isDeleted) return;
    const now = this.clock();
    this.map.set(id, {
      ...existing,
      isDeleted: true,
      deletedAt: now,
      deletedBy: actor.uid,
      updatedAt: now,
    });
  }
}

function match(a: Attivita, f: AttivitaFilters): boolean {
  if (f.from && a.data < f.from) return false;
  if (f.to && a.data > f.to) return false;
  if (f.aziendaId && a.aziendaId !== f.aziendaId) return false;
  if (f.tipoId && a.tipoId !== f.tipoId) return false;
  if (f.ownerUid && a.ownerUid !== f.ownerUid) return false;
  return true;
}

function byDataDesc(a: Attivita, b: Attivita): number {
  return b.data.getTime() - a.data.getTime();
}

import type { Attivita } from "../domain/entities/Attivita.js";
import type {
  AttivitaFilters,
  AttivitaRepository,
  TrashFilters,
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

  async listDeleted(filters: TrashFilters = {}): Promise<Attivita[]> {
    const items = [...this.map.values()].filter((a) => a.isDeleted);
    const filtered = filters.ownerUid
      ? items.filter((a) => a.ownerUid === filters.ownerUid)
      : items;
    return filtered.sort(byDeletedAtDesc);
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
  ): Promise<Attivita> {
    const id = `attivita-${++this.seq}`;
    const now = this.clock();
    const created: Attivita = {
      id,
      data: input.data,
      aziendaId: input.aziendaId,
      aziendaNome: denorm.aziendaNome,
      tipoId: input.tipoId,
      tipoNome: denorm.tipoNome,
      oraria: input.oraria,
      adElemento: input.adElemento,
      tariffa: input.tariffa,
      ...(input.ore !== undefined ? { ore: input.ore } : {}),
      ...(input.elementi !== undefined ? { elementi: input.elementi } : {}),
      totale: computeTotale(input),
      ...(input.note !== undefined ? { note: input.note } : {}),
      ownerUid: actor.uid,
      ownerEmail: actor.email,
      ownerName: actor.displayName,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      schemaVersion: 1,
    };
    this.map.set(id, created);
    return created;
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
      adElemento: input.adElemento,
      tariffa: input.tariffa,
      totale: computeTotale(input),
      ownerUid: existing.ownerUid,
      ownerEmail: existing.ownerEmail,
      ownerName: existing.ownerName,
      createdAt: existing.createdAt,
      updatedAt: now,
      isDeleted: existing.isDeleted,
      schemaVersion: existing.schemaVersion,
      updatedBy: actor.uid,
      updatedByName: actor.displayName,
      ...(input.ore !== undefined ? { ore: input.ore } : {}),
      ...(input.elementi !== undefined ? { elementi: input.elementi } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(existing.deletedAt !== undefined ? { deletedAt: existing.deletedAt } : {}),
      ...(existing.deletedBy !== undefined ? { deletedBy: existing.deletedBy } : {}),
    };
    this.map.set(id, next);
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

  async restore(id: string): Promise<void> {
    const existing = this.map.get(id);
    if (!existing || !existing.isDeleted) return;
    const now = this.clock();
    const { deletedAt: _da, deletedBy: _db, ...rest } = existing;
    void _da;
    void _db;
    this.map.set(id, { ...rest, isDeleted: false, updatedAt: now });
  }

  async hardDelete(id: string): Promise<void> {
    this.map.delete(id);
  }

  async purgeOlderThanDeletedAt(cutoff: Date): Promise<number> {
    let count = 0;
    for (const [id, a] of [...this.map.entries()]) {
      if (a.isDeleted && a.deletedAt && a.deletedAt.getTime() < cutoff.getTime()) {
        this.map.delete(id);
        count++;
      }
    }
    return count;
  }

  async hasAnyActive(): Promise<boolean> {
    for (const a of this.map.values()) if (!a.isDeleted) return true;
    return false;
  }

  async deleteAllForOwner(ownerUid: string): Promise<number> {
    let count = 0;
    for (const [id, a] of [...this.map.entries()]) {
      if (a.ownerUid === ownerUid) {
        this.map.delete(id);
        count++;
      }
    }
    return count;
  }

  async anonymizeOwnerReferences(
    editorUid: string,
    args: { anonUid: string; anonName: string }
  ): Promise<number> {
    let count = 0;
    for (const [id, a] of [...this.map.entries()]) {
      if (a.updatedBy === editorUid) {
        this.map.set(id, {
          ...a,
          updatedBy: args.anonUid,
          updatedByName: args.anonName,
        });
        count++;
      }
    }
    return count;
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

function byDeletedAtDesc(a: Attivita, b: Attivita): number {
  const ad = a.deletedAt?.getTime() ?? 0;
  const bd = b.deletedAt?.getTime() ?? 0;
  return bd - ad;
}

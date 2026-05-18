import type { Azienda } from "../domain/entities/Azienda.js";
import type { AziendeRepository } from "../domain/ports/AziendeRepository.js";
import type { ActorContext } from "../domain/entities/ActorContext.js";
import {
  normalizeAziendaNome,
  type AziendaInput,
} from "../domain/schemas/azienda.js";

export class InMemoryAziendeRepository implements AziendeRepository {
  private readonly map = new Map<string, Azienda>();
  private seq = 0;
  private clock: () => Date;

  constructor(clock?: () => Date) {
    this.clock = clock ?? (() => new Date());
  }

  async list(): Promise<Azienda[]> {
    return [...this.map.values()].filter((a) => !a.isDeleted);
  }

  async getById(id: string): Promise<Azienda | null> {
    return this.map.get(id) ?? null;
  }

  async findByNomeNorm(nomeNorm: string): Promise<Azienda | null> {
    for (const a of this.map.values()) {
      if (!a.isDeleted && a.nomeNorm === nomeNorm) return a;
    }
    return null;
  }

  async create(input: AziendaInput, actor: ActorContext): Promise<string> {
    const id = `azienda-${++this.seq}`;
    const now = this.clock();
    const nomeNorm = normalizeAziendaNome(input.nome);
    this.map.set(id, {
      id,
      nome: input.nome,
      nomeNorm,
      ...(input.indirizzo !== undefined ? { indirizzo: input.indirizzo } : {}),
      ...(input.piva !== undefined ? { piva: input.piva } : {}),
      ...(input.emailFatturazione !== undefined
        ? { emailFatturazione: input.emailFatturazione }
        : {}),
      ...(input.cadenzaFatturazione !== undefined
        ? { cadenzaFatturazione: input.cadenzaFatturazione }
        : {}),
      ...(input.tipoAllevamento !== undefined
        ? { tipoAllevamento: input.tipoAllevamento }
        : {}),
      ...(input.numeroCapi !== undefined ? { numeroCapi: input.numeroCapi } : {}),
      ...(input.telefono !== undefined ? { telefono: input.telefono } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
      createdAt: now,
      updatedAt: now,
      createdBy: actor.uid,
      updatedBy: actor.uid,
      createdByName: actor.displayName,
      updatedByName: actor.displayName,
      isDeleted: false,
      schemaVersion: 1,
    });
    return id;
  }

  async update(
    id: string,
    input: AziendaInput,
    actor: ActorContext
  ): Promise<void> {
    const existing = this.map.get(id);
    if (!existing || existing.isDeleted) throw new Error("not-found");
    const now = this.clock();
    const next: Azienda = {
      id: existing.id,
      nome: input.nome,
      nomeNorm: normalizeAziendaNome(input.nome),
      createdAt: existing.createdAt,
      createdBy: existing.createdBy,
      createdByName: existing.createdByName,
      updatedAt: now,
      updatedBy: actor.uid,
      updatedByName: actor.displayName,
      isDeleted: existing.isDeleted,
      schemaVersion: existing.schemaVersion,
      ...(existing.deletedAt !== undefined ? { deletedAt: existing.deletedAt } : {}),
      ...(input.indirizzo !== undefined ? { indirizzo: input.indirizzo } : {}),
      ...(input.piva !== undefined ? { piva: input.piva } : {}),
      ...(input.emailFatturazione !== undefined
        ? { emailFatturazione: input.emailFatturazione }
        : {}),
      ...(input.cadenzaFatturazione !== undefined
        ? { cadenzaFatturazione: input.cadenzaFatturazione }
        : {}),
      ...(input.tipoAllevamento !== undefined
        ? { tipoAllevamento: input.tipoAllevamento }
        : {}),
      ...(input.numeroCapi !== undefined ? { numeroCapi: input.numeroCapi } : {}),
      ...(input.telefono !== undefined ? { telefono: input.telefono } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
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
      updatedAt: now,
      updatedBy: actor.uid,
      updatedByName: actor.displayName,
    });
  }
}

import type { ActivityType } from "../domain/entities/ActivityType.js";
import type { ActivityTypesRepository } from "../domain/ports/ActivityTypesRepository.js";
import type { ActivityTypeInput } from "../domain/schemas/activityType.js";

export class InMemoryActivityTypesRepository implements ActivityTypesRepository {
  private readonly map = new Map<string, ActivityType>();
  private readonly clock: () => Date;

  constructor(clock?: () => Date) {
    this.clock = clock ?? (() => new Date());
  }

  async list(): Promise<ActivityType[]> {
    return [...this.map.values()].sort((a, b) => a.ordine - b.ordine);
  }

  async listActive(): Promise<ActivityType[]> {
    return (await this.list()).filter((t) => t.attivo);
  }

  async getById(id: string): Promise<ActivityType | null> {
    return this.map.get(id) ?? null;
  }

  async upsert(id: string, input: ActivityTypeInput): Promise<void> {
    const now = this.clock();
    const existing = this.map.get(id);
    if (existing) {
      this.map.set(id, {
        ...existing,
        nome: input.nome,
        ordine: input.ordine,
        attivo: input.attivo,
        updatedAt: now,
      });
    } else {
      this.map.set(id, {
        id,
        nome: input.nome,
        ordine: input.ordine,
        attivo: input.attivo,
        createdAt: now,
        updatedAt: now,
        schemaVersion: 1,
      });
    }
  }

  async setActive(id: string, attivo: boolean): Promise<void> {
    const existing = this.map.get(id);
    if (!existing) throw new Error("not-found");
    this.map.set(id, { ...existing, attivo, updatedAt: this.clock() });
  }
}

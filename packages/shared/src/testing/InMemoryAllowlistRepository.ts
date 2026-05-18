import type { AllowlistEntry } from "../domain/entities/AllowlistEntry";
import type { AllowlistRepository } from "../domain/ports/AllowlistRepository";
import { normalizeEmail, type AllowlistEntryInput } from "../domain/schemas/allowlist";

export class InMemoryAllowlistRepository implements AllowlistRepository {
  private readonly map = new Map<string, AllowlistEntry>();

  async getByEmail(email: string): Promise<AllowlistEntry | null> {
    return this.map.get(normalizeEmail(email)) ?? null;
  }

  async list(): Promise<AllowlistEntry[]> {
    return [...this.map.values()];
  }

  async add(input: AllowlistEntryInput, actor: string): Promise<void> {
    const norm = normalizeEmail(input.email);
    this.map.set(norm, {
      emailNorm: norm,
      email: input.email,
      defaultRoleId: input.defaultRoleId,
      invitedBy: actor,
      invitedAt: new Date(),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      schemaVersion: 1,
    });
  }

  async remove(email: string): Promise<void> {
    this.map.delete(normalizeEmail(email));
  }
}

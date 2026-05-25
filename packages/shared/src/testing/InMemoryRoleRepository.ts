import type { Role } from "../domain/entities/Role.js";
import type { RoleRepository } from "../domain/ports/RoleRepository.js";
import type { RoleInput } from "../domain/schemas/role.js";

export class InMemoryRoleRepository implements RoleRepository {
  private readonly map = new Map<string, Role>();

  async getById(id: string): Promise<Role | null> {
    return this.map.get(id) ?? null;
  }

  async list(): Promise<Role[]> {
    return [...this.map.values()];
  }

  async create(id: string, input: RoleInput, actor: string): Promise<Role> {
    if (this.map.has(id)) throw new Error(`role ${id} already exists`);
    const now = new Date();
    const created: Role = {
      id,
      name: input.name,
      ...(input.description !== undefined ? { description: input.description } : {}),
      capabilities: [...input.capabilities],
      locked: false,
      createdAt: now,
      updatedAt: now,
      createdBy: actor,
      updatedBy: actor,
      schemaVersion: 1,
    };
    this.map.set(id, created);
    return created;
  }

  async update(id: string, input: RoleInput, actor: string): Promise<void> {
    const existing = this.map.get(id);
    if (!existing) throw new Error(`role ${id} not found`);
    if (existing.locked) throw new Error(`role ${id} is locked`);
    const base: Role = {
      ...existing,
      name: input.name,
      capabilities: [...input.capabilities],
      updatedAt: new Date(),
      updatedBy: actor,
    };
    if (input.description !== undefined) {
      base.description = input.description;
    } else {
      delete base.description;
    }
    this.map.set(id, base);
  }

  async delete(id: string): Promise<void> {
    const r = this.map.get(id);
    if (!r) return;
    if (r.locked) throw new Error(`role ${id} is locked`);
    this.map.delete(id);
  }

  async seed(role: Role): Promise<void> {
    this.map.set(role.id, role);
  }

  async bumpCapsVer(id: string): Promise<number> {
    const existing = this.map.get(id);
    if (!existing) throw new Error(`role ${id} not found`);
    const next = (existing.capsVer ?? 0) + 1;
    this.map.set(id, { ...existing, capsVer: next, updatedAt: new Date() });
    return next;
  }
}

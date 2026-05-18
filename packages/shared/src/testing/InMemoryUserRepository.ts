import type { User } from "../domain/entities/User.js";
import type { UserRepository } from "../domain/ports/UserRepository.js";
import type { UserInput } from "../domain/schemas/user.js";

export class InMemoryUserRepository implements UserRepository {
  private readonly map = new Map<string, User>();

  async getById(uid: string): Promise<User | null> {
    return this.map.get(uid) ?? null;
  }

  async upsert(uid: string, input: UserInput): Promise<void> {
    const existing = this.map.get(uid);
    const now = new Date();
    const user: User = {
      uid,
      email: input.email,
      displayName: input.displayName,
      roleId: input.roleId,
      disabled: existing?.disabled ?? false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      ...(existing?.lastSignInAt ? { lastSignInAt: existing.lastSignInAt } : {}),
      schemaVersion: 1,
    };
    this.map.set(uid, user);
  }

  async touchLastSignIn(uid: string, at: Date): Promise<void> {
    const u = this.map.get(uid);
    if (!u) return;
    this.map.set(uid, { ...u, lastSignInAt: at, updatedAt: new Date() });
  }

  async setDisabled(uid: string, disabled: boolean): Promise<void> {
    const u = this.map.get(uid);
    if (!u) return;
    this.map.set(uid, { ...u, disabled, updatedAt: new Date() });
  }

  async listByRole(roleId: string): Promise<User[]> {
    return [...this.map.values()].filter((u) => u.roleId === roleId);
  }
}

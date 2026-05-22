import type { User } from "../domain/entities/User.js";
import type { UserRepository } from "../domain/ports/UserRepository.js";

export class InMemoryUserRepository implements UserRepository {
  private readonly map = new Map<string, User>();

  async getById(uid: string): Promise<User | null> {
    return this.map.get(uid) ?? null;
  }

  async listByRole(roleId: string): Promise<User[]> {
    return [...this.map.values()].filter((u) => u.roleId === roleId);
  }

  async listPending(): Promise<User[]> {
    return [...this.map.values()].filter((u) => !u.approved);
  }

  async approve(uid: string, roleId: string): Promise<void> {
    const u = this.map.get(uid);
    if (!u) return;
    const now = new Date();
    this.map.set(uid, {
      ...u,
      approved: true,
      roleId,
      approvedAt: now,
      approvedBy: "test",
      updatedAt: now,
    });
  }

  async delete(uid: string): Promise<void> {
    this.map.delete(uid);
  }

  setForTest(uid: string, user: User): void {
    this.map.set(uid, user);
  }
}

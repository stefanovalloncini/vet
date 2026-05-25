import type { User } from "../domain/entities/User.js";
import type { UserRepository } from "../domain/ports/UserRepository.js";
import type {
  UserApprovePatchArgs,
  UserRevokeSessionPatchArgs,
  UserSignInPatchArgs,
} from "../firestore-dto/user.js";

export class InMemoryUserRepository implements UserRepository {
  private readonly map = new Map<string, User>();
  private readonly clock: () => Date;

  constructor(clock?: () => Date) {
    this.clock = clock ?? (() => new Date());
  }

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
    await this.applyApprovePatch(uid, { actorUid: "test", roleId });
  }

  async delete(uid: string): Promise<void> {
    this.map.delete(uid);
  }

  async applyApprovePatch(
    uid: string,
    args: UserApprovePatchArgs
  ): Promise<void> {
    const u = this.map.get(uid);
    if (!u) return;
    const now = this.clock();
    this.map.set(uid, {
      ...u,
      approved: true,
      roleId: args.roleId,
      approvedAt: now,
      approvedBy: args.actorUid,
      updatedAt: now,
    });
  }

  async applySignInPatch(
    uid: string,
    args: UserSignInPatchArgs
  ): Promise<void> {
    const now = this.clock();
    const existing = this.map.get(uid);
    if (existing) {
      this.map.set(uid, {
        ...existing,
        email: args.email,
        displayName: args.displayName,
        disabled: false,
        updatedAt: now,
        lastSignInAt: now,
      });
      return;
    }
    this.map.set(uid, {
      uid,
      email: args.email,
      displayName: args.displayName,
      roleId: args.defaultRoleId,
      approved: false,
      disabled: false,
      createdAt: now,
      updatedAt: now,
      lastSignInAt: now,
      schemaVersion: 1,
    });
  }

  async applyRevokeSessionPatch(
    uid: string,
    args: UserRevokeSessionPatchArgs
  ): Promise<void> {
    const u = this.map.get(uid);
    if (!u) return;
    const now = this.clock();
    this.map.set(uid, {
      ...u,
      ...(args.disabled !== undefined ? { disabled: args.disabled } : {}),
      ...(args.approved !== undefined ? { approved: args.approved } : {}),
      minCapsVer: args.minCapsVer,
      updatedAt: now,
    });
  }

  async hardDelete(uid: string): Promise<void> {
    this.map.delete(uid);
  }

  setForTest(uid: string, user: User): void {
    this.map.set(uid, user);
  }
}

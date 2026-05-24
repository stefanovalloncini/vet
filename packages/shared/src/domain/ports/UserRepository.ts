import type { User } from "../entities/User.js";

export interface UserRepository {
  getById(uid: string): Promise<User | null>;
  listByRole(roleId: string): Promise<User[]>;
  listPending(): Promise<User[]>;
  approve(uid: string, roleId: string): Promise<void>;
  delete(uid: string): Promise<void>;
}

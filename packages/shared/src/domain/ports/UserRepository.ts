import type { User } from "../entities/User.js";
import type { UserInput } from "../schemas/user.js";

export interface UserRepository {
  getById(uid: string): Promise<User | null>;
  upsert(uid: string, input: UserInput): Promise<void>;
  touchLastSignIn(uid: string, at: Date): Promise<void>;
  setDisabled(uid: string, disabled: boolean, actor: string): Promise<void>;
  listByRole(roleId: string): Promise<User[]>;
}

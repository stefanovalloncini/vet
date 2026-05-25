import type { Role } from "../entities/Role.js";
import type { RoleInput } from "../schemas/role.js";

export interface RoleRepository {
  getById(id: string): Promise<Role | null>;
  list(): Promise<Role[]>;
  create(id: string, input: RoleInput, actor: string): Promise<Role>;
  update(id: string, input: RoleInput, actor: string): Promise<void>;
  delete(id: string): Promise<void>;
  seed(role: Role): Promise<void>;
  /** Atomic increment of capsVer used by the onRoleChange propagator. */
  bumpCapsVer(id: string): Promise<number>;
}

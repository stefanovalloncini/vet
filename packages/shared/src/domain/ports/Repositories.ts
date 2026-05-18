import type { Clock } from "./Clock";
import type { UserRepository } from "./UserRepository";
import type { RoleRepository } from "./RoleRepository";
import type { AllowlistRepository } from "./AllowlistRepository";
import type { AuthService } from "./AuthService";

export interface Repositories {
  readonly clock: Clock;
  readonly users: UserRepository;
  readonly roles: RoleRepository;
  readonly allowlist: AllowlistRepository;
  readonly auth: AuthService;
}

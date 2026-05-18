import type { Clock } from "./Clock.js";
import type { UserRepository } from "./UserRepository.js";
import type { RoleRepository } from "./RoleRepository.js";
import type { AllowlistRepository } from "./AllowlistRepository.js";
import type { AuthService } from "./AuthService.js";

export interface Repositories {
  readonly clock: Clock;
  readonly users: UserRepository;
  readonly roles: RoleRepository;
  readonly allowlist: AllowlistRepository;
  readonly auth: AuthService;
}

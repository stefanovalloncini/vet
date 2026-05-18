import type { Clock } from "./Clock.js";
import type { UserRepository } from "./UserRepository.js";
import type { RoleRepository } from "./RoleRepository.js";
import type { AllowlistRepository } from "./AllowlistRepository.js";
import type { AziendeRepository } from "./AziendeRepository.js";
import type { ActivityTypesRepository } from "./ActivityTypesRepository.js";
import type { AttivitaRepository } from "./AttivitaRepository.js";
import type { AuthService } from "./AuthService.js";

export interface Repositories {
  readonly clock: Clock;
  readonly users: UserRepository;
  readonly roles: RoleRepository;
  readonly allowlist: AllowlistRepository;
  readonly aziende: AziendeRepository;
  readonly activityTypes: ActivityTypesRepository;
  readonly attivita: AttivitaRepository;
  readonly auth: AuthService;
}

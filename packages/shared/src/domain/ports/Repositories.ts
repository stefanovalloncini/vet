import type { Clock } from "./Clock.js";
import type { UserRepository } from "./UserRepository.js";
import type { RoleRepository } from "./RoleRepository.js";
import type { AllowlistRepository } from "./AllowlistRepository.js";
import type { AccessRequestRepository } from "./AccessRequestRepository.js";
import type { AziendeRepository } from "./AziendeRepository.js";
import type { ActivityTypesRepository } from "./ActivityTypesRepository.js";
import type { AttivitaRepository } from "./AttivitaRepository.js";
import type { TrashService } from "./TrashService.js";
import type { AuditRepository } from "./AuditRepository.js";
import type { ContiRepository } from "./ContiRepository.js";
import type { RemindersRepository } from "./RemindersRepository.js";
import type { AuthService } from "./AuthService.js";

export interface Repositories {
  readonly clock: Clock;
  readonly users: UserRepository;
  readonly roles: RoleRepository;
  readonly allowlist: AllowlistRepository;
  readonly accessRequests: AccessRequestRepository;
  readonly aziende: AziendeRepository;
  readonly activityTypes: ActivityTypesRepository;
  readonly attivita: AttivitaRepository;
  readonly trash: TrashService;
  readonly audit: AuditRepository;
  readonly conti: ContiRepository;
  readonly reminders: RemindersRepository;
  readonly auth: AuthService;
}

import {
  SystemClock,
  type Repositories,
} from "@vet/shared";
import {
  InMemoryUserRepository,
  InMemoryRoleRepository,
  InMemoryAllowlistRepository,
  InMemoryAccessRequestRepository,
  InMemoryAziendeRepository,
  InMemoryActivityTypesRepository,
  InMemoryAttivitaRepository,
  InMemoryTrashService,
  InMemoryAuditRepository,
  InMemoryContiRepository,
  InMemoryRemindersRepository,
  InMemoryAuthService,
} from "@vet/shared/testing";

export function createInMemoryRepositories(): Repositories {
  const auth = new InMemoryAuthService();
  const attivita = new InMemoryAttivitaRepository();
  return {
    clock: new SystemClock(),
    users: new InMemoryUserRepository(),
    roles: new InMemoryRoleRepository(),
    allowlist: new InMemoryAllowlistRepository(),
    accessRequests: new InMemoryAccessRequestRepository(),
    aziende: new InMemoryAziendeRepository(),
    activityTypes: new InMemoryActivityTypesRepository(),
    attivita,
    trash: new InMemoryTrashService(attivita, () => auth.getCurrentUser()?.uid ?? null),
    audit: new InMemoryAuditRepository(),
    conti: new InMemoryContiRepository(),
    reminders: new InMemoryRemindersRepository(),
    auth,
  };
}

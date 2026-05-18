import {
  SystemClock,
  type Repositories,
} from "@vet/shared";
import {
  InMemoryUserRepository,
  InMemoryRoleRepository,
  InMemoryAllowlistRepository,
  InMemoryAziendeRepository,
  InMemoryActivityTypesRepository,
  InMemoryAuthService,
} from "@vet/shared/testing";

export function createInMemoryRepositories(): Repositories {
  return {
    clock: new SystemClock(),
    users: new InMemoryUserRepository(),
    roles: new InMemoryRoleRepository(),
    allowlist: new InMemoryAllowlistRepository(),
    aziende: new InMemoryAziendeRepository(),
    activityTypes: new InMemoryActivityTypesRepository(),
    auth: new InMemoryAuthService(),
  };
}

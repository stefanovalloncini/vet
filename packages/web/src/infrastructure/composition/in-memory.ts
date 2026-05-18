import {
  SystemClock,
  type Repositories,
} from "@vet/shared";
import {
  InMemoryUserRepository,
  InMemoryRoleRepository,
  InMemoryAllowlistRepository,
  InMemoryAuthService,
} from "@vet/shared/testing";

export function createInMemoryRepositories(): Repositories {
  return {
    clock: new SystemClock(),
    users: new InMemoryUserRepository(),
    roles: new InMemoryRoleRepository(),
    allowlist: new InMemoryAllowlistRepository(),
    auth: new InMemoryAuthService(),
  };
}

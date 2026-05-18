import { SystemClock, type Repositories } from "@vet/shared";

export function createInMemoryRepositories(): Repositories {
  return {
    clock: new SystemClock(),
  };
}

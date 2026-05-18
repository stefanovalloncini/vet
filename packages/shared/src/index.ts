export const SHARED_PACKAGE_VERSION = "0.0.0";

export type { Clock } from "./domain/ports/Clock.js";
export type { Repositories } from "./domain/ports/Repositories.js";

export { SystemClock } from "./infrastructure/SystemClock.js";

export { isoNow } from "./domain/services/timestamps.js";

export {
  CAPABILITIES,
  type Capability,
  capabilitySchema,
  isCapability,
} from "./domain/caps/registry.js";
export { CAPABILITY_LABELS } from "./domain/caps/labels.js";

export type { User } from "./domain/entities/User.js";
export type { Role } from "./domain/entities/Role.js";
export type { AllowlistEntry } from "./domain/entities/AllowlistEntry.js";
export type { ActorContext } from "./domain/entities/ActorContext.js";
export type { Claims } from "./domain/entities/Claims.js";

export {
  userInputSchema,
  userDocSchema,
  type UserInput,
  type UserDoc,
} from "./domain/schemas/user.js";
export {
  roleInputSchema,
  roleDocSchema,
  type RoleInput,
  type RoleDoc,
} from "./domain/schemas/role.js";
export {
  allowlistEntryInputSchema,
  allowlistEntryDocSchema,
  normalizeEmail,
  type AllowlistEntryInput,
  type AllowlistEntryDoc,
} from "./domain/schemas/allowlist.js";

export type { UserRepository } from "./domain/ports/UserRepository.js";
export type { RoleRepository } from "./domain/ports/RoleRepository.js";
export type { AllowlistRepository } from "./domain/ports/AllowlistRepository.js";
export type {
  AuthService,
  AuthStateSubscriber,
  SignInMethod,
} from "./domain/ports/AuthService.js";

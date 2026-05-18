export const SHARED_PACKAGE_VERSION = "0.0.0";

export type { Clock } from "./domain/ports/Clock";
export type { Repositories } from "./domain/ports/Repositories";

export { SystemClock } from "./infrastructure/SystemClock";

export { isoNow } from "./domain/services/timestamps";

export {
  CAPABILITIES,
  type Capability,
  capabilitySchema,
  isCapability,
} from "./domain/caps/registry";
export { CAPABILITY_LABELS } from "./domain/caps/labels";

export type { User } from "./domain/entities/User";
export type { Role } from "./domain/entities/Role";
export type { AllowlistEntry } from "./domain/entities/AllowlistEntry";
export type { ActorContext } from "./domain/entities/ActorContext";
export type { Claims } from "./domain/entities/Claims";

export {
  userInputSchema,
  userDocSchema,
  type UserInput,
  type UserDoc,
} from "./domain/schemas/user";
export {
  roleInputSchema,
  roleDocSchema,
  type RoleInput,
  type RoleDoc,
} from "./domain/schemas/role";
export {
  allowlistEntryInputSchema,
  allowlistEntryDocSchema,
  normalizeEmail,
  type AllowlistEntryInput,
  type AllowlistEntryDoc,
} from "./domain/schemas/allowlist";

export type { UserRepository } from "./domain/ports/UserRepository";
export type { RoleRepository } from "./domain/ports/RoleRepository";
export type { AllowlistRepository } from "./domain/ports/AllowlistRepository";
export type {
  AuthService,
  AuthStateSubscriber,
  SignInMethod,
} from "./domain/ports/AuthService";

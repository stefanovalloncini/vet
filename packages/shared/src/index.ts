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

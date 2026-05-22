export const SHARED_PACKAGE_VERSION = "0.0.0";

export type { Clock } from "./domain/ports/Clock.js";
export type { Repositories } from "./domain/ports/Repositories.js";

export { SystemClock } from "./infrastructure/SystemClock.js";

export {
  decideScriptTarget,
  type DecideScriptTargetInput,
  type ScriptTargetDecision,
} from "./infrastructure/scriptSafety.js";

export { isoNow } from "./domain/services/timestamps.js";

export {
  CAPABILITIES,
  type Capability,
  capabilitySchema,
  isCapability,
  encodeCaps,
  decodeCaps,
  capCode,
} from "./domain/caps/registry.js";
export { CAPABILITY_LABELS } from "./domain/caps/labels.js";

export type { User } from "./domain/entities/User.js";
export type { Role } from "./domain/entities/Role.js";
export type { AllowlistEntry } from "./domain/entities/AllowlistEntry.js";
export type { AccessRequest } from "./domain/entities/AccessRequest.js";
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
export {
  accessRequestDocSchema,
  acceptAccessRequestInputSchema,
  rejectAccessRequestInputSchema,
  type AccessRequestDoc,
  type AcceptAccessRequestInput,
  type RejectAccessRequestInput,
} from "./domain/schemas/accessRequest.js";
export {
  aziendaInputSchema,
  aziendaDocSchema,
  cadenzaFatturazioneSchema,
  tipoAllevamentoSchema,
  normalizeAziendaNome,
  isValidPartitaIva,
  CADENZA_FATTURAZIONE,
  TIPI_ALLEVAMENTO,
  type AziendaInput,
  type AziendaDoc,
  type CadenzaFatturazione,
  type TipoAllevamento,
} from "./domain/schemas/azienda.js";
export {
  activityTypeInputSchema,
  activityTypeDocSchema,
  slugify,
  ACTIVITY_TYPE_SEEDS,
  GINECOLOGIA_TIPO_ID,
  type ActivityTypeInput,
  type ActivityTypeDoc,
} from "./domain/schemas/activityType.js";
export {
  attivitaInputSchema,
  attivitaDocSchema,
  computeTotale,
  type AttivitaInput,
  type AttivitaDoc,
} from "./domain/schemas/attivita.js";

export type { Azienda } from "./domain/entities/Azienda.js";
export type { ActivityType } from "./domain/entities/ActivityType.js";
export type { Attivita } from "./domain/entities/Attivita.js";

export type { UserRepository } from "./domain/ports/UserRepository.js";
export type { RoleRepository } from "./domain/ports/RoleRepository.js";
export type { AllowlistRepository } from "./domain/ports/AllowlistRepository.js";
export type { AccessRequestRepository } from "./domain/ports/AccessRequestRepository.js";
export type { AziendeRepository } from "./domain/ports/AziendeRepository.js";
export type { ActivityTypesRepository } from "./domain/ports/ActivityTypesRepository.js";
export type {
  AttivitaRepository,
  AttivitaFilters,
  TrashFilters,
} from "./domain/ports/AttivitaRepository.js";
export type { TrashService } from "./domain/ports/TrashService.js";
export type { AuditEvent, AuditAction } from "./domain/entities/AuditEvent.js";
export type {
  AuditRepository,
  AuditFilters,
} from "./domain/ports/AuditRepository.js";
export type { Payment } from "./domain/entities/Payment.js";
export type { PaymentsRepository } from "./domain/ports/PaymentsRepository.js";
export {
  paymentInputSchema,
  paymentDocSchema,
  metodoPagamentoSchema,
  METODI_PAGAMENTO,
  type PaymentInput,
  type PaymentDoc,
  type MetodoPagamento,
} from "./domain/schemas/payment.js";
export type { Reminder } from "./domain/entities/Reminder.js";
export type { RemindersRepository } from "./domain/ports/RemindersRepository.js";
export {
  reminderInputSchema,
  reminderDocSchema,
  type ReminderInput,
  type ReminderDoc,
} from "./domain/schemas/reminder.js";
export type {
  AuthService,
  AuthStateSubscriber,
  SessionRevokedReason,
  SessionRevokedSubscriber,
  SignInMethod,
} from "./domain/ports/AuthService.js";

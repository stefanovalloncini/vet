import { z } from "zod";
import type {
  AuditAction,
  AuditEvent,
  AuditRecordInput,
  AuditTargetType,
} from "../domain/entities/AuditEvent.js";
import { timestampLike, timestampToDate } from "./_shared.js";

const auditActions: readonly AuditAction[] = [
  "role.update",
  "role.create",
  "role.assign",
  "role.update.propagate",
  "allowlist.add",
  "allowlist.remove",
  "allowlist.delete",
  "allowlist.delete.cascade",
  "attivita.delete",
  "attivita.restore",
  "attivita.purge",
  "attivita.purge.auto",
  "user.approve",
  "user.reject",
  "user.session.revoke",
  "user.session.self-revoke",
  "gdpr.erasure",
  "access_request.accept",
  "access_request.reject",
  "access_request.purge.auto",
  "invoicing.monthly.push",
  "backup.firestore.export",
  "backup.drive.export.success",
  "backup.drive.export.failure",
  "backup.drive.cleanup.success",
  "backup.drive.cleanup.failure",
  "backup.drive.digest.sent",
  "auth.signIn.deny",
];

const auditTargetTypes: readonly AuditTargetType[] = [
  "role",
  "user",
  "attivita",
  "azienda",
  "allowlist",
  "activity_type",
  "access_request",
  "drive",
  "firestore",
  "auth",
];

export const auditEventDtoSchema = z
  .object({
    at: timestampLike,
    actorUid: z.string().min(1).max(128),
    actorEmail: z.string().max(120),
    action: z.enum(auditActions as [AuditAction, ...AuditAction[]]),
    targetType: z.enum(
      auditTargetTypes as [AuditTargetType, ...AuditTargetType[]]
    ),
    targetId: z.string().min(1).max(200),
    details: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type AuditEventDTO = z.infer<typeof auditEventDtoSchema>;

export function parseAuditEvent(id: string, raw: unknown): AuditEvent {
  const dto = auditEventDtoSchema.parse(raw);
  return {
    id,
    at: timestampToDate(dto.at),
    actorUid: dto.actorUid,
    actorEmail: dto.actorEmail,
    action: dto.action,
    targetType: dto.targetType,
    targetId: dto.targetId,
    ...(dto.details !== undefined ? { details: dto.details } : {}),
  };
}

export type AuditWritePayload<TServerStamp> = Omit<
  z.input<typeof auditEventDtoSchema>,
  "at"
> & { at: TServerStamp };

export function buildAuditDoc<TServerStamp>(
  event: AuditRecordInput,
  deps: { serverTimestamp: () => TServerStamp }
): AuditWritePayload<TServerStamp> {
  return {
    at: deps.serverTimestamp(),
    actorUid: event.actorUid,
    actorEmail: event.actorEmail,
    action: event.action,
    targetType: event.targetType,
    targetId: event.targetId,
    ...(event.details !== undefined ? { details: event.details } : {}),
  };
}

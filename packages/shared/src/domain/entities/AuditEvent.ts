export type AuditAction =
  | "role.update"
  | "role.create"
  | "role.assign"
  | "role.update.propagate"
  | "allowlist.add"
  | "allowlist.remove"
  | "allowlist.delete"
  | "allowlist.delete.cascade"
  | "attivita.delete"
  | "attivita.restore"
  | "attivita.purge"
  | "attivita.purge.auto"
  | "user.approve"
  | "user.reject"
  | "user.session.revoke"
  | "user.session.self-revoke"
  | "gdpr.erasure"
  | "access_request.accept"
  | "access_request.reject"
  | "access_request.purge.auto"
  | "invoicing.monthly.push"
  | "backup.firestore.export"
  | "backup.drive.export.success"
  | "backup.drive.export.failure"
  | "backup.drive.cleanup.success"
  | "backup.drive.cleanup.failure"
  | "backup.drive.digest.sent"
  | "auth.signIn.deny";

export type AuditTargetType =
  | "role"
  | "user"
  | "attivita"
  | "azienda"
  | "allowlist"
  | "activity_type"
  | "access_request"
  | "drive"
  | "firestore"
  | "auth";

export interface AuditEvent {
  id: string;
  at: Date;
  actorUid: string;
  actorEmail: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  details?: Record<string, unknown>;
}

export interface AuditRecordInput {
  actorUid: string;
  actorEmail: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  details?: Record<string, unknown>;
}

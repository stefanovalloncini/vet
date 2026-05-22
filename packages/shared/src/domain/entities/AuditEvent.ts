export type AuditAction =
  | "role.update"
  | "role.create"
  | "allowlist.add"
  | "allowlist.remove"
  | "attivita.delete"
  | "attivita.restore"
  | "attivita.purge"
  | "attivita.purge.auto"
  | "role.assign"
  | "user.session.revoke"
  | "gdpr.erasure"
  | "access_request.accept"
  | "access_request.reject"
  | "access_request.purge.auto";

export interface AuditEvent {
  id: string;
  at: Date;
  actorUid: string;
  actorEmail: string;
  action: AuditAction;
  targetType:
    | "role"
    | "user"
    | "attivita"
    | "azienda"
    | "allowlist"
    | "activity_type"
    | "access_request";
  targetId: string;
  details?: Record<string, unknown>;
}

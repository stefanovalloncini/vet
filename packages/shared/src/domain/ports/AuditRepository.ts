import type { AuditEvent, AuditRecordInput } from "../entities/AuditEvent.js";

export interface AuditFilters {
  actorUid?: string;
  targetType?: AuditEvent["targetType"];
  targetId?: string;
  action?: AuditEvent["action"];
  limit?: number;
}

export interface AuditRepository {
  list(filters?: AuditFilters): Promise<AuditEvent[]>;
  record(event: AuditRecordInput): Promise<void>;
  anonymizeActorReferences(
    actorUid: string,
    args: { anonUid: string; anonEmail: string }
  ): Promise<number>;
}

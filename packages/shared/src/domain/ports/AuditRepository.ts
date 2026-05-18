import type { AuditEvent } from "../entities/AuditEvent.js";

export interface AuditFilters {
  actorUid?: string;
  targetType?: AuditEvent["targetType"];
  targetId?: string;
  action?: AuditEvent["action"];
  limit?: number;
}

export interface AuditRepository {
  list(filters?: AuditFilters): Promise<AuditEvent[]>;
}

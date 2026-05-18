import type { AuditEvent } from "../domain/entities/AuditEvent.js";
import type {
  AuditFilters,
  AuditRepository,
} from "../domain/ports/AuditRepository.js";

export class InMemoryAuditRepository implements AuditRepository {
  private readonly events: AuditEvent[] = [];

  async list(filters: AuditFilters = {}): Promise<AuditEvent[]> {
    const limit = filters.limit ?? 50;
    return this.events
      .filter((e) => !filters.actorUid || e.actorUid === filters.actorUid)
      .filter((e) => !filters.targetType || e.targetType === filters.targetType)
      .filter((e) => !filters.targetId || e.targetId === filters.targetId)
      .filter((e) => !filters.action || e.action === filters.action)
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, limit);
  }

  seed(event: AuditEvent): void {
    this.events.push(event);
  }
}

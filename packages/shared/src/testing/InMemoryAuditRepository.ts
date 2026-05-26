import type {
  AuditEvent,
  AuditRecordInput,
} from "../domain/entities/AuditEvent.js";
import type {
  AuditFilters,
  AuditRepository,
} from "../domain/ports/AuditRepository.js";

export class InMemoryAuditRepository implements AuditRepository {
  private readonly events: AuditEvent[] = [];
  private seq = 0;
  private readonly clock: () => Date;

  constructor(clock?: () => Date) {
    this.clock = clock ?? (() => new Date());
  }

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

  async record(event: AuditRecordInput): Promise<void> {
    this.events.push({
      id: `audit-${++this.seq}`,
      at: this.clock(),
      actorUid: event.actorUid,
      actorEmail: event.actorEmail,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      ...(event.details !== undefined ? { details: event.details } : {}),
    });
  }

  seed(event: AuditEvent): void {
    this.events.push(event);
  }

  async anonymizeActorReferences(
    actorUid: string,
    args: { anonUid: string; anonEmail: string }
  ): Promise<number> {
    let count = 0;
    for (let i = 0; i < this.events.length; i++) {
      const e = this.events[i];
      if (e && e.actorUid === actorUid) {
        this.events[i] = { ...e, actorUid: args.anonUid, actorEmail: args.anonEmail };
        count++;
      }
    }
    return count;
  }
}

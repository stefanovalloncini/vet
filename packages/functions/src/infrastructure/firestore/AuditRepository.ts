import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type {
  AuditEvent,
  AuditFilters,
  AuditRecordInput,
  AuditRepository,
} from "@vet/shared";
import { parseAuditEvent } from "@vet/shared";

export class FirestoreAuditRepository implements AuditRepository {
  constructor(private readonly db: Firestore) {}

  async list(filters: AuditFilters = {}): Promise<AuditEvent[]> {
    let q: FirebaseFirestore.Query = this.db.collection("audit");
    if (filters.actorUid) q = q.where("actorUid", "==", filters.actorUid);
    if (filters.targetType)
      q = q.where("targetType", "==", filters.targetType);
    if (filters.targetId) q = q.where("targetId", "==", filters.targetId);
    if (filters.action) q = q.where("action", "==", filters.action);
    q = q.orderBy("at", "desc").limit(filters.limit ?? 100);
    const snap = await q.get();
    return snap.docs.map((d) => parseAuditEvent(d.id, d.data()));
  }

  async record(event: AuditRecordInput): Promise<void> {
    await this.db.collection("audit").add({
      at: FieldValue.serverTimestamp(),
      actorUid: event.actorUid,
      actorEmail: event.actorEmail,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      ...(event.details !== undefined ? { details: event.details } : {}),
    });
  }
}

import {
  FieldValue,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import type {
  AuditEvent,
  AuditFilters,
  AuditRecordInput,
  AuditRepository,
} from "@vet/shared";
import { parseAuditEvent } from "@vet/shared";

export class FirestoreAuditRepository implements AuditRepository {
  constructor(
    private readonly db: Firestore,
    private readonly tx?: Transaction
  ) {}

  async list(filters: AuditFilters = {}): Promise<AuditEvent[]> {
    if (this.tx) {
      throw new Error("AuditRepository.list is not supported in a transaction");
    }
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
    const payload = {
      at: FieldValue.serverTimestamp(),
      actorUid: event.actorUid,
      actorEmail: event.actorEmail,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      ...(event.details !== undefined ? { details: event.details } : {}),
    };
    if (this.tx) {
      const ref = this.db.collection("audit").doc();
      this.tx.set(ref, payload);
      return;
    }
    await this.db.collection("audit").add(payload);
  }
}

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
import { buildAuditDoc, parseAuditEvent } from "@vet/shared";

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
    const payload = buildAuditDoc(event, {
      serverTimestamp: () => FieldValue.serverTimestamp(),
    });
    if (this.tx) {
      const ref = this.db.collection("audit").doc();
      this.tx.set(ref, payload);
      return;
    }
    await this.db.collection("audit").add(payload);
  }

  async anonymizeActorReferences(
    actorUid: string,
    args: { anonUid: string; anonEmail: string }
  ): Promise<number> {
    if (this.tx) {
      throw new Error(
        "AuditRepository.anonymizeActorReferences is not supported in a transaction"
      );
    }
    const BATCH_SIZE = 400;
    let count = 0;
    for (;;) {
      const snap = await this.db
        .collection("audit")
        .where("actorUid", "==", actorUid)
        .limit(BATCH_SIZE)
        .get();
      if (snap.empty) break;
      const batch = this.db.batch();
      for (const d of snap.docs) {
        batch.update(d.ref, {
          actorUid: args.anonUid,
          actorEmail: args.anonEmail,
        });
      }
      await batch.commit();
      count += snap.size;
      if (snap.size < BATCH_SIZE) break;
    }
    return count;
  }
}

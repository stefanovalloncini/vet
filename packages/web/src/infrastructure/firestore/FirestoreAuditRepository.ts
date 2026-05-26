import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit as fsLimit,
  type Firestore,
  type QueryConstraint,
} from "firebase/firestore";
import { PermissionDeniedError, parseAuditEvent } from "@vet/shared";
import type {
  AuditEvent,
  AuditFilters,
  AuditRepository,
} from "@vet/shared";

export class FirestoreAuditRepository implements AuditRepository {
  constructor(private readonly db: Firestore) {}

  async list(filters: AuditFilters = {}): Promise<AuditEvent[]> {
    const cs: QueryConstraint[] = [];
    if (filters.actorUid) cs.push(where("actorUid", "==", filters.actorUid));
    if (filters.targetType) cs.push(where("targetType", "==", filters.targetType));
    if (filters.targetId) cs.push(where("targetId", "==", filters.targetId));
    if (filters.action) cs.push(where("action", "==", filters.action));
    cs.push(orderBy("at", "desc"));
    cs.push(fsLimit(filters.limit ?? 100));
    const snap = await getDocs(query(collection(this.db, "audit"), ...cs));
    return snap.docs.map((d) => parseAuditEvent(d.id, d.data()));
  }

  async record(): Promise<void> {
    throw new PermissionDeniedError(
      "audit writes must originate from cloud functions"
    );
  }

  async anonymizeActorReferences(): Promise<number> {
    throw new PermissionDeniedError(
      "audit anonymization must originate from cloud functions"
    );
  }
}

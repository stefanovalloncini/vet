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
import type {
  AuditEvent,
  AuditFilters,
  AuditRepository,
} from "@vet/shared";
import { toDate } from "./timestamps";

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
    return snap.docs.map((d) => fromSnap(d.id, d.data()));
  }
}

function fromSnap(id: string, data: Record<string, unknown>): AuditEvent {
  return {
    id,
    at: toDate(data.at),
    actorUid: (data.actorUid as string) ?? "",
    actorEmail: (data.actorEmail as string) ?? "",
    action: data.action as AuditEvent["action"],
    targetType: data.targetType as AuditEvent["targetType"],
    targetId: (data.targetId as string) ?? "",
    ...(data.details ? { details: data.details as Record<string, unknown> } : {}),
  };
}

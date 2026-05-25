import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  type Firestore,
} from "firebase/firestore";
import type { AccessRequest, AccessRequestRepository } from "@vet/shared";
import { PermissionDeniedError, parseAccessRequest } from "@vet/shared";

const PAGE_SIZE = 200;

export class FirestoreAccessRequestRepository implements AccessRequestRepository {
  constructor(private readonly db: Firestore) {}

  async list(): Promise<AccessRequest[]> {
    const q = query(
      collection(this.db, "accessRequests"),
      orderBy("lastAttemptAt", "desc"),
      limit(PAGE_SIZE)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => parseAccessRequest(d.id, d.data()));
  }

  async getByEmail(emailNorm: string): Promise<AccessRequest | null> {
    const snap = await getDoc(doc(this.db, "accessRequests", emailNorm));
    if (!snap.exists()) return null;
    return parseAccessRequest(snap.id, snap.data());
  }

  async delete(): Promise<void> {
    throw new PermissionDeniedError(
      "accessRequests writes must originate from cloud functions"
    );
  }

  async record(): Promise<never> {
    throw new PermissionDeniedError(
      "accessRequests writes must originate from cloud functions"
    );
  }
}

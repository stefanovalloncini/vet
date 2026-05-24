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
import { toDate } from "./timestamps";

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
    return snap.docs.map((d) => this.fromSnap(d.id, d.data()));
  }

  async getByEmail(emailNorm: string): Promise<AccessRequest | null> {
    const snap = await getDoc(doc(this.db, "accessRequests", emailNorm));
    if (!snap.exists()) return null;
    return this.fromSnap(snap.id, snap.data());
  }

  private fromSnap(emailNorm: string, data: Record<string, unknown>): AccessRequest {
    return {
      emailNorm,
      email: data.email as string,
      ...(data.displayName ? { displayName: data.displayName as string } : {}),
      ...(data.photoURL ? { photoURL: data.photoURL as string } : {}),
      ...(data.providerId ? { providerId: data.providerId as string } : {}),
      firstAttemptAt: toDate(data.firstAttemptAt),
      lastAttemptAt: toDate(data.lastAttemptAt),
      attempts: (data.attempts as number) ?? 1,
      schemaVersion: 1,
    };
  }
}

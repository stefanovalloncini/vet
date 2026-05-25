import type { Firestore } from "firebase-admin/firestore";
import type {
  AccessRequest,
  AccessRequestRepository,
} from "@vet/shared";
import { parseAccessRequest } from "@vet/shared";

const PAGE_SIZE = 200;

export class FirestoreAccessRequestRepository
  implements AccessRequestRepository
{
  constructor(private readonly db: Firestore) {}

  async list(): Promise<AccessRequest[]> {
    const snap = await this.db
      .collection("accessRequests")
      .orderBy("lastAttemptAt", "desc")
      .limit(PAGE_SIZE)
      .get();
    return snap.docs.map((d) => parseAccessRequest(d.id, d.data()));
  }

  async getByEmail(emailNorm: string): Promise<AccessRequest | null> {
    const snap = await this.db
      .collection("accessRequests")
      .doc(emailNorm)
      .get();
    if (!snap.exists) return null;
    return parseAccessRequest(emailNorm, snap.data());
  }
}

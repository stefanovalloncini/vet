import {
  Timestamp,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import type {
  AccessRequest,
  AccessRequestRecordInput,
  AccessRequestRecordResult,
  AccessRequestRepository,
} from "@vet/shared";
import {
  computeExpiresAtMillis,
  decideAccessRequestUpdate,
  parseAccessRequest,
} from "@vet/shared";

const PAGE_SIZE = 200;

export class FirestoreAccessRequestRepository
  implements AccessRequestRepository
{
  constructor(
    private readonly db: Firestore,
    private readonly tx?: Transaction
  ) {}

  async list(): Promise<AccessRequest[]> {
    if (this.tx) {
      throw new Error(
        "AccessRequestRepository.list is not supported in a transaction"
      );
    }
    const snap = await this.db
      .collection("accessRequests")
      .orderBy("lastAttemptAt", "desc")
      .limit(PAGE_SIZE)
      .get();
    return snap.docs.map((d) => parseAccessRequest(d.id, d.data()));
  }

  async getByEmail(emailNorm: string): Promise<AccessRequest | null> {
    const ref = this.db.collection("accessRequests").doc(emailNorm);
    const snap = this.tx ? await this.tx.get(ref) : await ref.get();
    if (!snap.exists) return null;
    return parseAccessRequest(emailNorm, snap.data());
  }

  async delete(emailNorm: string): Promise<void> {
    const ref = this.db.collection("accessRequests").doc(emailNorm);
    if (this.tx) {
      this.tx.delete(ref);
    } else {
      await ref.delete();
    }
  }

  async record(
    input: AccessRequestRecordInput
  ): Promise<AccessRequestRecordResult> {
    if (this.tx) {
      return this.recordWithin(input, this.tx);
    }
    return this.db.runTransaction((tx) => this.recordWithin(input, tx));
  }

  private async recordWithin(
    input: AccessRequestRecordInput,
    tx: Transaction
  ): Promise<AccessRequestRecordResult> {
    const ref = this.db.collection("accessRequests").doc(input.emailNorm);
    const snap = await tx.get(ref);
    const existing = snap.exists ? snap.data() ?? null : null;
    const now = Timestamp.now();
    const decision = decideAccessRequestUpdate({
      existing,
      input,
      now,
      expiresAt: Timestamp.fromMillis(computeExpiresAtMillis(now.toMillis())),
    });
    if (decision.kind === "capped") {
      return { kind: "storm", attempts: decision.attempts };
    }
    if (decision.kind === "storm") {
      tx.update(ref, decision.patch);
      return { kind: "storm", attempts: decision.attempts };
    }
    if (decision.kind === "create") {
      tx.set(ref, decision.doc);
      return { kind: "create", attempts: 1 };
    }
    tx.update(ref, decision.patch);
    const prev =
      typeof existing?.["attempts"] === "number"
        ? (existing["attempts"] as number)
        : 0;
    return { kind: "update", attempts: prev + 1 };
  }
}

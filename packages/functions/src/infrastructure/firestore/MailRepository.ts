import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { MailRepository, MailSendInput } from "@vet/shared";

export class FirestoreMailRepository implements MailRepository {
  constructor(private readonly db: Firestore) {}

  async send(input: MailSendInput): Promise<void> {
    await this.db.collection("mail").add({
      to: input.to,
      message: input.message,
      createdAt: FieldValue.serverTimestamp(),
      ...(input.aziendaId !== undefined ? { aziendaId: input.aziendaId } : {}),
      ...(input.period !== undefined ? { period: input.period } : {}),
      ...(input.kind !== undefined ? { kind: input.kind } : {}),
    });
  }
}

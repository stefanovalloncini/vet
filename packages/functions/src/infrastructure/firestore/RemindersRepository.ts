import {
  FieldValue,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
import type {
  ActorContext,
  Reminder,
  ReminderInput,
  RemindersRepository,
  SerializerStampDeps,
} from "@vet/shared";
import {
  buildOptimisticEntity,
  buildReminderCreateDoc,
  buildReminderMarkDonePatch,
  parseReminder,
} from "@vet/shared";

const stampDeps: SerializerStampDeps<Timestamp, FieldValue> = {
  fromDate: (d) => Timestamp.fromDate(d),
  serverTimestamp: () => FieldValue.serverTimestamp(),
};

export class FirestoreRemindersRepository implements RemindersRepository {
  constructor(private readonly db: Firestore) {}

  async list(opts: { onlyOpen?: boolean } = {}): Promise<Reminder[]> {
    let q = this.db.collection("reminders") as FirebaseFirestore.Query;
    if (opts.onlyOpen) q = q.where("done", "==", false);
    else q = q.orderBy("dueAt", "asc");
    const snap = await q.get();
    const rows = snap.docs.map((d) => parseReminder(d.id, d.data()));
    if (opts.onlyOpen) {
      rows.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
    }
    return rows;
  }

  async listForAzienda(aziendaId: string): Promise<Reminder[]> {
    const snap = await this.db
      .collection("reminders")
      .where("aziendaId", "==", aziendaId)
      .orderBy("dueAt", "asc")
      .get();
    return snap.docs.map((d) => parseReminder(d.id, d.data()));
  }

  async create(
    input: ReminderInput,
    denorm: { aziendaNome: string },
    actor: ActorContext
  ): Promise<Reminder> {
    const ref = this.db.collection("reminders").doc();
    await ref.set(buildReminderCreateDoc({ input, denorm, actor }, stampDeps));
    return buildOptimisticEntity({
      id: ref.id,
      buildDoc: (deps) => buildReminderCreateDoc({ input, denorm, actor }, deps),
      parse: parseReminder,
      now: new Date(),
    });
  }

  async markDone(id: string, done: boolean): Promise<void> {
    const patch = buildReminderMarkDonePatch({ done }, stampDeps);
    await this.db.collection("reminders").doc(id).update({ ...patch });
  }

  async delete(id: string): Promise<void> {
    await this.db.collection("reminders").doc(id).delete();
  }
}

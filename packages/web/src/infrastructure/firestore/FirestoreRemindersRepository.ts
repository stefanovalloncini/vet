import {
  doc,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  Timestamp,
  type FieldValue,
  type Firestore,
} from "firebase/firestore";
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
  serverTimestamp: (): FieldValue => serverTimestamp(),
};

export class FirestoreRemindersRepository implements RemindersRepository {
  constructor(private readonly db: Firestore) {}

  async list(opts: { onlyOpen?: boolean } = {}): Promise<Reminder[]> {
    const constraints = opts.onlyOpen
      ? [where("done", "==", false)]
      : [orderBy("dueAt", "asc")];
    const snap = await getDocs(
      query(collection(this.db, "reminders"), ...constraints)
    );
    const rows = snap.docs.map((d) => parseReminder(d.id, d.data()));
    if (opts.onlyOpen) {
      rows.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
    }
    return rows;
  }

  async listForAzienda(aziendaId: string): Promise<Reminder[]> {
    const snap = await getDocs(
      query(
        collection(this.db, "reminders"),
        where("aziendaId", "==", aziendaId),
        orderBy("dueAt", "asc")
      )
    );
    return snap.docs.map((d) => parseReminder(d.id, d.data()));
  }

  async create(
    input: ReminderInput,
    denorm: { aziendaNome: string },
    actor: ActorContext
  ): Promise<Reminder> {
    const ref = doc(collection(this.db, "reminders"));
    await setDoc(ref, buildReminderCreateDoc({ input, denorm, actor }, stampDeps));
    return buildOptimisticEntity({
      id: ref.id,
      buildDoc: (deps) => buildReminderCreateDoc({ input, denorm, actor }, deps),
      parse: parseReminder,
      now: new Date(),
    });
  }

  async markDone(id: string, done: boolean): Promise<void> {
    const patch = buildReminderMarkDonePatch({ done }, stampDeps);
    await updateDoc(doc(this.db, "reminders", id), { ...patch });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.db, "reminders", id));
  }

  async anonymizeCreatedBy(): Promise<number> {
    throw new Error("RemindersRepository.anonymizeCreatedBy is server-only");
  }
}

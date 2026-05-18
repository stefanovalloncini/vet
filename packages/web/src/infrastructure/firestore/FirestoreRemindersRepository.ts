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
  type Firestore,
} from "firebase/firestore";
import type {
  ActorContext,
  Reminder,
  ReminderInput,
  RemindersRepository,
} from "@vet/shared";

export class FirestoreRemindersRepository implements RemindersRepository {
  constructor(private readonly db: Firestore) {}

  async list(opts: { onlyOpen?: boolean } = {}): Promise<Reminder[]> {
    const snap = await getDocs(
      opts.onlyOpen
        ? query(
            collection(this.db, "reminders"),
            where("done", "==", false),
            orderBy("dueAt", "asc")
          )
        : query(collection(this.db, "reminders"), orderBy("dueAt", "asc"))
    );
    return snap.docs.map((d) => fromSnap(d.id, d.data()));
  }

  async listForAzienda(aziendaId: string): Promise<Reminder[]> {
    const snap = await getDocs(
      query(
        collection(this.db, "reminders"),
        where("aziendaId", "==", aziendaId),
        orderBy("dueAt", "asc")
      )
    );
    return snap.docs.map((d) => fromSnap(d.id, d.data()));
  }

  async create(
    input: ReminderInput,
    denorm: { aziendaNome: string },
    actor: ActorContext
  ): Promise<string> {
    const ref = doc(collection(this.db, "reminders"));
    await setDoc(ref, {
      aziendaId: input.aziendaId,
      aziendaNome: denorm.aziendaNome,
      titolo: input.titolo,
      dueAt: Timestamp.fromDate(input.dueAt),
      ...(input.note !== undefined ? { note: input.note } : {}),
      done: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: actor.uid,
      schemaVersion: 1,
    });
    return ref.id;
  }

  async markDone(id: string, done: boolean): Promise<void> {
    const payload: Record<string, unknown> = {
      done,
      updatedAt: serverTimestamp(),
    };
    if (done) payload["doneAt"] = serverTimestamp();
    else payload["doneAt"] = null;
    await updateDoc(doc(this.db, "reminders", id), payload);
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.db, "reminders", id));
  }
}

function fromSnap(id: string, data: Record<string, unknown>): Reminder {
  return {
    id,
    aziendaId: data.aziendaId as string,
    aziendaNome: data.aziendaNome as string,
    titolo: data.titolo as string,
    dueAt: toDate(data.dueAt),
    ...(data.note ? { note: data.note as string } : {}),
    done: (data.done as boolean) ?? false,
    ...(data.doneAt ? { doneAt: toDate(data.doneAt) } : {}),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    createdBy: (data.createdBy as string) ?? "",
    schemaVersion: 1,
  };
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(0);
}

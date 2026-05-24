import {
  doc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type Firestore,
} from "firebase/firestore";
import type {
  ActorContext,
  Payment,
  PaymentInput,
  PaymentsRepository,
} from "@vet/shared";
import type { MetodoPagamento } from "@vet/shared";
import { toDate } from "./timestamps";

export class FirestorePaymentsRepository implements PaymentsRepository {
  constructor(private readonly db: Firestore) {}

  async list(): Promise<Payment[]> {
    const snap = await getDocs(
      query(
        collection(this.db, "payments"),
        orderBy("periodoFinoA", "desc")
      )
    );
    return snap.docs.map((d) => fromSnap(d.id, d.data()));
  }

  async listForAzienda(aziendaId: string): Promise<Payment[]> {
    const snap = await getDocs(
      query(
        collection(this.db, "payments"),
        where("aziendaId", "==", aziendaId),
        orderBy("periodoFinoA", "desc")
      )
    );
    return snap.docs.map((d) => fromSnap(d.id, d.data()));
  }

  async lastForAzienda(aziendaId: string): Promise<Payment | null> {
    const snap = await getDocs(
      query(
        collection(this.db, "payments"),
        where("aziendaId", "==", aziendaId),
        orderBy("periodoFinoA", "desc"),
        limit(1)
      )
    );
    const first = snap.docs[0];
    if (!first) return null;
    return fromSnap(first.id, first.data());
  }

  async create(
    input: PaymentInput,
    denorm: { aziendaNome: string },
    actor: ActorContext
  ): Promise<string> {
    const ref = doc(collection(this.db, "payments"));
    await setDoc(ref, {
      aziendaId: input.aziendaId,
      aziendaNome: denorm.aziendaNome,
      periodoFinoA: Timestamp.fromDate(input.periodoFinoA),
      ...(input.importoPagato !== undefined
        ? { importoPagato: input.importoPagato }
        : {}),
      ...(input.metodoPagamento !== undefined
        ? { metodoPagamento: input.metodoPagamento }
        : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: actor.uid,
      updatedBy: actor.uid,
      createdByName: actor.displayName,
      updatedByName: actor.displayName,
      schemaVersion: 1,
    });
    return ref.id;
  }

  async delete(id: string, _actor: ActorContext): Promise<void> {
    await deleteDoc(doc(this.db, "payments", id));
  }
}

function fromSnap(id: string, data: Record<string, unknown>): Payment {
  return {
    id,
    aziendaId: data.aziendaId as string,
    aziendaNome: data.aziendaNome as string,
    periodoFinoA: toDate(data.periodoFinoA),
    ...(data.importoPagato !== undefined
      ? { importoPagato: data.importoPagato as number }
      : {}),
    ...(data.metodoPagamento
      ? { metodoPagamento: data.metodoPagamento as MetodoPagamento }
      : {}),
    ...(data.note ? { note: data.note as string } : {}),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    createdBy: (data.createdBy as string) ?? "",
    updatedBy: (data.updatedBy as string) ?? "",
    createdByName: (data.createdByName as string) ?? "",
    updatedByName: (data.updatedByName as string) ?? "",
    schemaVersion: 1,
  };
}

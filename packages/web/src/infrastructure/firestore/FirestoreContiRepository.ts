import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  Timestamp,
  type Firestore,
} from "firebase/firestore";
import type {
  ActorContext,
  Conto,
  ContoEmitInput,
  ContoSaldoInput,
  ContiRepository,
  MetodoPagamento,
} from "@vet/shared";
import { toDate } from "./timestamps";

export class FirestoreContiRepository implements ContiRepository {
  constructor(private readonly db: Firestore) {}

  async list(): Promise<Conto[]> {
    const snap = await getDocs(
      query(
        collection(this.db, "conti"),
        where("isDeleted", "==", false),
        orderBy("emittedAt", "desc")
      )
    );
    return snap.docs.map((d) => fromSnap(d.id, d.data()));
  }

  async listForAzienda(aziendaId: string): Promise<Conto[]> {
    const snap = await getDocs(
      query(
        collection(this.db, "conti"),
        where("isDeleted", "==", false),
        where("aziendaId", "==", aziendaId),
        orderBy("emittedAt", "desc")
      )
    );
    return snap.docs.map((d) => fromSnap(d.id, d.data()));
  }

  async listUnsaldati(): Promise<Conto[]> {
    const snap = await getDocs(
      query(
        collection(this.db, "conti"),
        where("isDeleted", "==", false),
        where("modalita", "==", "emesso"),
        where("saldato", "==", false),
        orderBy("emittedAt", "desc")
      )
    );
    return snap.docs.map((d) => fromSnap(d.id, d.data()));
  }

  async getById(id: string): Promise<Conto | null> {
    const ref = doc(this.db, "conti", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const c = fromSnap(snap.id, snap.data());
    return c.isDeleted ? null : c;
  }

  async emit(
    input: ContoEmitInput,
    denorm: {
      aziendaNome: string;
      attivitaIds: string[];
      totaleConto: number;
    },
    actor: ActorContext
  ): Promise<string> {
    const ref = doc(collection(this.db, "conti"));
    await setDoc(ref, {
      aziendaId: input.aziendaId,
      aziendaNome: denorm.aziendaNome,
      periodoFrom: Timestamp.fromDate(input.periodoFrom),
      periodoTo: Timestamp.fromDate(input.periodoTo),
      attivitaIds: denorm.attivitaIds,
      totaleConto: denorm.totaleConto,
      modalita: input.modalita,
      saldato: false,
      emittedAt: serverTimestamp(),
      emittedBy: actor.uid,
      emittedByName: actor.displayName,
      isDeleted: false,
      schemaVersion: 1,
    });
    return ref.id;
  }

  async saldo(input: ContoSaldoInput, actor: ActorContext): Promise<void> {
    const ref = doc(this.db, "conti", input.contoId);
    await updateDoc(ref, {
      saldato: true,
      saldatoAt: serverTimestamp(),
      saldatoBy: actor.uid,
      saldatoByName: actor.displayName,
      ...(input.importoSaldato !== undefined
        ? { importoSaldato: input.importoSaldato }
        : {}),
      ...(input.metodoPagamento !== undefined
        ? { metodoPagamento: input.metodoPagamento }
        : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
    });
  }

  async annulla(id: string, actor: ActorContext): Promise<void> {
    await updateDoc(doc(this.db, "conti", id), {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: actor.uid,
    });
  }
}

function fromSnap(id: string, data: Record<string, unknown>): Conto {
  return {
    id,
    aziendaId: data.aziendaId as string,
    aziendaNome: data.aziendaNome as string,
    periodoFrom: toDate(data.periodoFrom),
    periodoTo: toDate(data.periodoTo),
    attivitaIds: (data.attivitaIds as string[] | undefined) ?? [],
    totaleConto: (data.totaleConto as number) ?? 0,
    modalita: (data.modalita as "proforma" | "emesso") ?? "proforma",
    saldato: (data.saldato as boolean) ?? false,
    emittedAt: toDate(data.emittedAt),
    emittedBy: (data.emittedBy as string) ?? "",
    emittedByName: (data.emittedByName as string) ?? "",
    ...(data.saldatoAt
      ? { saldatoAt: toDate(data.saldatoAt) }
      : {}),
    ...(data.saldatoBy
      ? { saldatoBy: data.saldatoBy as string }
      : {}),
    ...(data.saldatoByName
      ? { saldatoByName: data.saldatoByName as string }
      : {}),
    ...(data.importoSaldato !== undefined
      ? { importoSaldato: data.importoSaldato as number }
      : {}),
    ...(data.metodoPagamento
      ? { metodoPagamento: data.metodoPagamento as MetodoPagamento }
      : {}),
    ...(data.note ? { note: data.note as string } : {}),
    isDeleted: (data.isDeleted as boolean) ?? false,
    ...(data.deletedAt
      ? { deletedAt: toDate(data.deletedAt) }
      : {}),
    ...(data.deletedBy
      ? { deletedBy: data.deletedBy as string }
      : {}),
    schemaVersion: 1,
  };
}

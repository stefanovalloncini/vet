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
  type FieldValue,
  type Firestore,
} from "firebase/firestore";
import type {
  ActorContext,
  Conto,
  ContoEmitInput,
  ContoSaldoInput,
  ContiRepository,
} from "@vet/shared";
import { buildContoEmitDoc, parseConto } from "@vet/shared";

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
    const payload = buildContoEmitDoc(
      { input, denorm, actor },
      {
        fromDate: (d) => Timestamp.fromDate(d),
        serverTimestamp: (): FieldValue => serverTimestamp(),
      }
    );
    await setDoc(ref, payload);
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
  return parseConto(id, data);
}

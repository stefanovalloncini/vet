import {
  FieldValue,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
import type {
  ActorContext,
  Conto,
  ContoEmitInput,
  ContoSaldoInput,
  ContiRepository,
} from "@vet/shared";
import { buildContoEmitDoc, parseConto } from "@vet/shared";

const stampDeps = {
  fromDate: (d: Date): Timestamp => Timestamp.fromDate(d),
  serverTimestamp: (): FieldValue => FieldValue.serverTimestamp(),
};

export class FirestoreContiRepository implements ContiRepository {
  constructor(private readonly db: Firestore) {}

  async list(): Promise<Conto[]> {
    const snap = await this.db
      .collection("conti")
      .where("isDeleted", "==", false)
      .orderBy("emittedAt", "desc")
      .get();
    return snap.docs.map((d) => parseConto(d.id, d.data()));
  }

  async listForAzienda(aziendaId: string): Promise<Conto[]> {
    const snap = await this.db
      .collection("conti")
      .where("isDeleted", "==", false)
      .where("aziendaId", "==", aziendaId)
      .orderBy("emittedAt", "desc")
      .get();
    return snap.docs.map((d) => parseConto(d.id, d.data()));
  }

  async listUnsaldati(): Promise<Conto[]> {
    const snap = await this.db
      .collection("conti")
      .where("isDeleted", "==", false)
      .where("modalita", "==", "emesso")
      .where("saldato", "==", false)
      .orderBy("emittedAt", "desc")
      .get();
    return snap.docs.map((d) => parseConto(d.id, d.data()));
  }

  async getById(id: string): Promise<Conto | null> {
    const snap = await this.db.collection("conti").doc(id).get();
    if (!snap.exists) return null;
    const c = parseConto(id, snap.data());
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
    const ref = this.db.collection("conti").doc();
    await ref.set(buildContoEmitDoc({ input, denorm, actor }, stampDeps));
    return ref.id;
  }

  async saldo(input: ContoSaldoInput, actor: ActorContext): Promise<void> {
    await this.db.collection("conti").doc(input.contoId).update({
      saldato: true,
      saldatoAt: FieldValue.serverTimestamp(),
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
    await this.db.collection("conti").doc(id).update({
      isDeleted: true,
      deletedAt: FieldValue.serverTimestamp(),
      deletedBy: actor.uid,
    });
  }
}

import type { Conto } from "../domain/entities/Conto.js";
import type { ContiRepository } from "../domain/ports/ContiRepository.js";
import type { ActorContext } from "../domain/entities/ActorContext.js";
import type {
  ContoEmitInput,
  ContoSaldoInput,
} from "../domain/schemas/conto.js";

export class InMemoryContiRepository implements ContiRepository {
  private readonly map = new Map<string, Conto>();
  private seq = 0;
  private readonly clock: () => Date;

  constructor(clock?: () => Date) {
    this.clock = clock ?? (() => new Date());
  }

  async list(): Promise<Conto[]> {
    return [...this.map.values()]
      .filter((c) => !c.isDeleted)
      .sort((a, b) => b.emittedAt.getTime() - a.emittedAt.getTime());
  }

  async listForAzienda(aziendaId: string): Promise<Conto[]> {
    return (await this.list()).filter((c) => c.aziendaId === aziendaId);
  }

  async listUnsaldati(): Promise<Conto[]> {
    return (await this.list()).filter(
      (c) => c.modalita === "emesso" && !c.saldato
    );
  }

  async getById(id: string): Promise<Conto | null> {
    const c = this.map.get(id);
    return c && !c.isDeleted ? c : null;
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
    const id = `conto-${++this.seq}`;
    const now = this.clock();
    this.map.set(id, {
      id,
      aziendaId: input.aziendaId,
      aziendaNome: denorm.aziendaNome,
      periodoFrom: input.periodoFrom,
      periodoTo: input.periodoTo,
      attivitaIds: [...denorm.attivitaIds],
      totaleConto: denorm.totaleConto,
      modalita: input.modalita,
      saldato: false,
      emittedAt: now,
      emittedBy: actor.uid,
      emittedByName: actor.displayName,
      isDeleted: false,
      schemaVersion: 1,
    });
    return id;
  }

  async saldo(input: ContoSaldoInput, actor: ActorContext): Promise<void> {
    const existing = this.map.get(input.contoId);
    if (!existing || existing.isDeleted) throw new Error("not-found");
    if (existing.modalita !== "emesso") {
      throw new Error("only-emesso-can-be-saldato");
    }
    if (existing.saldato) throw new Error("already-saldato");
    const now = this.clock();
    this.map.set(input.contoId, {
      ...existing,
      saldato: true,
      saldatoAt: now,
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
    const existing = this.map.get(id);
    if (!existing || existing.isDeleted) return;
    const now = this.clock();
    this.map.set(id, {
      ...existing,
      isDeleted: true,
      deletedAt: now,
      deletedBy: actor.uid,
    });
  }
}

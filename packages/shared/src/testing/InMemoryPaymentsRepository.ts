import type { Payment } from "../domain/entities/Payment.js";
import type { PaymentsRepository } from "../domain/ports/PaymentsRepository.js";
import type { ActorContext } from "../domain/entities/ActorContext.js";
import type { PaymentInput } from "../domain/schemas/payment.js";

export class InMemoryPaymentsRepository implements PaymentsRepository {
  private readonly map = new Map<string, Payment>();
  private seq = 0;
  private readonly clock: () => Date;

  constructor(clock?: () => Date) {
    this.clock = clock ?? (() => new Date());
  }

  async list(): Promise<Payment[]> {
    return [...this.map.values()].sort(
      (a, b) => b.periodoFinoA.getTime() - a.periodoFinoA.getTime()
    );
  }

  async listForAzienda(aziendaId: string): Promise<Payment[]> {
    return (await this.list()).filter((p) => p.aziendaId === aziendaId);
  }

  async lastForAzienda(aziendaId: string): Promise<Payment | null> {
    const ps = await this.listForAzienda(aziendaId);
    return ps[0] ?? null;
  }

  async create(
    input: PaymentInput,
    denorm: { aziendaNome: string },
    actor: ActorContext
  ): Promise<string> {
    const id = `payment-${++this.seq}`;
    const now = this.clock();
    this.map.set(id, {
      id,
      aziendaId: input.aziendaId,
      aziendaNome: denorm.aziendaNome,
      periodoFinoA: input.periodoFinoA,
      ...(input.importoPagato !== undefined
        ? { importoPagato: input.importoPagato }
        : {}),
      ...(input.metodoPagamento !== undefined
        ? { metodoPagamento: input.metodoPagamento }
        : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
      createdAt: now,
      updatedAt: now,
      createdBy: actor.uid,
      updatedBy: actor.uid,
      createdByName: actor.displayName,
      updatedByName: actor.displayName,
      schemaVersion: 1,
    });
    return id;
  }

  async delete(id: string, _actor: ActorContext): Promise<void> {
    this.map.delete(id);
  }
}

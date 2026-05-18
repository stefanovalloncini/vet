import type { Payment } from "../entities/Payment.js";
import type { PaymentInput } from "../schemas/payment.js";
import type { ActorContext } from "../entities/ActorContext.js";

export interface PaymentsRepository {
  list(): Promise<Payment[]>;
  listForAzienda(aziendaId: string): Promise<Payment[]>;
  lastForAzienda(aziendaId: string): Promise<Payment | null>;
  create(
    input: PaymentInput,
    denorm: { aziendaNome: string },
    actor: ActorContext
  ): Promise<string>;
  delete(id: string, actor: ActorContext): Promise<void>;
}

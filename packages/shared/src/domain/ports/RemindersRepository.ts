import type { Reminder } from "../entities/Reminder.js";
import type { ReminderInput } from "../schemas/reminder.js";
import type { ActorContext } from "../entities/ActorContext.js";

export interface RemindersRepository {
  list(opts?: { onlyOpen?: boolean }): Promise<Reminder[]>;
  listForAzienda(aziendaId: string): Promise<Reminder[]>;
  create(
    input: ReminderInput,
    denorm: { aziendaNome: string },
    actor: ActorContext
  ): Promise<string>;
  markDone(id: string, done: boolean): Promise<void>;
  delete(id: string): Promise<void>;
}

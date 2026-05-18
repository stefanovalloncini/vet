import type { Reminder } from "../domain/entities/Reminder.js";
import type { RemindersRepository } from "../domain/ports/RemindersRepository.js";
import type { ActorContext } from "../domain/entities/ActorContext.js";
import type { ReminderInput } from "../domain/schemas/reminder.js";

export class InMemoryRemindersRepository implements RemindersRepository {
  private readonly map = new Map<string, Reminder>();
  private seq = 0;
  private readonly clock: () => Date;

  constructor(clock?: () => Date) {
    this.clock = clock ?? (() => new Date());
  }

  async list(opts: { onlyOpen?: boolean } = {}): Promise<Reminder[]> {
    const all = [...this.map.values()].sort(
      (a, b) => a.dueAt.getTime() - b.dueAt.getTime()
    );
    return opts.onlyOpen ? all.filter((r) => !r.done) : all;
  }

  async listForAzienda(aziendaId: string): Promise<Reminder[]> {
    return (await this.list()).filter((r) => r.aziendaId === aziendaId);
  }

  async create(
    input: ReminderInput,
    denorm: { aziendaNome: string },
    actor: ActorContext
  ): Promise<string> {
    const id = `reminder-${++this.seq}`;
    const now = this.clock();
    this.map.set(id, {
      id,
      aziendaId: input.aziendaId,
      aziendaNome: denorm.aziendaNome,
      titolo: input.titolo,
      dueAt: input.dueAt,
      ...(input.note !== undefined ? { note: input.note } : {}),
      done: false,
      createdAt: now,
      updatedAt: now,
      createdBy: actor.uid,
      schemaVersion: 1,
    });
    return id;
  }

  async markDone(id: string, done: boolean): Promise<void> {
    const r = this.map.get(id);
    if (!r) return;
    const next: Reminder = { ...r, done, updatedAt: this.clock() };
    if (done) next.doneAt = this.clock();
    else delete next.doneAt;
    this.map.set(id, next);
  }

  async delete(id: string): Promise<void> {
    this.map.delete(id);
  }
}

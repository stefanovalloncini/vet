import { z } from "zod";
import type { Reminder } from "../domain/entities/Reminder.js";
import type { ActorContext } from "../domain/entities/ActorContext.js";
import type { ReminderInput } from "../domain/schemas/reminder.js";
import {
  timestampLike,
  timestampToDate,
  type SerializerStampDeps,
} from "./_shared.js";

export const reminderDtoSchema = z
  .object({
    aziendaId: z.string().min(1).max(64),
    aziendaNome: z.string().min(1).max(200),
    titolo: z.string().min(1).max(120),
    dueAt: timestampLike,
    note: z.string().max(500).optional(),
    done: z.boolean(),
    doneAt: timestampLike.nullish(),
    createdAt: timestampLike,
    updatedAt: timestampLike,
    createdBy: z.string().min(1).max(128),
    schemaVersion: z.literal(1),
  })
  .strict();

export type ReminderDTO = z.infer<typeof reminderDtoSchema>;

export function parseReminder(id: string, raw: unknown): Reminder {
  const dto = reminderDtoSchema.parse(raw);
  return {
    id,
    aziendaId: dto.aziendaId,
    aziendaNome: dto.aziendaNome,
    titolo: dto.titolo,
    dueAt: timestampToDate(dto.dueAt),
    ...(dto.note !== undefined ? { note: dto.note } : {}),
    done: dto.done,
    ...(dto.doneAt != null ? { doneAt: timestampToDate(dto.doneAt) } : {}),
    createdAt: timestampToDate(dto.createdAt),
    updatedAt: timestampToDate(dto.updatedAt),
    createdBy: dto.createdBy,
    schemaVersion: dto.schemaVersion,
  };
}

export type ReminderCreateWritePayload<TStamp, TServerStamp> = Omit<
  z.input<typeof reminderDtoSchema>,
  "dueAt" | "createdAt" | "updatedAt"
> & {
  dueAt: TStamp;
  createdAt: TServerStamp;
  updatedAt: TServerStamp;
};

export function buildReminderCreateDoc<TStamp, TServerStamp>(
  args: {
    input: ReminderInput;
    denorm: { aziendaNome: string };
    actor: ActorContext;
  },
  deps: SerializerStampDeps<TStamp, TServerStamp>
): ReminderCreateWritePayload<TStamp, TServerStamp> {
  const now = deps.serverTimestamp();
  return {
    aziendaId: args.input.aziendaId,
    aziendaNome: args.denorm.aziendaNome,
    titolo: args.input.titolo,
    dueAt: deps.fromDate(args.input.dueAt),
    ...(args.input.note !== undefined ? { note: args.input.note } : {}),
    done: false,
    createdAt: now,
    updatedAt: now,
    createdBy: args.actor.uid,
    schemaVersion: 1,
  };
}

export interface ReminderMarkDonePayload<TServerStamp> {
  done: boolean;
  updatedAt: TServerStamp;
  doneAt: TServerStamp | null;
}

export function buildReminderMarkDonePatch<TStamp, TServerStamp>(
  args: { done: boolean },
  deps: SerializerStampDeps<TStamp, TServerStamp>
): ReminderMarkDonePayload<TServerStamp> {
  const now = deps.serverTimestamp();
  return {
    done: args.done,
    updatedAt: now,
    doneAt: args.done ? now : null,
  };
}

import { z } from "zod";

export const reminderInputSchema = z
  .object({
    aziendaId: z.string().min(1),
    titolo: z.string().min(1).max(120),
    dueAt: z.date(),
    note: z.string().max(500).optional(),
  })
  .strict();

export const reminderDocSchema = z
  .object({
    aziendaId: z.string().min(1),
    aziendaNome: z.string().min(1).max(200),
    titolo: z.string().min(1).max(120),
    dueAt: z.date(),
    note: z.string().max(500).optional(),
    done: z.boolean(),
    doneAt: z.date().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    createdBy: z.string().min(1),
    schemaVersion: z.literal(1),
  })
  .strict();

export type ReminderInput = z.infer<typeof reminderInputSchema>;
export type ReminderDoc = z.infer<typeof reminderDocSchema>;

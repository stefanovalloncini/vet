import { z } from "zod";
import type { ActivityType } from "../domain/entities/ActivityType.js";
import {
  modalitaSchema,
  type ActivityTypeInput,
} from "../domain/schemas/activityType.js";
import {
  timestampLike,
  timestampToDate,
  type SerializerStampDeps,
} from "./_shared.js";

export const activityTypeDtoSchema = z
  .object({
    nome: z.string().min(1).max(80),
    ordine: z.number().int().min(0).max(1000),
    attivo: z.boolean(),
    tariffaStandard: z.number().min(0).max(100000).optional(),
    modalitaDefault: modalitaSchema.optional(),
    createdAt: timestampLike,
    updatedAt: timestampLike,
    schemaVersion: z.literal(1),
  })
  .strict();

export type ActivityTypeDTO = z.infer<typeof activityTypeDtoSchema>;

export function parseActivityType(id: string, raw: unknown): ActivityType {
  const dto = activityTypeDtoSchema.parse(raw);
  return {
    id,
    nome: dto.nome,
    ordine: dto.ordine,
    attivo: dto.attivo,
    ...(dto.tariffaStandard !== undefined
      ? { tariffaStandard: dto.tariffaStandard }
      : {}),
    ...(dto.modalitaDefault !== undefined
      ? { modalitaDefault: dto.modalitaDefault }
      : {}),
    createdAt: timestampToDate(dto.createdAt),
    updatedAt: timestampToDate(dto.updatedAt),
    schemaVersion: dto.schemaVersion,
  };
}

export type ActivityTypeCreateWritePayload<TServerStamp> = Omit<
  z.input<typeof activityTypeDtoSchema>,
  "createdAt" | "updatedAt"
> & {
  createdAt: TServerStamp;
  updatedAt: TServerStamp;
};

export function buildActivityTypeCreateDoc<TStamp, TServerStamp>(
  args: { input: ActivityTypeInput },
  deps: SerializerStampDeps<TStamp, TServerStamp>
): ActivityTypeCreateWritePayload<TServerStamp> {
  const now = deps.serverTimestamp();
  return {
    nome: args.input.nome,
    ordine: args.input.ordine,
    attivo: args.input.attivo,
    ...(args.input.tariffaStandard !== undefined
      ? { tariffaStandard: args.input.tariffaStandard }
      : {}),
    ...(args.input.modalitaDefault !== undefined
      ? { modalitaDefault: args.input.modalitaDefault }
      : {}),
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  };
}

export function buildActivityTypeUpdateDoc<TStamp, TServerStamp>(
  args: { input: ActivityTypeInput },
  deps: SerializerStampDeps<TStamp, TServerStamp>
): {
  nome: string;
  ordine: number;
  attivo: boolean;
  tariffaStandard?: number;
  modalitaDefault?: z.infer<typeof modalitaSchema>;
  updatedAt: TServerStamp;
} {
  return {
    nome: args.input.nome,
    ordine: args.input.ordine,
    attivo: args.input.attivo,
    ...(args.input.tariffaStandard !== undefined
      ? { tariffaStandard: args.input.tariffaStandard }
      : {}),
    ...(args.input.modalitaDefault !== undefined
      ? { modalitaDefault: args.input.modalitaDefault }
      : {}),
    updatedAt: deps.serverTimestamp(),
  };
}

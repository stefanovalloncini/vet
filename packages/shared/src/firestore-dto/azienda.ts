import { z } from "zod";
import type { Azienda } from "../domain/entities/Azienda.js";
import type { ActorContext } from "../domain/entities/ActorContext.js";
import {
  cadenzaFatturazioneSchema,
  normalizeAziendaNome,
  tipoAllevamentoSchema,
  type AziendaInput,
} from "../domain/schemas/azienda.js";
import { euroAmountSchema } from "../domain/schemas/money.js";
import { safeEmail, safeName } from "../domain/schemas/safeString.js";
import {
  timestampLike,
  timestampToDate,
  type SerializerStampDeps,
} from "./_shared.js";

export const aziendaDtoSchema = z
  .object({
    nome: z.string().min(1).max(200),
    nomeNorm: z.string().min(1).max(200),
    indirizzo: z.string().max(300).optional(),
    piva: z.string().regex(/^\d{11}$/).optional(),
    emailFatturazione: safeEmail(120).optional(),
    cadenzaFatturazione: cadenzaFatturazioneSchema.optional(),
    tipoAllevamento: tipoAllevamentoSchema.optional(),
    numeroCapi: z.number().int().nonnegative().max(100_000).optional(),
    telefono: z.string().max(40).optional(),
    note: z.string().max(1000).optional(),
    armadiettoCanoneAnnuo: euroAmountSchema.optional(),
    createdAt: timestampLike,
    updatedAt: timestampLike,
    createdBy: z.string().min(1).max(128),
    updatedBy: z.string().min(1).max(128),
    createdByName: safeName(80),
    updatedByName: safeName(80),
    isDeleted: z.boolean(),
    deletedAt: timestampLike.optional(),
    schemaVersion: z.literal(1),
  })
  .strict();

export type AziendaDTO = z.infer<typeof aziendaDtoSchema>;

export function parseAzienda(id: string, raw: unknown): Azienda {
  const dto = aziendaDtoSchema.parse(raw);
  return {
    id,
    nome: dto.nome,
    nomeNorm: dto.nomeNorm,
    ...(dto.indirizzo !== undefined ? { indirizzo: dto.indirizzo } : {}),
    ...(dto.piva !== undefined ? { piva: dto.piva } : {}),
    ...(dto.emailFatturazione !== undefined
      ? { emailFatturazione: dto.emailFatturazione }
      : {}),
    ...(dto.cadenzaFatturazione !== undefined
      ? { cadenzaFatturazione: dto.cadenzaFatturazione }
      : {}),
    ...(dto.tipoAllevamento !== undefined
      ? { tipoAllevamento: dto.tipoAllevamento }
      : {}),
    ...(dto.numeroCapi !== undefined ? { numeroCapi: dto.numeroCapi } : {}),
    ...(dto.telefono !== undefined ? { telefono: dto.telefono } : {}),
    ...(dto.note !== undefined ? { note: dto.note } : {}),
    ...(dto.armadiettoCanoneAnnuo !== undefined
      ? { armadiettoCanoneAnnuo: dto.armadiettoCanoneAnnuo }
      : {}),
    createdAt: timestampToDate(dto.createdAt),
    updatedAt: timestampToDate(dto.updatedAt),
    createdBy: dto.createdBy,
    updatedBy: dto.updatedBy,
    createdByName: dto.createdByName,
    updatedByName: dto.updatedByName,
    isDeleted: dto.isDeleted,
    ...(dto.deletedAt !== undefined
      ? { deletedAt: timestampToDate(dto.deletedAt) }
      : {}),
    schemaVersion: dto.schemaVersion,
  };
}

export type AziendaCreateWritePayload<TServerStamp> = Omit<
  z.input<typeof aziendaDtoSchema>,
  "createdAt" | "updatedAt"
> & {
  createdAt: TServerStamp;
  updatedAt: TServerStamp;
};

export function buildAziendaCreateDoc<TServerStamp>(
  args: { input: AziendaInput; actor: ActorContext },
  deps: Pick<SerializerStampDeps<unknown, TServerStamp>, "serverTimestamp">
): AziendaCreateWritePayload<TServerStamp> {
  const now = deps.serverTimestamp();
  const { input, actor } = args;
  return {
    nome: input.nome,
    nomeNorm: normalizeAziendaNome(input.nome),
    ...(input.indirizzo !== undefined ? { indirizzo: input.indirizzo } : {}),
    ...(input.piva !== undefined ? { piva: input.piva } : {}),
    ...(input.emailFatturazione !== undefined
      ? { emailFatturazione: input.emailFatturazione }
      : {}),
    ...(input.cadenzaFatturazione !== undefined
      ? { cadenzaFatturazione: input.cadenzaFatturazione }
      : {}),
    ...(input.tipoAllevamento !== undefined
      ? { tipoAllevamento: input.tipoAllevamento }
      : {}),
    ...(input.numeroCapi !== undefined ? { numeroCapi: input.numeroCapi } : {}),
    ...(input.telefono !== undefined ? { telefono: input.telefono } : {}),
    ...(input.note !== undefined ? { note: input.note } : {}),
    ...(input.armadiettoCanoneAnnuo !== undefined
      ? { armadiettoCanoneAnnuo: input.armadiettoCanoneAnnuo }
      : {}),
    createdAt: now,
    updatedAt: now,
    createdBy: actor.uid,
    updatedBy: actor.uid,
    createdByName: actor.displayName,
    updatedByName: actor.displayName,
    isDeleted: false,
    schemaVersion: 1,
  };
}

export interface AziendaUpdatePatch<TServerStamp, TDeleteSentinel> {
  nome: string;
  nomeNorm: string;
  indirizzo: string | TDeleteSentinel;
  piva: string | TDeleteSentinel;
  emailFatturazione: string | TDeleteSentinel;
  cadenzaFatturazione: string | TDeleteSentinel;
  tipoAllevamento: string | TDeleteSentinel;
  numeroCapi: number | TDeleteSentinel;
  telefono: string | TDeleteSentinel;
  note: string | TDeleteSentinel;
  armadiettoCanoneAnnuo: number | TDeleteSentinel;
  updatedAt: TServerStamp;
  updatedBy: string;
  updatedByName: string;
}

export interface AziendaUpdateDeps<TServerStamp, TDeleteSentinel> {
  serverTimestamp: () => TServerStamp;
  deleteField: () => TDeleteSentinel;
}

export function buildAziendaUpdatePatch<TServerStamp, TDeleteSentinel>(
  args: { input: AziendaInput; actor: ActorContext },
  deps: AziendaUpdateDeps<TServerStamp, TDeleteSentinel>
): AziendaUpdatePatch<TServerStamp, TDeleteSentinel> {
  const { input, actor } = args;
  const del = deps.deleteField();
  return {
    nome: input.nome,
    nomeNorm: normalizeAziendaNome(input.nome),
    indirizzo: input.indirizzo !== undefined ? input.indirizzo : del,
    piva: input.piva !== undefined ? input.piva : del,
    emailFatturazione:
      input.emailFatturazione !== undefined ? input.emailFatturazione : del,
    cadenzaFatturazione:
      input.cadenzaFatturazione !== undefined ? input.cadenzaFatturazione : del,
    tipoAllevamento:
      input.tipoAllevamento !== undefined ? input.tipoAllevamento : del,
    numeroCapi: input.numeroCapi !== undefined ? input.numeroCapi : del,
    telefono: input.telefono !== undefined ? input.telefono : del,
    note: input.note !== undefined ? input.note : del,
    armadiettoCanoneAnnuo:
      input.armadiettoCanoneAnnuo !== undefined
        ? input.armadiettoCanoneAnnuo
        : del,
    updatedAt: deps.serverTimestamp(),
    updatedBy: actor.uid,
    updatedByName: actor.displayName,
  };
}

export interface AziendaSoftDeletePatch<TServerStamp> {
  isDeleted: true;
  deletedAt: TServerStamp;
  updatedAt: TServerStamp;
  updatedBy: string;
  updatedByName: string;
}

export function buildAziendaSoftDeletePatch<TServerStamp>(
  args: { actor: ActorContext },
  deps: Pick<SerializerStampDeps<unknown, TServerStamp>, "serverTimestamp">
): AziendaSoftDeletePatch<TServerStamp> {
  const now = deps.serverTimestamp();
  return {
    isDeleted: true,
    deletedAt: now,
    updatedAt: now,
    updatedBy: args.actor.uid,
    updatedByName: args.actor.displayName,
  };
}

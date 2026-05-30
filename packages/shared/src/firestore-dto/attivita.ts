import { z } from "zod";
import type { Attivita } from "../domain/entities/Attivita.js";
import type { ActorContext } from "../domain/entities/ActorContext.js";
import {
  computeTotale,
  type AttivitaInput,
} from "../domain/schemas/attivita.js";
import { euroAmountSchema } from "../domain/schemas/money.js";
import { safeName } from "../domain/schemas/safeString.js";
import {
  timestampLike,
  timestampToDate,
  type SerializerStampDeps,
} from "./_shared.js";

const tariffaSchema = euroAmountSchema;

export const attivitaDtoSchema = z
  .object({
    data: timestampLike,
    aziendaId: z.string().min(1).max(64),
    aziendaNome: z.string().min(1).max(200),
    tipoId: z.string().min(1).max(64),
    tipoNome: z.string().min(1).max(80),
    oraria: z.boolean(),
    adElemento: z.boolean(),
    tariffa: tariffaSchema,
    ore: z.number().positive().max(24).optional(),
    elementi: z.number().int().positive().max(10_000).optional(),
    totale: z.number().nonnegative().max(2_400_000),
    note: z.string().max(2000).optional(),
    ownerUid: z.string().min(1).max(128),
    ownerEmail: z.string().email().max(120),
    ownerName: safeName(80),
    createdAt: timestampLike,
    updatedAt: timestampLike,
    isDeleted: z.boolean(),
    deletedAt: timestampLike.optional(),
    deletedBy: z.string().min(1).max(128).optional(),
    updatedBy: z.string().min(1).max(128).optional(),
    updatedByName: safeName(80).optional(),
    schemaVersion: z.literal(1),
  })
  .strict();

export type AttivitaDTO = z.infer<typeof attivitaDtoSchema>;

export function parseAttivita(id: string, raw: unknown): Attivita {
  const dto = attivitaDtoSchema.parse(raw);
  return {
    id,
    data: timestampToDate(dto.data),
    aziendaId: dto.aziendaId,
    aziendaNome: dto.aziendaNome,
    tipoId: dto.tipoId,
    tipoNome: dto.tipoNome,
    oraria: dto.oraria,
    adElemento: dto.adElemento,
    tariffa: dto.tariffa,
    ...(dto.ore !== undefined ? { ore: dto.ore } : {}),
    ...(dto.elementi !== undefined ? { elementi: dto.elementi } : {}),
    totale: dto.totale,
    ...(dto.note !== undefined ? { note: dto.note } : {}),
    ownerUid: dto.ownerUid,
    ownerEmail: dto.ownerEmail,
    ownerName: dto.ownerName,
    createdAt: timestampToDate(dto.createdAt),
    updatedAt: timestampToDate(dto.updatedAt),
    isDeleted: dto.isDeleted,
    ...(dto.deletedAt !== undefined
      ? { deletedAt: timestampToDate(dto.deletedAt) }
      : {}),
    ...(dto.deletedBy !== undefined ? { deletedBy: dto.deletedBy } : {}),
    ...(dto.updatedBy !== undefined ? { updatedBy: dto.updatedBy } : {}),
    ...(dto.updatedByName !== undefined
      ? { updatedByName: dto.updatedByName }
      : {}),
    schemaVersion: dto.schemaVersion,
  };
}

export interface AttivitaDenorm {
  aziendaNome: string;
  tipoNome: string;
}

export type AttivitaCreateWritePayload<TStamp, TServerStamp> = Omit<
  z.input<typeof attivitaDtoSchema>,
  "data" | "createdAt" | "updatedAt"
> & {
  data: TStamp;
  createdAt: TServerStamp;
  updatedAt: TServerStamp;
};

export function buildAttivitaCreateDoc<TStamp, TServerStamp>(
  args: {
    input: AttivitaInput;
    denorm: AttivitaDenorm;
    actor: ActorContext;
  },
  deps: SerializerStampDeps<TStamp, TServerStamp>
): AttivitaCreateWritePayload<TStamp, TServerStamp> {
  const { input, denorm, actor } = args;
  const now = deps.serverTimestamp();
  return {
    data: deps.fromDate(input.data),
    aziendaId: input.aziendaId,
    aziendaNome: denorm.aziendaNome,
    tipoId: input.tipoId,
    tipoNome: denorm.tipoNome,
    oraria: input.oraria,
    adElemento: input.adElemento,
    tariffa: input.tariffa,
    ...(input.ore !== undefined ? { ore: input.ore } : {}),
    ...(input.elementi !== undefined ? { elementi: input.elementi } : {}),
    totale: computeTotale(input),
    ...(input.note !== undefined ? { note: input.note } : {}),
    ownerUid: actor.uid,
    ownerEmail: actor.email,
    ownerName: actor.displayName,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
    schemaVersion: 1,
  };
}

export interface AttivitaUpdatePatch<TStamp, TServerStamp, TDeleteSentinel> {
  data: TStamp;
  aziendaId: string;
  aziendaNome: string;
  tipoId: string;
  tipoNome: string;
  oraria: boolean;
  adElemento: boolean;
  tariffa: number;
  ore: number | TDeleteSentinel;
  elementi: number | TDeleteSentinel;
  totale: number;
  note: string | TDeleteSentinel;
  updatedAt: TServerStamp;
  updatedBy: string;
  updatedByName: string;
}

export interface AttivitaUpdateDeps<TStamp, TServerStamp, TDeleteSentinel>
  extends SerializerStampDeps<TStamp, TServerStamp> {
  deleteField: () => TDeleteSentinel;
}

export function buildAttivitaUpdatePatch<TStamp, TServerStamp, TDeleteSentinel>(
  args: {
    input: AttivitaInput;
    denorm: AttivitaDenorm;
    actor: ActorContext;
  },
  deps: AttivitaUpdateDeps<TStamp, TServerStamp, TDeleteSentinel>
): AttivitaUpdatePatch<TStamp, TServerStamp, TDeleteSentinel> {
  const { input, denorm, actor } = args;
  const del = deps.deleteField();
  return {
    data: deps.fromDate(input.data),
    aziendaId: input.aziendaId,
    aziendaNome: denorm.aziendaNome,
    tipoId: input.tipoId,
    tipoNome: denorm.tipoNome,
    oraria: input.oraria,
    adElemento: input.adElemento,
    tariffa: input.tariffa,
    ore: input.ore !== undefined ? input.ore : del,
    elementi: input.elementi !== undefined ? input.elementi : del,
    totale: computeTotale(input),
    note: input.note !== undefined ? input.note : del,
    updatedAt: deps.serverTimestamp(),
    updatedBy: actor.uid,
    updatedByName: actor.displayName,
  };
}

export interface AttivitaSoftDeletePatch<TServerStamp> {
  isDeleted: true;
  deletedAt: TServerStamp;
  deletedBy: string;
  updatedAt: TServerStamp;
}

export function buildAttivitaSoftDeletePatch<TServerStamp>(
  args: { actor: ActorContext },
  deps: Pick<SerializerStampDeps<unknown, TServerStamp>, "serverTimestamp">
): AttivitaSoftDeletePatch<TServerStamp> {
  const now = deps.serverTimestamp();
  return {
    isDeleted: true,
    deletedAt: now,
    deletedBy: args.actor.uid,
    updatedAt: now,
  };
}

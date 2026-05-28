import { z } from "zod";
import type { Conto } from "../domain/entities/Conto.js";
import type { ActorContext } from "../domain/entities/ActorContext.js";
import {
  contoModalitaSchema,
  type ContoEmitInput,
} from "../domain/schemas/conto.js";
import { euroAmountSchema, metodoPagamentoSchema } from "../domain/schemas/money.js";
import {
  timestampLike,
  timestampToDate,
  type SerializerStampDeps,
} from "./_shared.js";

export type { SerializerStampDeps };

export const contoDtoSchema = z
  .object({
    aziendaId: z.string().min(1).max(64),
    aziendaNome: z.string().min(1).max(200),
    periodoFrom: timestampLike,
    periodoTo: timestampLike,
    attivitaIds: z.array(z.string().min(1).max(64)).max(10_000),
    totaleConto: z.number().nonnegative().max(2_400_000),
    armadiettoImporto: euroAmountSchema.optional(),
    modalita: contoModalitaSchema,
    saldato: z.boolean(),
    emittedAt: timestampLike,
    emittedBy: z.string().min(1).max(128),
    emittedByName: z.string().min(1).max(80),
    saldatoAt: timestampLike.optional(),
    saldatoBy: z.string().min(1).max(128).optional(),
    saldatoByName: z.string().min(1).max(80).optional(),
    importoSaldato: z.number().nonnegative().max(1_000_000).optional(),
    metodoPagamento: metodoPagamentoSchema.optional(),
    note: z.string().max(500).optional(),
    isDeleted: z.boolean(),
    deletedAt: timestampLike.optional(),
    deletedBy: z.string().min(1).max(128).optional(),
    schemaVersion: z.literal(1),
  })
  .strict();

export type ContoDTO = z.infer<typeof contoDtoSchema>;

export function parseConto(id: string, raw: unknown): Conto {
  const dto = contoDtoSchema.parse(raw);
  return {
    id,
    aziendaId: dto.aziendaId,
    aziendaNome: dto.aziendaNome,
    periodoFrom: timestampToDate(dto.periodoFrom),
    periodoTo: timestampToDate(dto.periodoTo),
    attivitaIds: [...dto.attivitaIds],
    totaleConto: dto.totaleConto,
    ...(dto.armadiettoImporto !== undefined
      ? { armadiettoImporto: dto.armadiettoImporto }
      : {}),
    modalita: dto.modalita,
    saldato: dto.saldato,
    emittedAt: timestampToDate(dto.emittedAt),
    emittedBy: dto.emittedBy,
    emittedByName: dto.emittedByName,
    ...(dto.saldatoAt !== undefined
      ? { saldatoAt: timestampToDate(dto.saldatoAt) }
      : {}),
    ...(dto.saldatoBy !== undefined ? { saldatoBy: dto.saldatoBy } : {}),
    ...(dto.saldatoByName !== undefined
      ? { saldatoByName: dto.saldatoByName }
      : {}),
    ...(dto.importoSaldato !== undefined
      ? { importoSaldato: dto.importoSaldato }
      : {}),
    ...(dto.metodoPagamento !== undefined
      ? { metodoPagamento: dto.metodoPagamento }
      : {}),
    ...(dto.note !== undefined ? { note: dto.note } : {}),
    isDeleted: dto.isDeleted,
    ...(dto.deletedAt !== undefined
      ? { deletedAt: timestampToDate(dto.deletedAt) }
      : {}),
    ...(dto.deletedBy !== undefined ? { deletedBy: dto.deletedBy } : {}),
    schemaVersion: dto.schemaVersion,
  };
}

export interface ContoEmitDenorm {
  aziendaNome: string;
  attivitaIds: readonly string[];
  totaleConto: number;
}

export type ContoEmitWritePayload<TStamp, TServerStamp> = Omit<
  z.input<typeof contoDtoSchema>,
  "periodoFrom" | "periodoTo" | "emittedAt"
> & {
  periodoFrom: TStamp;
  periodoTo: TStamp;
  emittedAt: TServerStamp;
};

export function buildContoEmitDoc<TStamp, TServerStamp>(
  args: {
    input: ContoEmitInput;
    denorm: ContoEmitDenorm;
    actor: ActorContext;
  },
  deps: SerializerStampDeps<TStamp, TServerStamp>
): ContoEmitWritePayload<TStamp, TServerStamp> {
  return {
    aziendaId: args.input.aziendaId,
    aziendaNome: args.denorm.aziendaNome,
    periodoFrom: deps.fromDate(args.input.periodoFrom),
    periodoTo: deps.fromDate(args.input.periodoTo),
    attivitaIds: [...args.denorm.attivitaIds],
    totaleConto: args.denorm.totaleConto,
    ...(args.input.armadiettoImporto !== undefined
      ? { armadiettoImporto: args.input.armadiettoImporto }
      : {}),
    modalita: args.input.modalita,
    saldato: false,
    emittedAt: deps.serverTimestamp(),
    emittedBy: args.actor.uid,
    emittedByName: args.actor.displayName,
    isDeleted: false,
    schemaVersion: 1,
  };
}

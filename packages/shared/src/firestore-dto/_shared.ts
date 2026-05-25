import { z } from "zod";

export const timestampLike = z
  .unknown()
  .refine(
    (v) =>
      v instanceof Date ||
      (typeof v === "object" &&
        v !== null &&
        "toDate" in v &&
        typeof (v as { toDate: () => Date }).toDate === "function"),
    { message: "expected Firestore Timestamp or Date" }
  );

export function timestampToDate(value: unknown): Date {
  if (value instanceof Date) return value;
  const asTimestamp = value as { toDate: () => Date };
  return asTimestamp.toDate();
}

export interface SerializerStampDeps<TStamp, TServerStamp> {
  fromDate: (d: Date) => TStamp;
  serverTimestamp: () => TServerStamp;
}

export function buildOptimisticEntity<TEntity>(args: {
  id: string;
  buildDoc: (deps: SerializerStampDeps<Date, Date>) => unknown;
  parse: (id: string, raw: unknown) => TEntity;
  now: Date;
}): TEntity {
  const payload = args.buildDoc({
    fromDate: (d) => d,
    serverTimestamp: () => args.now,
  });
  return args.parse(args.id, payload);
}

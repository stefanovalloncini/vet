import type { Azienda, Conto } from "@vet/shared";

export interface ContiByAzienda {
  readonly conti: ReadonlyArray<Conto>;
  readonly unsaldatiCount: number;
  readonly totaleUnsaldati: number;
  readonly hasUnsaldati: boolean;
  readonly lastEmittedAt: Date;
}

export type ContiByAziendaMap = ReadonlyMap<string, ContiByAzienda>;

export interface ContiCounters {
  readonly pending: number;
  readonly total: number;
  readonly totaleUnsaldati: number;
}

export function computeContiCounters(
  aziende: ReadonlyArray<Azienda>,
  grouped: ContiByAziendaMap
): ContiCounters {
  let pending = 0;
  let total = 0;
  let totaleUnsaldati = 0;
  for (const azienda of aziende) {
    const bucket = grouped.get(azienda.id);
    if (!bucket) continue;
    total += 1;
    if (bucket.hasUnsaldati) {
      pending += 1;
      totaleUnsaldati += bucket.totaleUnsaldati;
    }
  }
  return {
    pending,
    total,
    totaleUnsaldati: Math.round(totaleUnsaldati * 100) / 100,
  };
}

interface Bucket {
  conti: Conto[];
  lastEmittedAt: Date;
}

export function groupContiByAzienda(
  conti: ReadonlyArray<Conto>
): ContiByAziendaMap {
  const buckets = new Map<string, Bucket>();
  for (const c of conti) {
    const existing = buckets.get(c.aziendaId);
    if (existing) {
      existing.conti.push(c);
      if (c.emittedAt.getTime() > existing.lastEmittedAt.getTime()) {
        existing.lastEmittedAt = c.emittedAt;
      }
    } else {
      buckets.set(c.aziendaId, { conti: [c], lastEmittedAt: c.emittedAt });
    }
  }
  const out = new Map<string, ContiByAzienda>();
  for (const [aziendaId, bucket] of buckets) {
    const unsaldatiList = bucket.conti.filter(
      (c) => c.modalita === "emesso" && !c.saldato
    );
    const totaleUnsaldati = unsaldatiList.reduce(
      (s, c) => s + c.totaleConto,
      0
    );
    out.set(aziendaId, {
      conti: bucket.conti,
      unsaldatiCount: unsaldatiList.length,
      totaleUnsaldati: Math.round(totaleUnsaldati * 100) / 100,
      hasUnsaldati: unsaldatiList.length > 0,
      lastEmittedAt: bucket.lastEmittedAt,
    });
  }
  return out;
}

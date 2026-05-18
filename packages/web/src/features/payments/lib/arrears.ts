import type { Attivita, Azienda, Payment } from "@vet/shared";

export interface AziendaArrears {
  azienda: Azienda;
  lastPayment: Payment | null;
  unpaidTotal: number;
  unpaidCount: number;
  daysOverdue: number;
}

export function computeArrears(
  aziende: Azienda[],
  attivita: Attivita[],
  payments: Payment[],
  now: Date = new Date()
): AziendaArrears[] {
  const lastByAzienda = new Map<string, Payment>();
  for (const p of payments) {
    const cur = lastByAzienda.get(p.aziendaId);
    if (!cur || cur.periodoFinoA.getTime() < p.periodoFinoA.getTime()) {
      lastByAzienda.set(p.aziendaId, p);
    }
  }
  const attByAzienda = new Map<string, Attivita[]>();
  for (const a of attivita) {
    const arr = attByAzienda.get(a.aziendaId) ?? [];
    arr.push(a);
    attByAzienda.set(a.aziendaId, arr);
  }
  return aziende.map((azienda) => {
    const last = lastByAzienda.get(azienda.id) ?? null;
    const items = attByAzienda.get(azienda.id) ?? [];
    const cutoff = last ? last.periodoFinoA : new Date(0);
    const unpaid = items.filter((a) => a.data.getTime() > cutoff.getTime());
    const unpaidTotal = unpaid.reduce((s, a) => s + a.totale, 0);
    const earliestUnpaid = unpaid.reduce(
      (min, a) => (min === null || a.data < min ? a.data : min),
      null as Date | null
    );
    const daysOverdue = earliestUnpaid
      ? Math.max(
          0,
          Math.floor((now.getTime() - earliestUnpaid.getTime()) / 86_400_000)
        )
      : 0;
    return {
      azienda,
      lastPayment: last,
      unpaidTotal: Math.round(unpaidTotal * 100) / 100,
      unpaidCount: unpaid.length,
      daysOverdue,
    };
  });
}

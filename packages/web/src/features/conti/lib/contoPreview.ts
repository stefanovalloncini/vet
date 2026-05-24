import type { Attivita, Azienda } from "@vet/shared";
import type { CadenzaFatturazione } from "@vet/shared";

export interface ContoPreview {
  attivitaIds: string[];
  totaleConto: number;
  count: number;
}

export function computeContoPreview(
  items: ReadonlyArray<Attivita>,
  aziendaId: string,
  periodoFrom: Date,
  periodoTo: Date
): ContoPreview {
  const fromMs = periodoFrom.getTime();
  const toMs = periodoTo.getTime();
  const matching = items.filter(
    (a) =>
      a.aziendaId === aziendaId &&
      !a.isDeleted &&
      a.data.getTime() >= fromMs &&
      a.data.getTime() <= toMs
  );
  const totale = matching.reduce((s, a) => s + a.totale, 0);
  return {
    attivitaIds: matching.map((a) => a.id),
    totaleConto: Math.round(totale * 100) / 100,
    count: matching.length,
  };
}

export function defaultPeriodoFor(
  azienda: Pick<Azienda, "cadenzaFatturazione"> | undefined,
  now: Date = new Date()
): { from: Date; to: Date } {
  const cadenza: CadenzaFatturazione =
    azienda?.cadenzaFatturazione ?? "quarterly";
  const monthsBack =
    cadenza === "monthly" ? 1 : cadenza === "semiannual" ? 6 : 3;
  const start = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  return { from: start, to: end };
}

export function dateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

import type { Attivita } from "@vet/shared";
import { roundCents } from "../../../shared/lib/money";

export * from "./periodSelection";

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
    totaleConto: roundCents(totale),
    count: matching.length,
  };
}

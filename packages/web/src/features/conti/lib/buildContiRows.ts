import type { Azienda } from "@vet/shared";
import type { ContiByAzienda, ContiByAziendaMap } from "./groupContiByAzienda";

export interface ContoRow {
  readonly azienda: Azienda;
  readonly bucket: ContiByAzienda;
}

export function buildContiRows(
  aziende: ReadonlyArray<Azienda>,
  grouped: ContiByAziendaMap,
  onlyUnsaldati: boolean
): ReadonlyArray<ContoRow> {
  const rows: ContoRow[] = [];
  for (const azienda of aziende) {
    const bucket = grouped.get(azienda.id);
    if (!bucket) continue;
    if (onlyUnsaldati && !bucket.hasUnsaldati) continue;
    rows.push({ azienda, bucket });
  }
  return rows.sort((a, b) =>
    a.azienda.nomeNorm.localeCompare(b.azienda.nomeNorm, "it")
  );
}

export function sumDovuto(rows: ReadonlyArray<ContoRow>): number {
  let total = 0;
  for (const row of rows) total += row.bucket.totaleUnsaldati;
  return Math.round(total * 100) / 100;
}

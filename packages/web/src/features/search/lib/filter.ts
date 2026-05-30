import type { Attivita, Azienda } from "@vet/shared";

const AZIENDE_DEFAULT_LIMIT = 6;
const AZIENDE_MATCH_LIMIT = 8;
const ATTIVITA_MATCH_LIMIT = 6;

/**
 * Aziende matching the query (case-insensitive substring on name / normalized
 * name / phone). Empty/whitespace query returns the first few as suggestions.
 */
export function filterAziende(
  items: ReadonlyArray<Azienda>,
  query: string
): Azienda[] {
  const q = query.trim().toLowerCase();
  if (!q) return items.slice(0, AZIENDE_DEFAULT_LIMIT);
  return items
    .filter(
      (a) =>
        a.nomeNorm.includes(q) ||
        a.nome.toLowerCase().includes(q) ||
        (a.telefono ?? "").includes(q)
    )
    .slice(0, AZIENDE_MATCH_LIMIT);
}

/**
 * Attivita matching the query (azienda name / tipo / note). Empty/whitespace
 * query returns nothing (attivita are shown only when actively searching).
 */
export function filterAttivita(
  items: ReadonlyArray<Attivita>,
  query: string
): Attivita[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return items
    .filter(
      (a) =>
        a.aziendaNome.toLowerCase().includes(q) ||
        a.tipoNome.toLowerCase().includes(q) ||
        (a.note ?? "").toLowerCase().includes(q)
    )
    .slice(0, ATTIVITA_MATCH_LIMIT);
}

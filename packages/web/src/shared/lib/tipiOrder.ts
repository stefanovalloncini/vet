import { ALTRO_TIPO_ID, GINECOLOGIA_TIPO_ID, type ActivityType } from "@vet/shared";

export function sortTipiForEntry(
  tipi: ReadonlyArray<ActivityType>
): ReadonlyArray<ActivityType> {
  const ginecologia = tipi.filter((t) => t.id === GINECOLOGIA_TIPO_ID);
  const altro = tipi.filter((t) => t.id === ALTRO_TIPO_ID);
  const others = tipi
    .filter((t) => t.id !== GINECOLOGIA_TIPO_ID && t.id !== ALTRO_TIPO_ID)
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));
  return [...ginecologia, ...others, ...altro];
}

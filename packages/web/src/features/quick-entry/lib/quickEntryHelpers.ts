import {
  ALTRO_TIPO_ID,
  GINECOLOGIA_TIPO_ID,
  type ActivityType,
  type Attivita,
} from "@vet/shared";

export function defaultTariffaForTipo(
  tipoId: string,
  tipi: ReadonlyArray<ActivityType>
): string | null {
  if (!tipoId || tipoId === GINECOLOGIA_TIPO_ID) return null;
  const tipo = tipi.find((t) => t.id === tipoId);
  return tipo?.tariffaStandard !== undefined ? String(tipo.tariffaStandard) : null;
}

export function sortTipiForQuickEntry(
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

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export interface DuplicateCheckInput {
  items: ReadonlyArray<Attivita>;
  aziendaId: string;
  tipoId: string;
  date: Date;
}

export function hasDuplicateAttivita({
  items,
  aziendaId,
  tipoId,
  date,
}: DuplicateCheckInput): boolean {
  if (!aziendaId || !tipoId) return false;
  return items.some(
    (a) =>
      a.aziendaId === aziendaId &&
      a.tipoId === tipoId &&
      isSameDay(a.data, date)
  );
}

export function parseTariffa(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

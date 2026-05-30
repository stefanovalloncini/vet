import {
  GINECOLOGIA_TIPO_ID,
  type ActivityType,
  type Attivita,
} from "@vet/shared";
import { sortTipiForEntry } from "../../../shared/lib/tipiOrder";

export const sortTipiForQuickEntry = sortTipiForEntry;

export function defaultTariffaForTipo(
  tipoId: string,
  tipi: ReadonlyArray<ActivityType>
): string | null {
  if (!tipoId || tipoId === GINECOLOGIA_TIPO_ID) return null;
  const tipo = tipi.find((t) => t.id === tipoId);
  return tipo?.tariffaStandard !== undefined ? String(tipo.tariffaStandard) : null;
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

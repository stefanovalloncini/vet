import type { CadenzaFatturazione } from "@vet/shared";
import {
  previousFor,
  type PeriodKind,
  type PeriodSelection,
} from "../../lib/contoPreview";

export function defaultSelection(
  cadenza: CadenzaFatturazione | undefined,
  now: Date
): PeriodSelection {
  if (cadenza) return previousFor(cadenza, now);
  return previousFor("quarterly", now);
}

export function coerceSelection(
  year: number,
  kind: PeriodKind,
  now: Date
): PeriodSelection {
  if (kind === "monthly")
    return { kind, year, index: now.getMonth() + 1 };
  if (kind === "quarterly")
    return { kind, year, index: Math.floor(now.getMonth() / 3) + 1 };
  if (kind === "semiannual")
    return { kind, year, index: now.getMonth() < 6 ? 1 : 2 };
  if (kind === "annual") return { kind, year, index: 0 };
  return { kind: "custom", year, index: 0 };
}

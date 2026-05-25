import type { Attivita, Azienda } from "@vet/shared";
import type { CadenzaFatturazione } from "@vet/shared";
import { SHORT_MONTHS_IT } from "../../../shared/i18n/months";

export interface ContoPreview {
  attivitaIds: string[];
  totaleConto: number;
  count: number;
}

export type PeriodKind =
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "annual"
  | "custom";

export interface PeriodSelection {
  kind: PeriodKind;
  year: number;
  index: number;
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

export function monthRange(year: number, month1: number): { from: Date; to: Date } {
  const m = clamp(month1, 1, 12) - 1;
  return {
    from: new Date(year, m, 1),
    to: new Date(year, m + 1, 0, 23, 59, 59, 999),
  };
}

export function quarterRange(year: number, quarter: number): { from: Date; to: Date } {
  const q = clamp(quarter, 1, 4);
  const startMonth = (q - 1) * 3;
  return {
    from: new Date(year, startMonth, 1),
    to: new Date(year, startMonth + 3, 0, 23, 59, 59, 999),
  };
}

export function semesterRange(year: number, semester: number): { from: Date; to: Date } {
  const s = clamp(semester, 1, 2);
  const startMonth = (s - 1) * 6;
  return {
    from: new Date(year, startMonth, 1),
    to: new Date(year, startMonth + 6, 0, 23, 59, 59, 999),
  };
}

export function yearRange(year: number): { from: Date; to: Date } {
  return {
    from: new Date(year, 0, 1),
    to: new Date(year, 12, 0, 23, 59, 59, 999),
  };
}

export function rangeForSelection(sel: PeriodSelection): { from: Date; to: Date } {
  if (sel.kind === "monthly") return monthRange(sel.year, sel.index);
  if (sel.kind === "quarterly") return quarterRange(sel.year, sel.index);
  if (sel.kind === "semiannual") return semesterRange(sel.year, sel.index);
  if (sel.kind === "annual") return yearRange(sel.year);
  return { from: new Date(NaN), to: new Date(NaN) };
}

export function previousSelection(sel: PeriodSelection): PeriodSelection {
  if (sel.kind === "monthly") {
    return sel.index === 1
      ? { ...sel, year: sel.year - 1, index: 12 }
      : { ...sel, index: sel.index - 1 };
  }
  if (sel.kind === "quarterly") {
    return sel.index === 1
      ? { ...sel, year: sel.year - 1, index: 4 }
      : { ...sel, index: sel.index - 1 };
  }
  if (sel.kind === "semiannual") {
    return sel.index === 1
      ? { ...sel, year: sel.year - 1, index: 2 }
      : { ...sel, index: sel.index - 1 };
  }
  if (sel.kind === "annual") return { ...sel, year: sel.year - 1 };
  return sel;
}

export function nextSelection(sel: PeriodSelection): PeriodSelection {
  if (sel.kind === "monthly") {
    return sel.index === 12
      ? { ...sel, year: sel.year + 1, index: 1 }
      : { ...sel, index: sel.index + 1 };
  }
  if (sel.kind === "quarterly") {
    return sel.index === 4
      ? { ...sel, year: sel.year + 1, index: 1 }
      : { ...sel, index: sel.index + 1 };
  }
  if (sel.kind === "semiannual") {
    return sel.index === 2
      ? { ...sel, year: sel.year + 1, index: 1 }
      : { ...sel, index: sel.index + 1 };
  }
  if (sel.kind === "annual") return { ...sel, year: sel.year + 1 };
  return sel;
}

export function detectPeriodSelection(
  from: Date,
  to: Date
): PeriodSelection {
  if (
    Number.isNaN(from.getTime()) ||
    Number.isNaN(to.getTime()) ||
    from.getTime() > to.getTime()
  ) {
    return { kind: "custom", year: NaN, index: 0 };
  }
  const sameYear = from.getFullYear() === to.getFullYear();
  if (
    sameYear &&
    from.getMonth() === 0 &&
    from.getDate() === 1 &&
    to.getMonth() === 11 &&
    to.getDate() === 31
  ) {
    return { kind: "annual", year: from.getFullYear(), index: 0 };
  }
  if (
    sameYear &&
    from.getDate() === 1 &&
    from.getMonth() % 6 === 0 &&
    to.getMonth() === from.getMonth() + 5 &&
    to.getDate() === new Date(from.getFullYear(), to.getMonth() + 1, 0).getDate()
  ) {
    return {
      kind: "semiannual",
      year: from.getFullYear(),
      index: from.getMonth() === 0 ? 1 : 2,
    };
  }
  if (
    sameYear &&
    from.getDate() === 1 &&
    from.getMonth() % 3 === 0 &&
    to.getMonth() === from.getMonth() + 2 &&
    to.getDate() === new Date(from.getFullYear(), to.getMonth() + 1, 0).getDate()
  ) {
    return {
      kind: "quarterly",
      year: from.getFullYear(),
      index: Math.floor(from.getMonth() / 3) + 1,
    };
  }
  if (
    sameYear &&
    from.getDate() === 1 &&
    from.getMonth() === to.getMonth() &&
    to.getDate() === new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate()
  ) {
    return {
      kind: "monthly",
      year: from.getFullYear(),
      index: from.getMonth() + 1,
    };
  }
  return { kind: "custom", year: from.getFullYear(), index: 0 };
}

export function selectionFromNow(
  kind: Exclude<PeriodKind, "custom">,
  now: Date = new Date()
): PeriodSelection {
  const y = now.getFullYear();
  if (kind === "monthly") return { kind, year: y, index: now.getMonth() + 1 };
  if (kind === "quarterly")
    return { kind, year: y, index: Math.floor(now.getMonth() / 3) + 1 };
  if (kind === "semiannual")
    return { kind, year: y, index: now.getMonth() < 6 ? 1 : 2 };
  return { kind: "annual", year: y, index: 0 };
}

export function previousFor(
  cadenza: CadenzaFatturazione,
  now: Date = new Date()
): PeriodSelection {
  return previousSelection(selectionFromNow(cadenza, now));
}

export function defaultPeriodoFor(
  azienda: Pick<Azienda, "cadenzaFatturazione"> | undefined,
  now: Date = new Date()
): { from: Date; to: Date } {
  const cadenza = azienda?.cadenzaFatturazione;
  if (cadenza) return rangeForSelection(previousFor(cadenza, now));
  const from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  return { from, to };
}

export function expectedLastPeriodoTo(
  cadenza: CadenzaFatturazione,
  now: Date = new Date()
): Date {
  return rangeForSelection(previousFor(cadenza, now)).to;
}

const QUARTER_LABEL = ["T1", "T2", "T3", "T4"];
const SEMESTER_LABEL = ["S1", "S2"];

export function periodoLabel(
  from: Date,
  to: Date,
  cadenza?: CadenzaFatturazione
): string {
  const sel = detectPeriodSelection(from, to);
  if (sel.kind === "quarterly") return `${QUARTER_LABEL[sel.index - 1]} ${sel.year}`;
  if (sel.kind === "semiannual") return `${SEMESTER_LABEL[sel.index - 1]} ${sel.year}`;
  if (sel.kind === "monthly") {
    const m = SHORT_MONTHS_IT[sel.index - 1] ?? "";
    return `${m} ${sel.year}`;
  }
  if (sel.kind === "annual") return String(sel.year);
  if (cadenza === "quarterly" && from.getFullYear() === to.getFullYear()) {
    return `T${Math.floor(from.getMonth() / 3) + 1} ${from.getFullYear()}`;
  }
  const fromLabel = `${SHORT_MONTHS_IT[from.getMonth()] ?? ""} ${from.getFullYear()}`;
  const toLabel = `${SHORT_MONTHS_IT[to.getMonth()] ?? ""} ${to.getFullYear()}`;
  return fromLabel === toLabel ? fromLabel : `${fromLabel} – ${toLabel}`;
}

export function selectionLabel(sel: PeriodSelection): string {
  if (sel.kind === "quarterly") return `${QUARTER_LABEL[sel.index - 1]} ${sel.year}`;
  if (sel.kind === "semiannual") return `${SEMESTER_LABEL[sel.index - 1]} ${sel.year}`;
  if (sel.kind === "monthly") {
    const m = SHORT_MONTHS_IT[sel.index - 1] ?? "";
    return `${m} ${sel.year}`;
  }
  if (sel.kind === "annual") return String(sel.year);
  return "Personalizzato";
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

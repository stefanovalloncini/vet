import { mondayIndex } from "../../../shared/lib/format";

export interface WeekDay {
  date: Date;
  isToday: boolean;
}

export function buildWeekStrip(anchor: Date, today: Date = new Date()): WeekDay[] {
  const start = startOfWeek(anchor);
  const out: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    out.push({ date: d, isToday: sameDay(d, today) });
  }
  return out;
}

export function startOfWeek(d: Date): Date {
  const dayOfWeek = mondayIndex(d);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - dayOfWeek, 0, 0, 0, 0);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 0, 0, 0, 0);
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

import type { Attivita } from "@vet/shared";
import { dateInputValue, mondayIndex } from "../../../shared/lib/format";

export interface WeekDay {
  date: Date;
  isToday: boolean;
}

export interface WeekDayColumn extends WeekDay {
  items: Attivita[];
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

export function groupWeekByWeekday(
  anchor: Date,
  items: Attivita[],
  today: Date = new Date()
): WeekDayColumn[] {
  const week = buildWeekStrip(anchor, today);
  const byDay = new Map<string, Attivita[]>();
  for (const a of items) {
    const key = dateInputValue(a.data);
    const bucket = byDay.get(key);
    if (bucket) bucket.push(a);
    else byDay.set(key, [a]);
  }
  return week.map((d) => {
    const dayItems = (byDay.get(dateInputValue(d.date)) ?? [])
      .slice()
      .sort((a, b) => a.data.getTime() - b.data.getTime());
    return { ...d, items: dayItems };
  });
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

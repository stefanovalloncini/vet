import { remindersI18n as t } from "../i18n";

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function daysUntil(d: Date): number {
  const a = new Date(d);
  a.setHours(0, 0, 0, 0);
  const b = new Date();
  b.setHours(0, 0, 0, 0);
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

export function humanDays(days: number, done: boolean): string {
  if (done) return t.fatto;
  if (days < 0) return `${t.scaduto} di ${-days} ${t.giorni}`;
  if (days === 0) return t.oggi;
  if (days === 1) return t.domani;
  return `${t.tra} ${days} ${t.giorni}`;
}

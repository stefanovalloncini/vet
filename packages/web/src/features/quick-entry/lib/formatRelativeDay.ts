const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export function formatRelativeDay(date: Date, now: Date): string {
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (diffDays === 0) return "oggi";
  if (diffDays === 1) return "ieri";
  if (diffDays > 1 && diffDays < 7) return `${diffDays}g fa`;
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

const euroFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DATE_INPUT_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function formatEuro(value: number): string {
  return euroFormatter.format(value);
}

export function formatDate(value: Date): string {
  return dateFormatter.format(value);
}

export function dateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateInput(value: string): Date | null {
  const m = DATE_INPUT_RE.exec(value);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

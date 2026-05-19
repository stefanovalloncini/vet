export function sanitizeTel(raw: string): string {
  return raw.replace(/[^\d+\s()-]/g, "");
}

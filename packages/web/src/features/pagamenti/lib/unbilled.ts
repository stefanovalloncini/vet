import type { Attivita, Conto } from "@vet/shared";

/**
 * The set of attivita ids already covered by a finalized (emesso, non-deleted)
 * conto. This is the exact billed signal; comparing an activity's calendar date
 * against a conto's emittedAt wall-clock is a category error that both
 * over- and under-counts.
 */
export function collectBilledAttivitaIds(
  conti: ReadonlyArray<Conto>
): Set<string> {
  const billed = new Set<string>();
  for (const c of conti) {
    if (c.isDeleted || c.modalita !== "emesso") continue;
    for (const id of c.attivitaIds) billed.add(id);
  }
  return billed;
}

export function hasUnbilledAttivita(
  list: ReadonlyArray<Attivita> | undefined,
  billedIds: ReadonlySet<string>
): boolean {
  if (!list || list.length === 0) return false;
  for (const a of list) {
    if (!billedIds.has(a.id)) return true;
  }
  return false;
}

import type { Azienda } from "@vet/shared";

/**
 * Pinned aziende float to the top; within each group, alphabetical by the
 * normalized name (Italian collation). Does not mutate the input array.
 */
export function sortAziendeByPinned(
  items: ReadonlyArray<Azienda>,
  pinned: ReadonlySet<string>
): Azienda[] {
  return [...items].sort((a, b) => {
    const ap = pinned.has(a.id) ? 0 : 1;
    const bp = pinned.has(b.id) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return a.nomeNorm.localeCompare(b.nomeNorm, "it");
  });
}

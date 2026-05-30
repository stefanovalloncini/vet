import type { Conto } from "@vet/shared";

export function countAlreadyBilled(
  attivitaIds: ReadonlyArray<string>,
  conti: ReadonlyArray<Conto>
): number {
  const billed = new Set<string>();
  for (const c of conti) {
    if (c.modalita === "emesso" && !c.isDeleted) {
      for (const id of c.attivitaIds) billed.add(id);
    }
  }
  let count = 0;
  for (const id of attivitaIds) {
    if (billed.has(id)) count += 1;
  }
  return count;
}

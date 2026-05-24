import type { Attivita } from "@vet/shared";

const DEFAULT_LIMIT = 5;

export interface Combo {
  aziendaId: string;
  aziendaNome: string;
  tipoId: string;
  tipoNome: string;
  tariffa: number;
  lastUsed: Date;
  count: number;
}

export interface ComputeCombosResult {
  recents: ReadonlyArray<Combo>;
  frequents: ReadonlyArray<Combo>;
}

interface ComputeOptions {
  limit?: number;
}

function comboKey(a: Pick<Attivita, "aziendaId" | "tipoId">): string {
  return `${a.aziendaId}\u0000${a.tipoId}`;
}

export function computeCombos(
  items: ReadonlyArray<Attivita>,
  opts: ComputeOptions = {}
): ComputeCombosResult {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const map = new Map<string, Combo>();

  for (const item of items) {
    if (item.isDeleted) continue;
    if (item.oraria) continue;
    const key = comboKey(item);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        aziendaId: item.aziendaId,
        aziendaNome: item.aziendaNome,
        tipoId: item.tipoId,
        tipoNome: item.tipoNome,
        tariffa: item.tariffa,
        lastUsed: item.data,
        count: 1,
      });
      continue;
    }
    existing.count += 1;
    if (item.data.getTime() > existing.lastUsed.getTime()) {
      existing.lastUsed = item.data;
      existing.tariffa = item.tariffa;
      existing.aziendaNome = item.aziendaNome;
      existing.tipoNome = item.tipoNome;
    }
  }

  const combos = Array.from(map.values());

  const recents = [...combos]
    .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
    .slice(0, limit);

  const frequents = [...combos]
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.lastUsed.getTime() - a.lastUsed.getTime();
    })
    .slice(0, limit);

  return { recents, frequents };
}

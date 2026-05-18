import type { TrashService } from "../domain/ports/TrashService.js";
import type { InMemoryAttivitaRepository } from "./InMemoryAttivitaRepository.js";

export class InMemoryTrashService implements TrashService {
  constructor(
    private readonly attivita: InMemoryAttivitaRepository,
    private readonly currentUid: () => string | null
  ) {}

  async restoreAttivita(id: string): Promise<void> {
    const a = await this.attivita.getById(id);
    if (!a || !a.isDeleted) return;
    const map = (this.attivita as unknown as { map: Map<string, typeof a> }).map;
    const restored = { ...a, isDeleted: false };
    delete (restored as Record<string, unknown>)["deletedAt"];
    delete (restored as Record<string, unknown>)["deletedBy"];
    map.set(id, restored);
  }

  async purgeAttivita(id: string): Promise<void> {
    const map = (this.attivita as unknown as { map: Map<string, unknown> }).map;
    map.delete(id);
  }

  async gdprDeleteMine(): Promise<{ attivita: number; userDoc: boolean }> {
    const uid = this.currentUid();
    if (!uid) return { attivita: 0, userDoc: false };
    const map = (this.attivita as unknown as {
      map: Map<string, { ownerUid: string }>;
    }).map;
    let count = 0;
    for (const [k, v] of map) {
      if (v.ownerUid === uid) {
        map.delete(k);
        count++;
      }
    }
    return { attivita: count, userDoc: false };
  }
}

import type { TrashService } from "@vet/shared";

export class NotSupportedTrashService implements TrashService {
  async restoreAttivita(): Promise<void> {
    throw new Error(
      "TrashService.restoreAttivita is a client-only callable proxy; handlers should not invoke it"
    );
  }

  async purgeAttivita(): Promise<void> {
    throw new Error(
      "TrashService.purgeAttivita is a client-only callable proxy; handlers should not invoke it"
    );
  }

  async gdprDeleteMine(): Promise<{ attivita: number; userDoc: boolean }> {
    throw new Error(
      "TrashService.gdprDeleteMine is a client-only callable proxy; handlers should not invoke it"
    );
  }
}

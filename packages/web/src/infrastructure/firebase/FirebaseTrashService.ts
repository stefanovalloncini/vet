import { httpsCallable, type Functions } from "firebase/functions";
import type { TrashService } from "@vet/shared";

export class FirebaseTrashService implements TrashService {
  constructor(private readonly functions: Functions) {}

  async restoreAttivita(id: string): Promise<void> {
    const fn = httpsCallable(this.functions, "restoreAttivita");
    await fn({ id });
  }

  async purgeAttivita(id: string): Promise<void> {
    const fn = httpsCallable(this.functions, "purgeAttivita");
    await fn({ id });
  }

  async gdprDeleteMine(): Promise<{ attivita: number; userDoc: boolean }> {
    const fn = httpsCallable<unknown, { ok: boolean; erased: { attivita: number; userDoc: boolean } }>(
      this.functions,
      "gdprDeleteMine"
    );
    const res = await fn({});
    return res.data.erased;
  }
}

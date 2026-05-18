import type { AllowlistEntry } from "../entities/AllowlistEntry";
import type { AllowlistEntryInput } from "../schemas/allowlist";

export interface AllowlistRepository {
  getByEmail(email: string): Promise<AllowlistEntry | null>;
  list(): Promise<AllowlistEntry[]>;
  add(input: AllowlistEntryInput, actor: string): Promise<void>;
  remove(email: string): Promise<void>;
}

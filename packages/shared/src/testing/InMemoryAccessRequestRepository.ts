import type { AccessRequest } from "../domain/entities/AccessRequest.js";
import type { AccessRequestRepository } from "../domain/ports/AccessRequestRepository.js";
import { normalizeEmail } from "../domain/schemas/allowlist.js";

export class InMemoryAccessRequestRepository implements AccessRequestRepository {
  private readonly map = new Map<string, AccessRequest>();

  async list(): Promise<AccessRequest[]> {
    return [...this.map.values()].sort(
      (a, b) => b.lastAttemptAt.getTime() - a.lastAttemptAt.getTime()
    );
  }

  async getByEmail(emailNorm: string): Promise<AccessRequest | null> {
    return this.map.get(emailNorm) ?? null;
  }

  upsertForTest(req: AccessRequest): void {
    this.map.set(req.emailNorm, req);
  }

  recordAttemptForTest(input: {
    email: string;
    displayName?: string;
    photoURL?: string;
    providerId?: string;
    now: Date;
  }): AccessRequest {
    const emailNorm = normalizeEmail(input.email);
    const existing = this.map.get(emailNorm);
    const next: AccessRequest = existing
      ? {
          ...existing,
          email: input.email,
          ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
          ...(input.photoURL !== undefined ? { photoURL: input.photoURL } : {}),
          ...(input.providerId !== undefined ? { providerId: input.providerId } : {}),
          lastAttemptAt: input.now,
          attempts: existing.attempts + 1,
        }
      : {
          emailNorm,
          email: input.email,
          ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
          ...(input.photoURL !== undefined ? { photoURL: input.photoURL } : {}),
          ...(input.providerId !== undefined ? { providerId: input.providerId } : {}),
          firstAttemptAt: input.now,
          lastAttemptAt: input.now,
          attempts: 1,
          schemaVersion: 1,
        };
    this.map.set(emailNorm, next);
    return next;
  }

  deleteForTest(emailNorm: string): void {
    this.map.delete(emailNorm);
  }
}

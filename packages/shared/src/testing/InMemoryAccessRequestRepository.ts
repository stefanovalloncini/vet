import type { AccessRequest } from "../domain/entities/AccessRequest.js";
import type {
  AccessRequestRecordResult,
  AccessRequestRepository,
} from "../domain/ports/AccessRequestRepository.js";
import { normalizeEmail } from "../domain/schemas/allowlist.js";
import {
  decideAccessRequestUpdate,
  type AccessRequestRecordInput,
} from "../firestore-dto/accessRequest.js";

export class InMemoryAccessRequestRepository implements AccessRequestRepository {
  private readonly map = new Map<string, AccessRequest>();
  private readonly clock: () => Date;

  constructor(clock?: () => Date) {
    this.clock = clock ?? (() => new Date());
  }

  async list(): Promise<AccessRequest[]> {
    return [...this.map.values()].sort(
      (a, b) => b.lastAttemptAt.getTime() - a.lastAttemptAt.getTime()
    );
  }

  async getByEmail(emailNorm: string): Promise<AccessRequest | null> {
    return this.map.get(emailNorm) ?? null;
  }

  async delete(emailNorm: string): Promise<void> {
    this.map.delete(emailNorm);
  }

  async record(input: AccessRequestRecordInput): Promise<AccessRequestRecordResult> {
    const existing = this.map.get(input.emailNorm) ?? null;
    const now = this.clock();
    const decision = decideAccessRequestUpdate({
      existing,
      input,
      now,
    });
    if (decision.kind === "capped") {
      return { kind: "storm", attempts: decision.attempts };
    }
    if (decision.kind === "storm") {
      if (existing) {
        this.map.set(input.emailNorm, {
          ...existing,
          lastAttemptAt: now,
        });
      }
      return { kind: "storm", attempts: decision.attempts };
    }
    if (decision.kind === "create") {
      this.map.set(input.emailNorm, {
        emailNorm: input.emailNorm,
        email: input.email,
        ...(input.displayName !== undefined
          ? { displayName: input.displayName }
          : {}),
        ...(input.photoURL !== undefined ? { photoURL: input.photoURL } : {}),
        ...(input.providerId !== undefined
          ? { providerId: input.providerId }
          : {}),
        firstAttemptAt: now,
        lastAttemptAt: now,
        attempts: 1,
        schemaVersion: 1,
      });
      return { kind: "create", attempts: 1 };
    }
    const nextAttempts = (existing?.attempts ?? 0) + 1;
    if (existing) {
      this.map.set(input.emailNorm, {
        ...existing,
        email: input.email,
        ...(input.displayName !== undefined
          ? { displayName: input.displayName }
          : {}),
        ...(input.photoURL !== undefined ? { photoURL: input.photoURL } : {}),
        ...(input.providerId !== undefined
          ? { providerId: input.providerId }
          : {}),
        lastAttemptAt: now,
        attempts: nextAttempts,
      });
    }
    return { kind: "update", attempts: nextAttempts };
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

import type { AuditRepository } from "@vet/shared";
import { adminDb } from "../admin/firebaseAdmin.js";
import { FirestoreAuditRepository } from "./firestore/AuditRepository.js";

let auditRepoCache: AuditRepository | null = null;

export function getAuditRepository(): AuditRepository {
  if (!auditRepoCache) {
    auditRepoCache = new FirestoreAuditRepository(adminDb);
  }
  return auditRepoCache;
}

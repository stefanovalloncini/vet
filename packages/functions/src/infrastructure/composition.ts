import {
  SystemClock,
  type AuditRepository,
  type Repositories,
  type Tx,
} from "@vet/shared";
import { type Transaction } from "firebase-admin/firestore";
import { adminDb } from "../admin/firebaseAdmin.js";
import { FirestoreAccessRequestRepository } from "./firestore/AccessRequestRepository.js";
import { FirestoreActivityTypesRepository } from "./firestore/ActivityTypesRepository.js";
import { FirestoreAllowlistRepository } from "./firestore/AllowlistRepository.js";
import { FirestoreAttivitaRepository } from "./firestore/AttivitaRepository.js";
import { FirestoreAuditRepository } from "./firestore/AuditRepository.js";
import { NotSupportedAuthService } from "./firestore/AuthService.js";
import { FirestoreAziendeRepository } from "./firestore/AziendeRepository.js";
import { FirestoreContiRepository } from "./firestore/ContiRepository.js";
import { FirestoreRemindersRepository } from "./firestore/RemindersRepository.js";
import { FirestoreRoleRepository } from "./firestore/RoleRepository.js";
import { NotSupportedTrashService } from "./firestore/TrashService.js";
import { FirestoreUserRepository } from "./firestore/UserRepository.js";

let repositoriesCache: Repositories | null = null;

function buildTx(tx?: Transaction): Tx {
  return {
    clock: new SystemClock(),
    users: new FirestoreUserRepository(adminDb),
    roles: new FirestoreRoleRepository(adminDb, tx),
    allowlist: new FirestoreAllowlistRepository(adminDb, tx),
    accessRequests: new FirestoreAccessRequestRepository(adminDb, tx),
    aziende: new FirestoreAziendeRepository(adminDb),
    activityTypes: new FirestoreActivityTypesRepository(adminDb),
    attivita: new FirestoreAttivitaRepository(adminDb),
    trash: new NotSupportedTrashService(),
    audit: new FirestoreAuditRepository(adminDb, tx),
    conti: new FirestoreContiRepository(adminDb),
    reminders: new FirestoreRemindersRepository(adminDb),
    auth: new NotSupportedAuthService(),
  };
}

export function getRepositories(): Repositories {
  if (!repositoriesCache) {
    const nonTx = buildTx();
    repositoriesCache = {
      ...nonTx,
      run: <T>(work: (tx: Tx) => Promise<T>): Promise<T> =>
        adminDb.runTransaction((transaction) => work(buildTx(transaction))),
    };
  }
  return repositoriesCache;
}

export function getAuditRepository(): AuditRepository {
  return getRepositories().audit;
}

export function resetRepositoriesForTest(): void {
  repositoriesCache = null;
}

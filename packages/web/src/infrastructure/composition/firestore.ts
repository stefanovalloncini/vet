import { SystemClock, type Repositories } from "@vet/shared";
import { initFirebase } from "../firestore/client";
import { FirestoreUserRepository } from "../firestore/FirestoreUserRepository";
import { FirestoreRoleRepository } from "../firestore/FirestoreRoleRepository";
import { FirestoreAllowlistRepository } from "../firestore/FirestoreAllowlistRepository";
import { FirestoreAccessRequestRepository } from "../firestore/FirestoreAccessRequestRepository";
import { FirestoreAziendeRepository } from "../firestore/FirestoreAziendeRepository";
import { FirestoreActivityTypesRepository } from "../firestore/FirestoreActivityTypesRepository";
import { FirestoreAttivitaRepository } from "../firestore/FirestoreAttivitaRepository";
import { FirestoreAuditRepository } from "../firestore/FirestoreAuditRepository";
import { FirestorePaymentsRepository } from "../firestore/FirestorePaymentsRepository";
import { FirestoreRemindersRepository } from "../firestore/FirestoreRemindersRepository";
import { FirebaseAuthService } from "../firebase/FirebaseAuthService";
import { FirebaseTrashService } from "../firebase/FirebaseTrashService";
import { loadVetEnv } from "./env";

export function createFirestoreRepositories(): Repositories {
  const env = loadVetEnv();
  const { firestore, auth, functions } = initFirebase(env);
  return {
    clock: new SystemClock(),
    users: new FirestoreUserRepository(firestore),
    roles: new FirestoreRoleRepository(firestore),
    allowlist: new FirestoreAllowlistRepository(firestore),
    accessRequests: new FirestoreAccessRequestRepository(firestore),
    aziende: new FirestoreAziendeRepository(firestore),
    activityTypes: new FirestoreActivityTypesRepository(firestore),
    attivita: new FirestoreAttivitaRepository(firestore),
    trash: new FirebaseTrashService(functions),
    audit: new FirestoreAuditRepository(firestore),
    payments: new FirestorePaymentsRepository(firestore),
    reminders: new FirestoreRemindersRepository(firestore),
    auth: new FirebaseAuthService(auth, firestore),
  };
}

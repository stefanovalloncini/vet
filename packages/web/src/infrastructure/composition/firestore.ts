import { SystemClock, type Repositories } from "@vet/shared";
import { initFirebase } from "../firestore/client";
import { FirestoreUserRepository } from "../firestore/FirestoreUserRepository";
import { FirestoreRoleRepository } from "../firestore/FirestoreRoleRepository";
import { FirestoreAllowlistRepository } from "../firestore/FirestoreAllowlistRepository";
import { FirestoreAziendeRepository } from "../firestore/FirestoreAziendeRepository";
import { FirestoreActivityTypesRepository } from "../firestore/FirestoreActivityTypesRepository";
import { FirestoreAttivitaRepository } from "../firestore/FirestoreAttivitaRepository";
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
    aziende: new FirestoreAziendeRepository(firestore),
    activityTypes: new FirestoreActivityTypesRepository(firestore),
    attivita: new FirestoreAttivitaRepository(firestore),
    trash: new FirebaseTrashService(functions),
    auth: new FirebaseAuthService(auth),
  };
}

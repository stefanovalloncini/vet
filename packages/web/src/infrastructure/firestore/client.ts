import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
  connectFirestoreEmulator,
} from "firebase/firestore";
import {
  getAuth,
  connectAuthEmulator,
  type Auth,
} from "firebase/auth";
import {
  getFunctions,
  connectFunctionsEmulator,
  type Functions,
} from "firebase/functions";

interface VetFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  useEmulator: boolean;
}

let app: FirebaseApp | undefined;
let firestore: Firestore | undefined;
let auth: Auth | undefined;
let functions: Functions | undefined;

export function initFirebase(config: VetFirebaseConfig): {
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  functions: Functions;
} {
  if (!app) {
    app = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      appId: config.appId,
    });
    firestore = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
    auth = getAuth(app);
    functions = getFunctions(app, "europe-west8");
    if (config.useEmulator) {
      connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
      connectAuthEmulator(auth, "http://127.0.0.1:9099", {
        disableWarnings: true,
      });
      connectFunctionsEmulator(functions, "127.0.0.1", 5001);
    }
  }
  return { app: app!, firestore: firestore!, auth: auth!, functions: functions! };
}

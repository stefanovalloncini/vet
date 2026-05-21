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
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  type AppCheck,
} from "firebase/app-check";
import { probeAppCheckOnInit, reportAppCheckFailure } from "./appCheckReporter";

interface VetFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  useEmulator: boolean;
  appCheckSiteKey?: string;
  appCheckDebugToken?: string;
}

let app: FirebaseApp | undefined;
let firestore: Firestore | undefined;
let auth: Auth | undefined;
let functions: Functions | undefined;
let appCheck: AppCheck | undefined;

export function getAppCheckInstance(): AppCheck | undefined {
  return appCheck;
}

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

    if (config.appCheckDebugToken && typeof window !== "undefined") {
      (
        window as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: string | true }
      ).FIREBASE_APPCHECK_DEBUG_TOKEN = config.appCheckDebugToken;
    }

    if (!config.useEmulator) {
      if (!config.appCheckSiteKey) {
        throw new Error(
          "App Check site key missing: refusing to start without App Check"
        );
      }
      try {
        appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaEnterpriseProvider(config.appCheckSiteKey),
          isTokenAutoRefreshEnabled: true,
        });
        void probeAppCheckOnInit(appCheck, app);
      } catch (err) {
        const reason = err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200);
        void reportAppCheckFailure(app, { stage: "init", reason });
      }
    }

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
  void appCheck;
  return { app: app!, firestore: firestore!, auth: auth!, functions: functions! };
}

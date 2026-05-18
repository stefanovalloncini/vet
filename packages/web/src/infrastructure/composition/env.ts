interface VetEnv {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  useEmulator: boolean;
}

export function loadVetEnv(): VetEnv {
  const env = import.meta.env;
  const useEmulator = env.VITE_FIREBASE_USE_EMULATOR === "true";
  return {
    apiKey: env.VITE_FIREBASE_API_KEY ?? "fake-emulator-api-key",
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? "vet-dev.firebaseapp.com",
    projectId: env.VITE_FIREBASE_PROJECT_ID ?? "vet-dev",
    appId: env.VITE_FIREBASE_APP_ID ?? "fake-emulator-app-id",
    useEmulator,
  };
}

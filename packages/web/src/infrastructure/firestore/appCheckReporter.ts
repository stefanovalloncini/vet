import { getFunctions, httpsCallable } from "firebase/functions";
import { getToken, type AppCheck } from "firebase/app-check";
import type { FirebaseApp } from "firebase/app";

type Stage = "init" | "getToken";
type ProjectStage = "prod" | "preview" | "dev";

interface FailurePayload {
  stage: Stage;
  reason: string;
  userAgent?: string;
  screenWidth?: number;
  screenHeight?: number;
  projectStage?: ProjectStage;
}

const alreadyReported = new Set<string>();

function projectStage(): ProjectStage {
  if (typeof window === "undefined") return "dev";
  const h = window.location.hostname;
  if (h === "gestionale.stefanovalloncini.com") return "prod";
  if (h.endsWith(".workers.dev")) return "preview";
  return "dev";
}

export async function reportAppCheckFailure(
  app: FirebaseApp,
  payload: Omit<FailurePayload, "userAgent" | "screenWidth" | "screenHeight" | "projectStage">
): Promise<void> {
  const key = `${payload.stage}:${payload.reason}`;
  if (alreadyReported.has(key)) return;
  alreadyReported.add(key);

  const full: FailurePayload = {
    ...payload,
    projectStage: projectStage(),
    ...(typeof navigator !== "undefined"
      ? { userAgent: navigator.userAgent.slice(0, 400) }
      : {}),
    ...(typeof window !== "undefined" && window.screen
      ? { screenWidth: window.screen.width, screenHeight: window.screen.height }
      : {}),
  };

  try {
    const fn = httpsCallable(getFunctions(app, "europe-west8"), "logAppCheckFailure");
    await fn(full);
  } catch {
    // telemetry must never break the app
  }
}

export async function probeAppCheckOnInit(
  appCheck: AppCheck,
  app: FirebaseApp
): Promise<void> {
  try {
    await getToken(appCheck, false);
  } catch (err) {
    const reason = err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200);
    void reportAppCheckFailure(app, { stage: "getToken", reason });
  }
}

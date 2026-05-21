import { getToken } from "firebase/app-check";
import { getAppCheckInstance } from "../../../infrastructure/firestore/client";

export type ProbeName = "cookies" | "localStorage" | "appCheckToken";

export interface ProbeResult {
  name: ProbeName;
  ok: boolean;
  reason?: string;
}

function stringifyError(e: unknown): string {
  if (e instanceof Error) return e.message.slice(0, 200);
  return String(e).slice(0, 200);
}

export async function probeCookies(): Promise<ProbeResult> {
  try {
    if (typeof document === "undefined" || !("cookie" in document)) {
      return { name: "cookies", ok: false, reason: "document.cookie unavailable" };
    }
    const probe = `__vet_probe_${Date.now()}`;
    document.cookie = `${probe}=1; SameSite=Strict; Max-Age=10`;
    const ok = document.cookie.includes(probe);
    document.cookie = `${probe}=; SameSite=Strict; Max-Age=0`;
    return { name: "cookies", ok, ...(ok ? {} : { reason: "cookie write did not persist" }) };
  } catch (err) {
    return { name: "cookies", ok: false, reason: stringifyError(err) };
  }
}

export async function probeLocalStorage(): Promise<ProbeResult> {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return { name: "localStorage", ok: false, reason: "localStorage unavailable" };
    }
    const k = `__vet_probe_${Date.now()}`;
    window.localStorage.setItem(k, "1");
    const ok = window.localStorage.getItem(k) === "1";
    window.localStorage.removeItem(k);
    return { name: "localStorage", ok, ...(ok ? {} : { reason: "write did not persist" }) };
  } catch (err) {
    return { name: "localStorage", ok: false, reason: stringifyError(err) };
  }
}

export async function probeAppCheckToken(): Promise<ProbeResult> {
  try {
    const appCheck = getAppCheckInstance();
    if (!appCheck) {
      return {
        name: "appCheckToken",
        ok: false,
        reason: "App Check non inizializzato (probabilmente emulatore o site key mancante)",
      };
    }
    await getToken(appCheck, false);
    return { name: "appCheckToken", ok: true };
  } catch (err) {
    return { name: "appCheckToken", ok: false, reason: stringifyError(err) };
  }
}

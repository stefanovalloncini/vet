import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";

const DEFAULT_MAX_AGE_SECONDS = 5 * 60;

export interface RecentAuthOptions {
  maxAgeSeconds?: number;
  nowSeconds?: number;
}

export function ensureRecentAuth(
  request: Pick<CallableRequest, "auth">,
  options: RecentAuthOptions = {}
): void {
  const maxAge = options.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS;
  const now = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const authTime = request.auth?.token.auth_time;
  if (typeof authTime !== "number") {
    throw new HttpsError("failed-precondition", "requires-recent-login");
  }
  if (now - authTime > maxAge) {
    throw new HttpsError("failed-precondition", "requires-recent-login");
  }
}

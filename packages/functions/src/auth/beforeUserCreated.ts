import { beforeUserCreated as beforeUserCreatedFn, HttpsError } from "firebase-functions/v2/identity";
import { logger } from "firebase-functions/v2";
import { normalizeEmail } from "@vet/shared";
import { getRepositories } from "../infrastructure/composition.js";
import { recordAccessRequest } from "./accessRequestLog.js";
import { recordAuthDenyAudit, type AuthDenyReason } from "./auditDenyLog.js";

function denyAndThrow(reason: AuthDenyReason, context: Record<string, unknown>): never {
  logger.warn("auth.beforeUserCreated.deny", { reason, ...context });
  throw new HttpsError("permission-denied", "");
}

const ALLOWED_PROVIDERS = new Set(["google.com", "password"]);

export function checkProviderEligibility(input: {
  provider?: string | undefined;
  emailVerified?: boolean | undefined;
}): AuthDenyReason | null {
  if (input.provider && !ALLOWED_PROVIDERS.has(input.provider)) {
    return "provider-not-allowed";
  }
  if (input.provider === "password" && input.emailVerified !== true) {
    return "email-not-verified";
  }
  return null;
}

export const beforeUserCreated: ReturnType<typeof beforeUserCreatedFn> =
  beforeUserCreatedFn({ region: "europe-west8" }, async (event) => {
    const email = event.data?.email;
    const uid = event.data?.uid;
    const eventType = event.eventType;
    const provider = event.data?.providerData?.[0]?.providerId;
    const emailVerified = event.data?.emailVerified;

    if (!email) {
      await recordAuthDenyAudit({
        emailNorm: "unknown",
        email: "unknown",
        actorUid: uid,
        reason: "missing-email",
        source: "beforeUserCreated",
        eventType,
      });
      denyAndThrow("missing-email", { uid, eventType });
    }

    const norm = normalizeEmail(email);

    const providerReason = checkProviderEligibility({ provider, emailVerified });
    if (providerReason) {
      await recordAuthDenyAudit({
        emailNorm: norm,
        email,
        actorUid: uid,
        reason: providerReason,
        source: "beforeUserCreated",
        eventType,
      });
      denyAndThrow(providerReason, { email: norm, uid, provider, eventType });
    }
    const allow = await getRepositories().allowlist.getByEmail(email);
    if (allow) {
      logger.info("auth.beforeUserCreated.allow", { email: norm, uid, eventType });
      return {};
    }

    await recordAccessRequest({
      email,
      displayName: event.data?.displayName,
      photoURL: event.data?.photoURL,
      providerId: event.data?.providerData?.[0]?.providerId,
      source: "beforeUserCreated",
    });

    await recordAuthDenyAudit({
      emailNorm: norm,
      email,
      actorUid: uid,
      reason: "allowlist-miss",
      source: "beforeUserCreated",
      eventType,
    });

    denyAndThrow("allowlist-miss", { email: norm, uid, eventType });
  });

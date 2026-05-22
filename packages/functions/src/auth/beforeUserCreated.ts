import { beforeUserCreated as beforeUserCreatedFn, HttpsError } from "firebase-functions/v2/identity";
import { logger } from "firebase-functions/v2";
import { adminDb } from "../admin/firebaseAdmin.js";
import { normalizeEmail } from "@vet/shared";
import { recordAccessRequest } from "./accessRequestLog.js";

export {
  decideAccessRequestUpdate,
  type AccessRequestDecisionInput,
  type AccessRequestDecision,
} from "./accessRequestLog.js";

type DenyReason = "missing-email" | "allowlist-miss";

function denyAndThrow(reason: DenyReason, context: Record<string, unknown>): never {
  logger.warn("auth.beforeUserCreated.deny", { reason, ...context });
  throw new HttpsError("permission-denied", "");
}

export const beforeUserCreated: ReturnType<typeof beforeUserCreatedFn> =
  beforeUserCreatedFn({ region: "europe-west8" }, async (event) => {
    const email = event.data?.email;
    const uid = event.data?.uid;
    const eventType = event.eventType;

    if (!email) {
      denyAndThrow("missing-email", { uid, eventType });
    }

    const norm = normalizeEmail(email);
    const allowSnap = await adminDb.collection("allowlist").doc(norm).get();
    if (allowSnap.exists) {
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

    denyAndThrow("allowlist-miss", { email: norm, uid, eventType });
  });

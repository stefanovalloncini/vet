import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { getRepositories } from "../infrastructure/composition.js";
import { toHttpsError } from "../infrastructure/httpsErrors.js";
import {
  decodeCaps,
  normalizeEmail,
  rejectAccessRequestInputSchema,
} from "@vet/shared";

export const rejectAccessRequest = onCall(
  { region: "europe-west8", enforceAppCheck: true },
  async (request) => {
    const actorUid = request.auth?.uid;
    const rawCaps = (request.auth?.token?.caps as string[] | undefined) ?? [];
    if (!actorUid || !decodeCaps(rawCaps).includes("allowlist.manage")) {
      throw new HttpsError("permission-denied", "");
    }

    let input;
    try {
      input = rejectAccessRequestInputSchema.parse(request.data);
    } catch {
      throw new HttpsError("invalid-argument", "");
    }

    const emailNorm = normalizeEmail(input.email);
    const actorEmail = (request.auth?.token?.email as string | undefined) ?? "";
    const repos = getRepositories();

    try {
      await repos.run(async (tx) => {
        const existing = await tx.accessRequests.getByEmail(emailNorm);
        if (!existing) {
          throw new HttpsError("not-found", "");
        }
        await tx.accessRequests.delete(emailNorm);
      });
    } catch (err) {
      throw toHttpsError(err);
    }

    await repos.audit.record({
      actorUid,
      actorEmail,
      action: "access_request.reject",
      targetType: "access_request",
      targetId: emailNorm,
      details: { email: input.email },
    });

    logger.info("auth.rejectAccessRequest", { actorUid, email: emailNorm });

    return { ok: true as const };
  }
);

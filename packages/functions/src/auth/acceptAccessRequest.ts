import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { getRepositories } from "../infrastructure/composition.js";
import { toHttpsError } from "../infrastructure/httpsErrors.js";
import {
  acceptAccessRequestInputSchema,
  decodeCaps,
  normalizeEmail,
} from "@vet/shared";

export const acceptAccessRequest = onCall(
  { region: "europe-west8", enforceAppCheck: true },
  async (request) => {
    const actorUid = request.auth?.uid;
    const rawCaps = (request.auth?.token?.caps as string[] | undefined) ?? [];
    if (!actorUid || !decodeCaps(rawCaps).includes("allowlist.manage")) {
      throw new HttpsError("permission-denied", "");
    }

    let input;
    try {
      input = acceptAccessRequestInputSchema.parse(request.data);
    } catch {
      throw new HttpsError("invalid-argument", "");
    }

    const emailNorm = normalizeEmail(input.email);
    const actorEmail = (request.auth?.token?.email as string | undefined) ?? "";
    const repos = getRepositories();

    try {
      await repos.run(async (tx) => {
        const [requestEntry, role, existingAllow] = await Promise.all([
          tx.accessRequests.getByEmail(emailNorm),
          tx.roles.getById(input.roleId),
          tx.allowlist.getByEmail(input.email),
        ]);
        if (!requestEntry) {
          throw new HttpsError("not-found", "");
        }
        if (!role) {
          throw new HttpsError("failed-precondition", "");
        }
        if (!existingAllow) {
          await tx.allowlist.add(
            { email: input.email, defaultRoleId: input.roleId },
            actorUid
          );
        }
        await tx.accessRequests.delete(emailNorm);
      });
    } catch (err) {
      throw toHttpsError(err);
    }

    await repos.audit.record({
      actorUid,
      actorEmail,
      action: "access_request.accept",
      targetType: "access_request",
      targetId: emailNorm,
      details: { roleId: input.roleId, email: input.email },
    });

    logger.info("auth.acceptAccessRequest", {
      actorUid,
      email: emailNorm,
      roleId: input.roleId,
    });

    return { ok: true as const };
  }
);

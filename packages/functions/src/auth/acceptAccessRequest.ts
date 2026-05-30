import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { getRepositories } from "../infrastructure/composition.js";
import { toHttpsError } from "../infrastructure/httpsErrors.js";
import {
  acceptAccessRequestInputSchema,
  actorCanAssignRole,
  normalizeEmail,
} from "@vet/shared";
import { readActorClaims } from "./actorClaims.js";

export function ensureCanAcceptAccessRequest(actor: {
  uid: string | undefined;
  caps: readonly string[];
}): string {
  if (!actor.uid || !actor.caps.includes("allowlist.manage")) {
    throw new HttpsError("permission-denied", "");
  }
  return actor.uid;
}

export function ensureAssignableRole(roleId: string): void {
  if (roleId === "admin") {
    throw new HttpsError("invalid-argument", "");
  }
}

export const acceptAccessRequest = onCall(
  { region: "europe-west8", enforceAppCheck: true },
  async (request) => {
    const { email: actorEmail, caps } = readActorClaims(request.auth?.token);
    const actorUid = ensureCanAcceptAccessRequest({
      uid: request.auth?.uid,
      caps,
    });

    let input;
    try {
      input = acceptAccessRequestInputSchema.parse(request.data);
    } catch {
      throw new HttpsError("invalid-argument", "");
    }
    ensureAssignableRole(input.roleId);

    const emailNorm = normalizeEmail(input.email);
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
        if (!actorCanAssignRole(role.capabilities, caps)) {
          throw new HttpsError("permission-denied", "");
        }
        if (!existingAllow) {
          await tx.allowlist.add(
            { email: input.email, defaultRoleId: input.roleId },
            actorUid
          );
        }
        await tx.accessRequests.delete(emailNorm);
        await tx.audit.record({
          actorUid,
          actorEmail,
          action: "access_request.accept",
          targetType: "access_request",
          targetId: emailNorm,
          details: { roleId: input.roleId, email: input.email },
        });
      });
    } catch (err) {
      throw toHttpsError(err);
    }

    logger.info("auth.acceptAccessRequest", {
      actorUid,
      email: emailNorm,
      roleId: input.roleId,
    });

    return { ok: true as const };
  }
);

import { beforeUserSignedIn, HttpsError } from "firebase-functions/v2/identity";
import { logger } from "firebase-functions/v2";
import { adminDb } from "../admin/firebaseAdmin.js";
import type { Capability } from "@vet/shared";
import { encodeCaps, normalizeEmail } from "@vet/shared";

interface ComposeInput {
  roleId: string;
  capabilities: Capability[];
  capsVer: number;
}

export function composeClaims(input: ComposeInput) {
  return {
    vet: true as const,
    roleId: input.roleId,
    caps: encodeCaps(input.capabilities),
    capsVer: input.capsVer,
  };
}

type DenyReason =
  | "missing-email"
  | "allowlist-miss"
  | "role-missing";

function denyAndThrow(reason: DenyReason, context: Record<string, unknown>): never {
  logger.warn("auth.beforeSignIn.deny", { reason, ...context });
  throw new HttpsError("permission-denied", "");
}

export const beforeSignIn: ReturnType<typeof beforeUserSignedIn> = beforeUserSignedIn(
  { region: "europe-west8" },
  async (event) => {
    const email = event.data?.email;
    const uid = event.data?.uid;
    const eventType = event.eventType;

    if (!email) {
      denyAndThrow("missing-email", { uid, eventType });
    }

    const norm = normalizeEmail(email);
    const allowSnap = await adminDb.collection("allowlist").doc(norm).get();
    if (!allowSnap.exists) {
      denyAndThrow("allowlist-miss", { email: norm, uid, eventType });
    }
    const allow = allowSnap.data() as { defaultRoleId: string };

    let roleId = allow.defaultRoleId;
    interface ExistingUser {
      roleId?: string;
      displayName?: string;
      createdAt?: unknown;
    }
    let existingUser: ExistingUser | null = null;

    if (uid) {
      const userSnap = await adminDb.collection("users").doc(uid).get();
      if (userSnap.exists) {
        existingUser = (userSnap.data() ?? null) as ExistingUser | null;
        if (existingUser?.roleId) roleId = existingUser.roleId;
      }
    }

    const roleSnap = await adminDb.collection("roles").doc(roleId).get();
    if (!roleSnap.exists) {
      denyAndThrow("role-missing", { email: norm, uid, roleId, eventType });
    }
    const role = roleSnap.data() as { capabilities: Capability[] };

    const now = new Date();
    const isFirst = !existingUser;
    const displayName = existingUser?.displayName
      ?? event.data?.displayName
      ?? email.split("@")[0];

    const claims = {
      ...composeClaims({
        roleId,
        capabilities: role.capabilities,
        capsVer: Date.now(),
      }),
      name: displayName,
    };

    if (uid) {
      await adminDb.collection("users").doc(uid).set(
        {
          email,
          displayName,
          roleId,
          disabled: false,
          ...(isFirst ? { createdAt: now } : {}),
          updatedAt: now,
          lastSignInAt: now,
          schemaVersion: 1,
        },
        { merge: true }
      );
    }

    logger.info("auth.beforeSignIn.allow", {
      email: norm,
      uid,
      roleId,
      isFirst,
      eventType,
    });

    return {
      customClaims: claims,
    };
  }
);

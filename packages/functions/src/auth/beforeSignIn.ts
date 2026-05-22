import { beforeUserSignedIn, HttpsError } from "firebase-functions/v2/identity";
import { logger } from "firebase-functions/v2";
import { adminDb } from "../admin/firebaseAdmin.js";
import type { Capability } from "@vet/shared";
import { encodeCaps, normalizeEmail } from "@vet/shared";
import { recordAccessRequest } from "./accessRequestLog.js";

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

interface DecideInput {
  allow: { defaultRoleId: string };
  existing: { approved?: boolean; roleId?: string; displayName?: string } | null;
  role: { capabilities: ReadonlyArray<Capability>; capsVer?: number };
  email: string;
  displayName: string;
  now: Date;
}

interface DecideOutput {
  customClaims?: object;
  userPatch: Record<string, unknown>;
  isFirst: boolean;
}

export function decideAuthResult(input: DecideInput): DecideOutput {
  const { allow, existing, role, email, displayName, now } = input;
  const isFirst = !existing;
  const approved = existing?.approved === true;

  const basePatch: Record<string, unknown> = {
    email,
    displayName,
    disabled: false,
    updatedAt: now,
    lastSignInAt: now,
    schemaVersion: 1,
  };
  if (isFirst) {
    basePatch["createdAt"] = now;
    basePatch["approved"] = false;
    basePatch["roleId"] = allow.defaultRoleId;
  }

  if (!approved) {
    return { userPatch: basePatch, isFirst };
  }

  const roleId = existing?.roleId ?? allow.defaultRoleId;
  const claims = {
    ...composeClaims({
      roleId,
      capabilities: [...role.capabilities],
      capsVer: role.capsVer ?? 0,
    }),
    name: existing?.displayName ?? displayName,
  };

  return { customClaims: claims, userPatch: basePatch, isFirst };
}

type DenyReason = "missing-email" | "allowlist-miss" | "role-missing";

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
      await recordAccessRequest({
        email,
        displayName: event.data?.displayName,
        photoURL: event.data?.photoURL,
        providerId: event.data?.providerData?.[0]?.providerId,
        source: "beforeSignIn",
      });
      denyAndThrow("allowlist-miss", { email: norm, uid, eventType });
    }
    const allow = allowSnap.data() as { defaultRoleId: string };

    type ExistingUser = { approved?: boolean; roleId?: string; displayName?: string };
    let existingUser: ExistingUser | null = null;
    if (uid) {
      const userSnap = await adminDb.collection("users").doc(uid).get();
      existingUser = userSnap.exists ? ((userSnap.data() ?? null) as ExistingUser | null) : null;
    }

    const roleId = existingUser?.roleId ?? allow.defaultRoleId;
    const roleSnap = await adminDb.collection("roles").doc(roleId).get();
    if (!roleSnap.exists) {
      denyAndThrow("role-missing", { email: norm, uid, roleId, eventType });
    }
    const role = roleSnap.data() as { capabilities: Capability[]; capsVer?: number };

    const displayName = existingUser?.displayName
      ?? event.data?.displayName
      ?? email.split("@")[0]
      ?? email;
    const now = new Date();
    const decision = decideAuthResult({
      allow,
      existing: existingUser,
      role,
      email,
      displayName,
      now,
    });

    if (uid) {
      await adminDb.collection("users").doc(uid).set(decision.userPatch, { merge: true });
    }

    logger.info(
      decision.customClaims
        ? "auth.beforeSignIn.allow"
        : "auth.beforeSignIn.pending",
      {
        email: norm,
        uid,
        roleId,
        isFirst: decision.isFirst,
        eventType,
      }
    );

    return decision.customClaims ? { customClaims: decision.customClaims } : {};
  }
);

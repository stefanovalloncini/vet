import { beforeUserSignedIn, HttpsError } from "firebase-functions/v2/identity";
import { adminDb } from "../admin/firebaseAdmin.js";
import type { Capability } from "@vet/shared";
import { normalizeEmail } from "@vet/shared";

interface ComposeInput {
  roleId: string;
  capabilities: Capability[];
  capsVer: number;
}

export function composeClaims(input: ComposeInput) {
  return {
    vet: true as const,
    roleId: input.roleId,
    caps: input.capabilities,
    capsVer: input.capsVer,
  };
}

export const beforeSignIn: ReturnType<typeof beforeUserSignedIn> = beforeUserSignedIn(
  { region: "europe-west8" },
  async (event) => {
    const email = event.data?.email;
    if (!email) {
      throw new HttpsError("permission-denied", "missing email");
    }

    const norm = normalizeEmail(email);
    const allowSnap = await adminDb.collection("allowlist").doc(norm).get();
    if (!allowSnap.exists) {
      throw new HttpsError("permission-denied", "email not allowed");
    }
    const allow = allowSnap.data() as { defaultRoleId: string };

    const uid = event.data?.uid;
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
      throw new HttpsError("permission-denied", "role not found");
    }
    const role = roleSnap.data() as { capabilities: Capability[] };

    const claims = composeClaims({
      roleId,
      capabilities: role.capabilities,
      capsVer: Date.now(),
    });

    if (uid) {
      const now = new Date();
      const isFirst = !existingUser;
      const displayName = existingUser?.displayName
        ?? event.data?.displayName
        ?? email.split("@")[0];
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

    return {
      customClaims: claims,
    };
  }
);

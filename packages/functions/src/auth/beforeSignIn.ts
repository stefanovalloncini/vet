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

    if (uid) {
      const userSnap = await adminDb.collection("users").doc(uid).get();
      if (userSnap.exists) {
        const u = userSnap.data() as { roleId?: string };
        if (u.roleId) roleId = u.roleId;
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
      await adminDb.collection("users").doc(uid).set(
        {
          email,
          displayName: event.data?.displayName ?? email.split("@")[0],
          roleId,
          disabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignInAt: new Date(),
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

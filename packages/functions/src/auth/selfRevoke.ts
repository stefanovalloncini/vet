import { onCall, HttpsError } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "../admin/firebaseAdmin.js";

interface Caller {
  uid: string;
  email: string;
}

export function ensureCallerSignedIn(caller: Caller | null): asserts caller is Caller {
  if (!caller) throw new HttpsError("unauthenticated", "");
}

export const selfRevoke = onCall(
  { region: "europe-west8", enforceAppCheck: true },
  async (request) => {
    const auth = request.auth;
    const caller: Caller | null = auth
      ? { uid: auth.uid, email: (auth.token.email as string) ?? "" }
      : null;

    ensureCallerSignedIn(caller);

    await adminAuth.revokeRefreshTokens(caller.uid);

    await adminDb.collection("audit").add({
      at: Timestamp.now(),
      actorUid: caller.uid,
      actorEmail: caller.email,
      action: "user.session.self-revoke",
      targetType: "user",
      targetId: caller.uid,
    });

    return { ok: true as const };
  }
);

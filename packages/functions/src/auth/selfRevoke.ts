import { onCall, HttpsError } from "firebase-functions/v2/https";
import { adminAuth } from "../admin/firebaseAdmin.js";
import { getRepositories } from "../infrastructure/composition.js";

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

    const repos = getRepositories();

    await adminAuth.revokeRefreshTokens(caller.uid);
    await repos.users.applyRevokeSessionPatch(caller.uid, {
      minCapsVer: Date.now(),
    });

    await repos.audit.record({
      actorUid: caller.uid,
      actorEmail: caller.email,
      action: "user.session.self-revoke",
      targetType: "user",
      targetId: caller.uid,
    });

    return { ok: true as const };
  }
);

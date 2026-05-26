import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { adminAuth } from "../admin/firebaseAdmin.js";
import { getRepositories } from "../infrastructure/composition.js";
import { decodeCaps } from "@vet/shared";
import { ensureRecentAuth } from "./recentAuth.js";

const inputSchema = z.object({ uid: z.string().min(1).max(128) }).strict();

interface Caller {
  uid: string;
  caps: string[];
}

export function ensureCanRevoke(caller: Caller | null): void {
  if (!caller) throw new HttpsError("unauthenticated", "");
  if (!caller.caps.includes("allowlist.manage")) {
    throw new HttpsError("permission-denied", "");
  }
}

export const revokeUserSession = onCall(
  { region: "europe-west8", enforceAppCheck: true },
  async (request) => {
    const auth = request.auth;
    const caller: Caller | null = auth
      ? { uid: auth.uid, caps: decodeCaps((auth.token.caps as string[]) ?? []) }
      : null;

    ensureCanRevoke(caller);
    ensureRecentAuth(request);

    let uid: string;
    try {
      ({ uid } = inputSchema.parse(request.data));
    } catch {
      throw new HttpsError("invalid-argument", "");
    }

    const repos = getRepositories();

    await adminAuth.revokeRefreshTokens(uid);
    await adminAuth.updateUser(uid, { disabled: true });
    await repos.users.applyRevokeSessionPatch(uid, {
      disabled: true,
      minCapsVer: Date.now(),
    });
    await repos.audit.record({
      actorUid: caller!.uid,
      actorEmail: (auth?.token.email as string) ?? "",
      action: "user.session.revoke",
      targetType: "user",
      targetId: uid,
    });

    return { ok: true };
  }
);

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { adminAuth, adminDb } from "../admin/firebaseAdmin.js";

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
  { region: "europe-west8" },
  async (request) => {
    const auth = request.auth;
    const caller: Caller | null = auth
      ? { uid: auth.uid, caps: (auth.token.caps as string[]) ?? [] }
      : null;

    ensureCanRevoke(caller);

    const { uid } = inputSchema.parse(request.data);

    await adminAuth.revokeRefreshTokens(uid);
    await adminDb.collection("audit").add({
      at: new Date(),
      actorUid: caller!.uid,
      actorEmail: (auth?.token.email as string) ?? "",
      action: "user.session.revoke",
      targetType: "user",
      targetId: uid,
    });

    return { ok: true };
  }
);

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { adminDb } from "../admin/firebaseAdmin.js";
import { FieldValue } from "firebase-admin/firestore";

const inputSchema = z.object({ id: z.string().min(1).max(64) }).strict();

interface Caller {
  uid: string;
  email: string;
  caps: string[];
}

export function ensureCanPurge(caller: Caller | null): void {
  if (!caller) throw new HttpsError("unauthenticated", "");
  if (!caller.caps.includes("trash.purge")) {
    throw new HttpsError("permission-denied", "");
  }
}

export const purgeAttivita = onCall(
  { region: "europe-west8" },
  async (request) => {
    const auth = request.auth;
    const caller: Caller | null = auth
      ? {
          uid: auth.uid,
          email: (auth.token.email as string) ?? "",
          caps: (auth.token.caps as string[]) ?? [],
        }
      : null;

    ensureCanPurge(caller);

    const { id } = inputSchema.parse(request.data);

    const ref = adminDb.collection("attivita").doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError("not-found", "");
    const data = snap.data();
    if (!data || data["isDeleted"] !== true) {
      throw new HttpsError("failed-precondition", "");
    }

    await ref.delete();
    await adminDb.collection("audit").add({
      at: FieldValue.serverTimestamp(),
      actorUid: caller!.uid,
      actorEmail: caller!.email,
      action: "attivita.purge",
      targetType: "attivita",
      targetId: id,
      details: { ownerUid: data["ownerUid"] },
    });

    return { ok: true };
  }
);

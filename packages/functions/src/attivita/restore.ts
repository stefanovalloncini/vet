import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { adminDb } from "../admin/firebaseAdmin.js";
import { FieldValue } from "firebase-admin/firestore";
import { decodeCaps } from "@vet/shared";

const inputSchema = z.object({ id: z.string().min(1).max(64) }).strict();

interface Caller {
  uid: string;
  email: string;
  caps: string[];
}

export function ensureCanRestore(
  caller: Caller | null,
  ownerUid: string
): void {
  if (!caller) throw new HttpsError("unauthenticated", "");
  const ownsIt = caller.uid === ownerUid;
  if (ownsIt && caller.caps.includes("trash.restore.own")) return;
  if (caller.caps.includes("trash.restore.any")) return;
  throw new HttpsError("permission-denied", "");
}

export const restoreAttivita = onCall(
  { region: "europe-west8", enforceAppCheck: true },
  async (request) => {
    const auth = request.auth;
    if (!auth) throw new HttpsError("unauthenticated", "");
    const caller: Caller = {
      uid: auth.uid,
      email: (auth.token.email as string) ?? "",
      caps: decodeCaps((auth.token.caps as string[]) ?? []),
    };

    let id: string;
    try {
      ({ id } = inputSchema.parse(request.data));
    } catch {
      throw new HttpsError("invalid-argument", "");
    }

    const ref = adminDb.collection("attivita").doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError("not-found", "");
    const data = snap.data();
    if (!data || data["isDeleted"] !== true) {
      throw new HttpsError("failed-precondition", "");
    }
    ensureCanRestore(caller, data["ownerUid"] as string);

    await ref.update({
      isDeleted: false,
      deletedAt: FieldValue.delete(),
      deletedBy: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await adminDb.collection("audit").add({
      at: FieldValue.serverTimestamp(),
      actorUid: caller.uid,
      actorEmail: caller.email,
      action: "attivita.restore",
      targetType: "attivita",
      targetId: id,
    });

    return { ok: true };
  }
);

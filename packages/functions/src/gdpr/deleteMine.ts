import { onCall, HttpsError } from "firebase-functions/v2/https";
import { adminAuth, adminDb } from "../admin/firebaseAdmin.js";
import { FieldValue } from "firebase-admin/firestore";

const BATCH_SIZE = 400;

export const gdprDeleteMine = onCall(
  { region: "europe-west8" },
  async (request) => {
    const auth = request.auth;
    if (!auth) throw new HttpsError("unauthenticated", "");
    const uid = auth.uid;
    const email = (auth.token.email as string) ?? "";

    const erased = await eraseUserData(uid);

    await adminDb.collection("audit").add({
      at: FieldValue.serverTimestamp(),
      actorUid: uid,
      actorEmail: email,
      action: "gdpr.erasure",
      targetType: "user",
      targetId: uid,
      details: { attivitaDeleted: erased.attivita, userDocDeleted: erased.userDoc },
    });

    try {
      await adminAuth.deleteUser(uid);
    } catch {
      // user might have been already removed; continue
    }

    return { ok: true, erased };
  }
);

async function eraseUserData(uid: string): Promise<{
  attivita: number;
  userDoc: boolean;
}> {
  let total = 0;
  for (;;) {
    const snap = await adminDb
      .collection("attivita")
      .where("ownerUid", "==", uid)
      .limit(BATCH_SIZE)
      .get();
    if (snap.empty) break;
    const batch = adminDb.batch();
    for (const doc of snap.docs) batch.delete(doc.ref);
    await batch.commit();
    total += snap.size;
    if (snap.size < BATCH_SIZE) break;
  }

  let userDoc = false;
  const userRef = adminDb.collection("users").doc(uid);
  const userSnap = await userRef.get();
  if (userSnap.exists) {
    await userRef.delete();
    userDoc = true;
  }

  return { attivita: total, userDoc };
}

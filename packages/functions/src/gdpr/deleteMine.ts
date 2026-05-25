import { onCall, HttpsError } from "firebase-functions/v2/https";
import { adminAuth, adminDb } from "../admin/firebaseAdmin.js";
import { getAuditRepository } from "../infrastructure/composition.js";
import { normalizeEmail } from "@vet/shared";

const BATCH_SIZE = 400;
const ANON_UID = "deleted-user";
const ANON_NAME = "—";

export const gdprDeleteMine = onCall(
  { region: "europe-west8", enforceAppCheck: true },
  async (request) => {
    const auth = request.auth;
    if (!auth) throw new HttpsError("unauthenticated", "");
    const uid = auth.uid;
    const email = (auth.token.email as string) ?? "";

    const erased = await eraseUserData(uid, email);

    await getAuditRepository().record({
      actorUid: ANON_UID,
      actorEmail: "",
      action: "gdpr.erasure",
      targetType: "user",
      targetId: ANON_UID,
      details: { ...erased, originalUidHash: "redacted" },
    });

    try {
      await adminAuth.revokeRefreshTokens(uid);
      await adminAuth.deleteUser(uid);
    } catch {
      // user might have been already removed; continue
    }

    return { ok: true, erased };
  }
);

async function eraseUserData(
  uid: string,
  email: string
): Promise<{
  attivita: number;
  aziendeAnon: number;
  remindersAnon: number;
  userDoc: boolean;
  allowlistDoc: boolean;
}> {
  let attivitaDeleted = 0;
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
    attivitaDeleted += snap.size;
    if (snap.size < BATCH_SIZE) break;
  }

  const aziendeAnon = await anonymizeReferences("aziende", uid);
  const remindersAnon = await anonymizeReminders(uid);

  let userDoc = false;
  const userRef = adminDb.collection("users").doc(uid);
  const userSnap = await userRef.get();
  if (userSnap.exists) {
    await userRef.delete();
    userDoc = true;
  }

  let allowlistDoc = false;
  if (email) {
    const norm = normalizeEmail(email);
    const allowRef = adminDb.collection("allowlist").doc(norm);
    const allowSnap = await allowRef.get();
    if (allowSnap.exists) {
      await allowRef.delete();
      allowlistDoc = true;
    }
  }

  return {
    attivita: attivitaDeleted,
    aziendeAnon,
    remindersAnon,
    userDoc,
    allowlistDoc,
  };
}

async function anonymizeReferences(
  collection: "aziende",
  uid: string
): Promise<number> {
  let count = 0;
  for (const field of ["createdBy", "updatedBy"] as const) {
    for (;;) {
      const snap = await adminDb
        .collection(collection)
        .where(field, "==", uid)
        .limit(BATCH_SIZE)
        .get();
      if (snap.empty) break;
      const batch = adminDb.batch();
      for (const doc of snap.docs) {
        const update: Record<string, string> = {};
        if (doc.get("createdBy") === uid) {
          update["createdBy"] = ANON_UID;
          update["createdByName"] = ANON_NAME;
        }
        if (doc.get("updatedBy") === uid) {
          update["updatedBy"] = ANON_UID;
          update["updatedByName"] = ANON_NAME;
        }
        batch.update(doc.ref, update);
      }
      await batch.commit();
      count += snap.size;
      if (snap.size < BATCH_SIZE) break;
    }
  }
  return count;
}

async function anonymizeReminders(uid: string): Promise<number> {
  let count = 0;
  for (;;) {
    const snap = await adminDb
      .collection("reminders")
      .where("createdBy", "==", uid)
      .limit(BATCH_SIZE)
      .get();
    if (snap.empty) break;
    const batch = adminDb.batch();
    for (const doc of snap.docs) {
      batch.update(doc.ref, { createdBy: ANON_UID });
    }
    await batch.commit();
    count += snap.size;
    if (snap.size < BATCH_SIZE) break;
  }
  return count;
}

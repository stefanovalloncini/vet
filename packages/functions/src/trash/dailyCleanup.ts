import { onSchedule } from "firebase-functions/v2/scheduler";
import { adminDb } from "../admin/firebaseAdmin.js";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const TRASH_TTL_DAYS = 7;
const BATCH_SIZE = 200;

export function computeTrashCutoff(now: Date, ttlDays = TRASH_TTL_DAYS): Date {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - ttlDays);
  return cutoff;
}

export const dailyTrashCleanup = onSchedule(
  {
    schedule: "0 3 * * *",
    timeZone: "Europe/Rome",
    region: "europe-west8",
  },
  async () => {
    const cutoff = computeTrashCutoff(new Date());
    const purged = await purgeExpired(cutoff);
    if (purged > 0) {
      await adminDb.collection("audit").add({
        at: FieldValue.serverTimestamp(),
        actorUid: "system",
        actorEmail: "scheduled@vet",
        action: "attivita.purge.auto",
        targetType: "attivita",
        targetId: "batch",
        details: { count: purged, cutoff: cutoff.toISOString() },
      });
    }
  }
);

async function purgeExpired(cutoff: Date): Promise<number> {
  let total = 0;
  for (;;) {
    const snap = await adminDb
      .collection("attivita")
      .where("isDeleted", "==", true)
      .where("deletedAt", "<", Timestamp.fromDate(cutoff))
      .limit(BATCH_SIZE)
      .get();
    if (snap.empty) break;
    const batch = adminDb.batch();
    for (const doc of snap.docs) batch.delete(doc.ref);
    await batch.commit();
    total += snap.size;
    if (snap.size < BATCH_SIZE) break;
  }
  return total;
}

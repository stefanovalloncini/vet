import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    projectId: process.env["FIREBASE_PROJECT_ID"] ?? "vet-dev",
  });
}

const db = getFirestore();

async function main() {
  const snap = await db.collection("users").get();
  let touched = 0;
  let skipped = 0;
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (typeof data.approved === "boolean") {
      skipped += 1;
      continue;
    }
    await docSnap.ref.set(
      { approved: true, updatedAt: new Date() },
      { merge: true }
    );
    touched += 1;
    console.log(`backfilled approved=true for ${docSnap.id}`);
  }
  console.log(`done. ${touched} docs updated, ${skipped} already had approved`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { getFirestore } from "firebase-admin/firestore";
import { runScript } from "./lib/runScript.js";

await runScript({
  scriptName: "migrate-approved",
  run: async () => {
    const db = getFirestore();
    const snap = await db.collection("users").get();
    let touched = 0;
    let skipped = 0;
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      if (typeof data["approved"] === "boolean") {
        skipped += 1;
        continue;
      }
      await docSnap.ref.set(
        { approved: true, updatedAt: new Date() },
        { merge: true }
      );
      touched += 1;
      process.stdout.write(`backfilled approved=true for ${docSnap.id}\n`);
    }
    process.stdout.write(
      `done. ${touched} docs updated, ${skipped} already had approved\n`
    );
  },
});

import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { ACTIVITY_TYPE_SEEDS } from "@vet/shared";

if (!getApps().length) {
  initializeApp({
    projectId: process.env["FIREBASE_PROJECT_ID"] ?? "vet-dev",
  });
}

const db = getFirestore();

async function main() {
  for (const t of ACTIVITY_TYPE_SEEDS) {
    await db.collection("activity_types").doc(t.id).set(
      {
        nome: t.nome,
        ordine: t.ordine,
        attivo: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        schemaVersion: 1,
      },
      { merge: true }
    );
    process.stdout.write(`seeded type ${t.id}\n`);
  }
}

main().catch((err) => {
  process.stderr.write(String(err) + "\n");
  process.exit(1);
});

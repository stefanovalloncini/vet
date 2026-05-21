import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { ACTIVITY_TYPE_SEEDS } from "@vet/shared";
import { runScript } from "./lib/runScript.js";

await runScript({
  scriptName: "seed-activity-types",
  run: async () => {
    const db = getFirestore();
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
  },
});

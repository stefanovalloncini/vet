import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { ACTIVITY_TYPE_SEEDS } from "@vet/shared";
import { runScript } from "./lib/runScript.js";

const ALSO_WIPE_DATA = process.argv.includes("--wipe-data");

async function deleteAll(collection: string): Promise<number> {
  const db = getFirestore();
  const snap = await db.collection(collection).get();
  if (snap.empty) return 0;
  let count = 0;
  let batch = db.batch();
  let inBatch = 0;
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    inBatch++;
    if (inBatch === 400) {
      await batch.commit();
      count += inBatch;
      batch = db.batch();
      inBatch = 0;
    }
  }
  if (inBatch > 0) {
    await batch.commit();
    count += inBatch;
  }
  return count;
}

await runScript({
  scriptName: "wipe-and-reseed-types",
  run: async () => {
    const db = getFirestore();

    const typesDeleted = await deleteAll("activity_types");
    process.stdout.write(`activity_types: deleted ${typesDeleted}\n`);

    if (ALSO_WIPE_DATA) {
      const attivita = await deleteAll("attivita");
      process.stdout.write(`attivita: deleted ${attivita}\n`);
      const aziende = await deleteAll("aziende");
      process.stdout.write(`aziende: deleted ${aziende}\n`);
      const conti = await deleteAll("conti");
      process.stdout.write(`conti: deleted ${conti}\n`);
    }

    for (const t of ACTIVITY_TYPE_SEEDS) {
      const payload: Record<string, unknown> = {
        nome: t.nome,
        ordine: t.ordine,
        attivo: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        schemaVersion: 1,
      };
      if (t.tariffaStandard !== undefined) payload["tariffaStandard"] = t.tariffaStandard;
      if (t.modalitaDefault !== undefined) payload["modalitaDefault"] = t.modalitaDefault;
      await db.collection("activity_types").doc(t.id).set(payload);
      process.stdout.write(`seeded ${t.id}\n`);
    }

    process.stdout.write(
      `\nDone. ${ALSO_WIPE_DATA ? "Wiped attivita/aziende/conti + reset types." : "Reset types (run with --wipe-data to also clear attivita/aziende/conti)."}\n`
    );
  },
});

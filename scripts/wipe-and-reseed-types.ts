import { getFirestore } from "firebase-admin/firestore";
import { ACTIVITY_TYPE_SEEDS, type ActivityTypeInput } from "@vet/shared";
import { getRepositories } from "@vet/functions/infrastructure";
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
    const repos = getRepositories();

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
      const input: ActivityTypeInput = {
        nome: t.nome,
        ordine: t.ordine,
        attivo: true,
        ...(t.tariffaStandard !== undefined
          ? { tariffaStandard: t.tariffaStandard }
          : {}),
        ...(t.modalitaDefault !== undefined
          ? { modalitaDefault: t.modalitaDefault }
          : {}),
      };
      await repos.activityTypes.upsert(t.id, input);
      process.stdout.write(`seeded ${t.id}\n`);
    }

    process.stdout.write(
      `\nDone. ${ALSO_WIPE_DATA ? "Wiped attivita/aziende/conti + reset types." : "Reset types (run with --wipe-data to also clear attivita/aziende/conti)."}\n`
    );
  },
});

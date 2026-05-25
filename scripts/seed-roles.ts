import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { CAPABILITIES, type Capability } from "@vet/shared";
import { runScript } from "./lib/runScript.js";

const amministratoreCaps: Capability[] = [...CAPABILITIES];

const veterinarioCapoCaps: Capability[] = [
  "activities.read.all",
  "activities.create",
  "activities.update.own",
  "activities.delete.own",
  "activities.export",
  "aziende.read",
  "aziende.create",
  "aziende.update",
  "activity_types.read",
  "trash.read.own",
  "trash.restore.own",
  "conti.proforma",
  "conti.emit",
  "conti.saldo",
  "reminders.read",
  "reminders.create",
  "reminders.update.own",
  "reminders.delete.own",
];

const veterinarioSempliceCaps: Capability[] = [
  "activities.read.all",
  "activities.create",
  "activities.update.own",
  "activities.delete.own",
  "activities.export",
  "aziende.read",
  "aziende.create",
  "aziende.update",
  "activity_types.read",
  "trash.read.own",
  "trash.restore.own",
  "conti.proforma",
  "reminders.read",
  "reminders.create",
  "reminders.update.own",
  "reminders.delete.own",
];

const SEEDS: ReadonlyArray<{
  id: string;
  name: string;
  caps: Capability[];
  locked: boolean;
}> = [
  { id: "amministratore", name: "Amministratore", caps: amministratoreCaps, locked: true },
  { id: "veterinario_capo", name: "Veterinario capo", caps: veterinarioCapoCaps, locked: true },
  { id: "veterinario_semplice", name: "Veterinario semplice", caps: veterinarioSempliceCaps, locked: true },
];

function nameKey(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
}

await runScript({
  scriptName: "seed-roles",
  run: async () => {
    const db = getFirestore();
    for (const r of SEEDS) {
      const batch = db.batch();
      batch.set(db.collection("roleNames").doc(nameKey(r.name)), { roleId: r.id });
      batch.set(db.collection("roles").doc(r.id), {
        name: r.name,
        capabilities: r.caps,
        locked: r.locked,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: "seed",
        updatedBy: "seed",
        schemaVersion: 1,
      });
      await batch.commit();
      process.stdout.write(`seeded role ${r.id}\n`);
    }
  },
});

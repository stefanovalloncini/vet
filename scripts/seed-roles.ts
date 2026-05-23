import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { CAPABILITIES, type Capability } from "@vet/shared";
import { runScript } from "./lib/runScript.js";

const adminCaps: Capability[] = [...CAPABILITIES];
const vetCaps: Capability[] = [
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
  "payments.read",
  "payments.read.any",
  "payments.manage",
  "reminders.read",
  "reminders.create",
  "reminders.update.own",
  "reminders.delete.own",
];
const viewerCaps: Capability[] = [
  "activities.read.all",
  "aziende.read",
  "activity_types.read",
  "trash.read.own",
  "payments.read",
  "payments.read.any",
  "reminders.read",
];

const SEEDS: ReadonlyArray<{
  id: string;
  name: string;
  caps: Capability[];
  locked: boolean;
}> = [
  { id: "admin", name: "Amministratore", caps: adminCaps, locked: true },
  { id: "vet", name: "Veterinario", caps: vetCaps, locked: false },
  { id: "viewer", name: "Sola lettura", caps: viewerCaps, locked: false },
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

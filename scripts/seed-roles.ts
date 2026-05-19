import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { CAPABILITIES, type Capability } from "@vet/shared";

if (!getApps().length) {
  initializeApp({
    projectId: process.env["FIREBASE_PROJECT_ID"] ?? "vet-dev",
  });
}

const db = getFirestore();

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
  "reminders.read",
];

const seed = [
  { id: "admin", name: "Amministratore", caps: adminCaps, locked: true },
  { id: "vet", name: "Veterinario", caps: vetCaps, locked: false },
  { id: "viewer", name: "Sola lettura", caps: viewerCaps, locked: false },
];

async function main() {
  for (const r of seed) {
    await db.collection("roles").doc(r.id).set({
      name: r.name,
      capabilities: r.caps,
      locked: r.locked,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: "seed",
      updatedBy: "seed",
      schemaVersion: 1,
    });
    process.stdout.write(`seeded role ${r.id}\n`);
  }
}

main().catch((err) => {
  process.stderr.write(String(err) + "\n");
  process.exit(1);
});

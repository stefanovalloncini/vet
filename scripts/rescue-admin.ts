import { cert, getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { CAPABILITIES, encodeCaps, type Capability } from "@vet/shared";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? "vet-app";
const EMAIL = process.env.RESCUE_EMAIL;

if (!EMAIL) {
  process.stderr.write("Usage: RESCUE_EMAIL=you@example.com pnpm rescue:admin\n");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
}

const db = getFirestore();
const auth = getAuth();

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
  "reminders.read",
];

interface Seed {
  id: string;
  name: string;
  caps: Capability[];
  locked: boolean;
}

const SEEDS: Seed[] = [
  { id: "admin", name: "Amministratore", caps: adminCaps, locked: true },
  { id: "vet", name: "Veterinario", caps: vetCaps, locked: false },
  { id: "viewer", name: "Sola lettura", caps: viewerCaps, locked: false },
];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function main(): Promise<void> {
  for (const r of SEEDS) {
    await db.collection("roles").doc(r.id).set({
      name: r.name,
      capabilities: r.caps,
      locked: r.locked,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: "rescue",
      updatedBy: "rescue",
      schemaVersion: 1,
    }, { merge: true });
    process.stdout.write(`roles/${r.id} upserted\n`);
  }

  const norm = normalizeEmail(EMAIL!);
  await db.collection("allowlist").doc(norm).set({
    email: EMAIL,
    defaultRoleId: "admin",
    invitedBy: "rescue",
    invitedAt: FieldValue.serverTimestamp(),
    schemaVersion: 1,
  }, { merge: true });
  process.stdout.write(`allowlist/${norm} upserted as admin\n`);

  try {
    const user = await auth.getUserByEmail(EMAIL!);
    await auth.setCustomUserClaims(user.uid, {
      vet: true,
      roleId: "admin",
      caps: encodeCaps(adminCaps),
      capsVer: Date.now(),
      name: user.displayName ?? EMAIL!.split("@")[0],
    });
    await auth.revokeRefreshTokens(user.uid);
    process.stdout.write(`claims set + tokens revoked for uid=${user.uid}\n`);
    process.stdout.write(`User will get admin claims on next token refresh (~1h max, or sign out + sign in)\n`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("no user record")) {
      process.stdout.write(`no Firebase Auth user for ${EMAIL} yet — they'll get admin on first sign-in (allowlist routes them)\n`);
    } else {
      throw err;
    }
  }

  process.stdout.write("\nDone.\n");
}

main().catch((err) => {
  process.stderr.write(String(err) + "\n");
  process.exit(1);
});

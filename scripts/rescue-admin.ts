import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { CAPABILITIES, encodeCaps, normalizeEmail, type Capability } from "@vet/shared";
import { runScript } from "./lib/runScript.js";

const EMAIL = process.env["RESCUE_EMAIL"];
if (!EMAIL) {
  process.stderr.write(
    "Usage: RESCUE_EMAIL=you@example.com pnpm rescue:admin [--prod]\n"
  );
  process.exit(1);
}

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
  scriptName: "rescue-admin",
  run: async () => {
    const db = getFirestore();
    const auth = getAuth();

    for (const r of SEEDS) {
      const batch = db.batch();
      batch.set(
        db.collection("roleNames").doc(nameKey(r.name)),
        { roleId: r.id },
        { merge: true }
      );
      batch.set(
        db.collection("roles").doc(r.id),
        {
          name: r.name,
          capabilities: r.caps,
          locked: r.locked,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          createdBy: "rescue",
          updatedBy: "rescue",
          schemaVersion: 1,
        },
        { merge: true }
      );
      await batch.commit();
      process.stdout.write(`roles/${r.id} upserted\n`);
    }

    const norm = normalizeEmail(EMAIL!);
    await db.collection("allowlist").doc(norm).set(
      {
        email: EMAIL,
        defaultRoleId: "admin",
        invitedBy: "rescue",
        invitedAt: FieldValue.serverTimestamp(),
        schemaVersion: 1,
      },
      { merge: true }
    );
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
      process.stdout.write(
        "User will get admin claims on next token refresh (~1h max, or sign out + sign in).\n"
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("no user record")) {
        process.stdout.write(
          `no Firebase Auth user for ${EMAIL} yet — they'll get admin on first sign-in (allowlist routes them)\n`
        );
      } else {
        throw err;
      }
    }
  },
});

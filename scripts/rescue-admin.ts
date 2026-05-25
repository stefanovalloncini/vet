import { getAuth } from "firebase-admin/auth";
import {
  CAPABILITIES,
  encodeCaps,
  type Capability,
  type Role,
} from "@vet/shared";
import { getRepositories } from "@vet/functions/infrastructure";
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

await runScript({
  scriptName: "rescue-admin",
  run: async () => {
    const repos = getRepositories();
    const auth = getAuth();
    const now = new Date();

    for (const s of SEEDS) {
      const role: Role = {
        id: s.id,
        name: s.name,
        capabilities: [...s.caps],
        locked: s.locked,
        createdAt: now,
        updatedAt: now,
        createdBy: "rescue",
        updatedBy: "rescue",
        schemaVersion: 1,
      };
      await repos.roles.seed(role);
      process.stdout.write(`roles/${s.id} upserted\n`);
    }

    await repos.allowlist.add(
      { email: EMAIL!, defaultRoleId: "admin" },
      "rescue"
    );
    process.stdout.write(`allowlist/${EMAIL} upserted as admin\n`);

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

import type { Capability, Role } from "@vet/shared";
import { getRepositories } from "@vet/functions/infrastructure";
import { runScript } from "./lib/runScript.js";

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

const veterinarioCapoCaps: Capability[] = [
  ...veterinarioSempliceCaps,
  "conti.emit",
  "conti.saldo",
];

const amministratoreCaps: Capability[] = [
  ...veterinarioCapoCaps,
  "roles.read",
  "roles.manage",
  "roles.assign",
  "allowlist.read",
  "allowlist.manage",
  "users.approve",
  "users.read.all",
  "audit.read",
];

const SEEDS: ReadonlyArray<{
  id: string;
  name: string;
  caps: Capability[];
}> = [
  { id: "veterinario_semplice", name: "Veterinario semplice", caps: veterinarioSempliceCaps },
  { id: "veterinario_capo", name: "Veterinario capo", caps: veterinarioCapoCaps },
  { id: "amministratore", name: "Amministratore", caps: amministratoreCaps },
];

await runScript({
  scriptName: "seed-roles",
  run: async () => {
    const repos = getRepositories();
    const now = new Date();
    for (const s of SEEDS) {
      const role: Role = {
        id: s.id,
        name: s.name,
        capabilities: [...s.caps],
        locked: true,
        createdAt: now,
        updatedAt: now,
        createdBy: "seed",
        updatedBy: "seed",
        schemaVersion: 1,
      };
      await repos.roles.seed(role);
      process.stdout.write(`seeded role ${s.id}\n`);
    }
  },
});

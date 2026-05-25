import { CAPABILITIES, type Capability, type Role } from "@vet/shared";
import { getRepositories } from "@vet/functions/infrastructure";
import { runScript } from "./lib/runScript.js";

const titolareCaps: Capability[] = [...CAPABILITIES];

const amministratoreCaps: Capability[] = [
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
  { id: "titolare", name: "Titolare", caps: titolareCaps, locked: true },
  { id: "amministratore", name: "Amministratore", caps: amministratoreCaps, locked: true },
  { id: "veterinario_capo", name: "Veterinario capo", caps: veterinarioCapoCaps, locked: true },
  { id: "veterinario_semplice", name: "Veterinario semplice", caps: veterinarioSempliceCaps, locked: true },
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
        locked: s.locked,
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

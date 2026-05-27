import { ROLE_BUNDLES, type Role } from "@vet/shared";
import { getRepositories } from "@vet/functions/infrastructure";
import { runScript } from "./lib/runScript.js";

const SEEDS = ROLE_BUNDLES;

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

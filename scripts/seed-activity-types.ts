import { ACTIVITY_TYPE_SEEDS, type ActivityTypeInput } from "@vet/shared";
import { getRepositories } from "@vet/functions/infrastructure";
import { runScript } from "./lib/runScript.js";

await runScript({
  scriptName: "seed-activity-types",
  run: async () => {
    const repos = getRepositories();
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
      process.stdout.write(`seeded type ${t.id}\n`);
    }
  },
});

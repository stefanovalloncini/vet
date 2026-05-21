import {
  initializeApp,
  getApps,
  applicationDefault,
} from "firebase-admin/app";
import { decideScriptTarget } from "@vet/shared";

const PRODUCTION_PROJECT_ID = "vet-marinoni";

export interface RunScriptArgs {
  scriptName: string;
  run: () => Promise<void>;
}

export async function runScript({ scriptName, run }: RunScriptArgs): Promise<void> {
  const decision = decideScriptTarget({
    scriptName,
    argv: process.argv.slice(2),
    env: process.env,
    expectedProductionProjectId: PRODUCTION_PROJECT_ID,
  });

  if (decision.kind === "refused") {
    process.stderr.write(decision.reason + "\n");
    process.exit(2);
  }

  process.stdout.write(decision.banner + "\n");

  if (!getApps().length) {
    initializeApp({
      projectId: decision.projectId,
      ...(decision.kind === "production"
        ? { credential: applicationDefault() }
        : {}),
    });
  }

  try {
    await run();
  } catch (err) {
    process.stderr.write(String(err) + "\n");
    process.exit(1);
  }
}

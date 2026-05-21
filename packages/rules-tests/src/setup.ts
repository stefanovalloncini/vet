import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

let env: RulesTestEnvironment | undefined;

export async function getEnv(): Promise<RulesTestEnvironment> {
  if (env) return env;
  const rulesPath = resolve(import.meta.dirname, "../../../firestore.rules");
  env = await initializeTestEnvironment({
    projectId: "demo-vet-rules-test",
    firestore: {
      rules: readFileSync(rulesPath, "utf8"),
      host: "127.0.0.1",
      port: 8080
    }
  });
  return env;
}

export async function disposeEnv(): Promise<void> {
  if (env) {
    await env.cleanup();
    env = undefined;
  }
}

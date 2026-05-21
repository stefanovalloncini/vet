export interface DecideScriptTargetInput {
  scriptName: string;
  argv: ReadonlyArray<string>;
  env: Readonly<Record<string, string | undefined>>;
  expectedProductionProjectId: string;
}

export type ScriptTargetDecision =
  | {
      kind: "emulator";
      emulatorHost: string;
      projectId: string;
      banner: string;
    }
  | {
      kind: "production";
      projectId: string;
      banner: string;
    }
  | {
      kind: "refused";
      reason: string;
    };

const PROD_FLAG = "--prod";
const EMULATOR_HOST_VAR = "FIRESTORE_EMULATOR_HOST";
const PROJECT_ID_VAR = "FIREBASE_PROJECT_ID";
const DEFAULT_EMULATOR_PROJECT_ID = "vet-dev";

export function decideScriptTarget(input: DecideScriptTargetInput): ScriptTargetDecision {
  const { scriptName, argv, env, expectedProductionProjectId } = input;
  const emulatorHost = env[EMULATOR_HOST_VAR];
  if (emulatorHost) {
    const projectId = env[PROJECT_ID_VAR] ?? DEFAULT_EMULATOR_PROJECT_ID;
    return {
      kind: "emulator",
      emulatorHost,
      projectId,
      banner: `[${scriptName}] target: emulator @ ${emulatorHost} (project ${projectId})`,
    };
  }

  if (!argv.includes(PROD_FLAG)) {
    return {
      kind: "refused",
      reason: `Refusing to run "${scriptName}" without FIRESTORE_EMULATOR_HOST set. Pass ${PROD_FLAG} together with FIREBASE_PROJECT_ID=${expectedProductionProjectId} to target production.`,
    };
  }

  const projectId = env[PROJECT_ID_VAR];
  if (!projectId) {
    return {
      kind: "refused",
      reason: `${PROD_FLAG} given but ${PROJECT_ID_VAR} is unset. Set ${PROJECT_ID_VAR}=${expectedProductionProjectId} to confirm the production target.`,
    };
  }

  if (projectId !== expectedProductionProjectId) {
    return {
      kind: "refused",
      reason: `${PROJECT_ID_VAR}=${projectId} does not match the expected production project id (${expectedProductionProjectId}). Refusing.`,
    };
  }

  return {
    kind: "production",
    projectId,
    banner: `[${scriptName}] target: PRODUCTION (project ${projectId}) — ${PROD_FLAG} confirmed`,
  };
}

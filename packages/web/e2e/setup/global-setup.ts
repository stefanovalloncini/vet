import { spawn, type ChildProcess } from "node:child_process";
import { copyFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AUTH_EMULATOR_HOST,
  EMULATOR_PROJECT_ID,
  FIRESTORE_EMULATOR_HOST,
  seedAll,
} from "./seed";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "../../../..");
const WEB_PORT = 5173;
const AUTH_PORT = 9099;
const FIRESTORE_PORT = 8080;
const HUB_PORT = 4400;

export const STATE_FILE = join(tmpdir(), "vet-e2e-state.json");

interface PersistedState {
  pids: number[];
  tmpDir: string;
}

const handles: ChildProcess[] = [];

async function waitForUrl(
  url: string,
  timeoutMs: number,
  label: string
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status >= 200 && res.status < 500) return;
    } catch {
      void 0;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`${label} not reachable at ${url} after ${timeoutMs}ms`);
}

function spawnProcess(
  command: string,
  args: ReadonlyArray<string>,
  options: { label: string; cwd?: string; env?: NodeJS.ProcessEnv }
): ChildProcess {
  const child = spawn(command, [...args], {
    cwd: options.cwd ?? REPO_ROOT,
    env: { ...process.env, ...options.env },
    stdio: "pipe",
    detached: true,
  });
  child.stdout?.on("data", (chunk: Buffer) => {
    if (process.env["E2E_VERBOSE"]) {
      process.stdout.write(`[${options.label}] ${chunk.toString()}`);
    }
  });
  child.stderr?.on("data", (chunk: Buffer) => {
    if (process.env["E2E_VERBOSE"]) {
      process.stderr.write(`[${options.label}] ${chunk.toString()}`);
    }
  });
  handles.push(child);
  return child;
}

function writeEmulatorConfig(): { firebaseJson: string; tmpDir: string } {
  const dir = mkdtempSync(join(tmpdir(), "vet-e2e-"));
  copyFileSync(resolve(REPO_ROOT, "firestore.rules"), join(dir, "firestore.rules"));
  copyFileSync(
    resolve(REPO_ROOT, "firestore.indexes.json"),
    join(dir, "firestore.indexes.json")
  );
  const config = {
    emulators: {
      auth: { port: AUTH_PORT },
      firestore: { port: FIRESTORE_PORT },
      hub: { port: HUB_PORT },
      ui: { enabled: false },
      singleProjectMode: true,
    },
    firestore: {
      rules: "firestore.rules",
      indexes: "firestore.indexes.json",
    },
  };
  const path = join(dir, "firebase.json");
  writeFileSync(path, JSON.stringify(config, null, 2));
  return { firebaseJson: path, tmpDir: dir };
}

async function startEmulators(firebaseJson: string): Promise<void> {
  spawnProcess(
    "pnpm",
    [
      "exec",
      "firebase",
      "emulators:start",
      "--only",
      "auth,firestore",
      "--project",
      EMULATOR_PROJECT_ID,
      "--config",
      firebaseJson,
    ],
    { label: "emu" }
  );
  await waitForUrl(`http://${AUTH_EMULATOR_HOST}/`, 90_000, "auth-emulator");
  await waitForUrl(
    `http://${FIRESTORE_EMULATOR_HOST}/`,
    90_000,
    "firestore-emulator"
  );
}

async function startWebServer(): Promise<void> {
  spawnProcess(
    "pnpm",
    ["-F", "@vet/web", "exec", "vite", "--host", "127.0.0.1", "--port", String(WEB_PORT), "--strictPort"],
    {
      label: "web",
      env: {
        VITE_E2E: "true",
        VITE_FIREBASE_USE_EMULATOR: "true",
        VITE_FIREBASE_API_KEY: "fake-emulator-api-key",
        VITE_FIREBASE_AUTH_DOMAIN: `${EMULATOR_PROJECT_ID}.firebaseapp.com`,
        VITE_FIREBASE_PROJECT_ID: EMULATOR_PROJECT_ID,
        VITE_FIREBASE_APP_ID: "fake-emulator-app-id",
      },
    }
  );
  await waitForUrl(`http://127.0.0.1:${WEB_PORT}/`, 90_000, "web-dev-server");
}

export default async function globalSetup(): Promise<void> {
  process.env["FIREBASE_AUTH_EMULATOR_HOST"] = AUTH_EMULATOR_HOST;
  process.env["FIRESTORE_EMULATOR_HOST"] = FIRESTORE_EMULATOR_HOST;

  const { firebaseJson, tmpDir } = writeEmulatorConfig();
  await startEmulators(firebaseJson);
  await seedAll();
  await startWebServer();

  const pids = handles
    .map((c) => c.pid)
    .filter((p): p is number => typeof p === "number" && p > 0);
  const state: PersistedState = { pids, tmpDir };
  writeFileSync(STATE_FILE, JSON.stringify(state));

  for (const child of handles) child.unref();
}

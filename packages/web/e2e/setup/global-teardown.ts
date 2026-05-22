import { readFileSync, rmSync, existsSync } from "node:fs";
import { STATE_FILE } from "./global-setup";

interface PersistedState {
  pids: number[];
  tmpDir: string;
}

function killGroup(pid: number, signal: NodeJS.Signals): void {
  try {
    process.kill(-pid, signal);
  } catch {
    try {
      process.kill(pid, signal);
    } catch {
      void 0;
    }
  }
}

export default async function globalTeardown(): Promise<void> {
  if (!existsSync(STATE_FILE)) return;
  let state: PersistedState | null = null;
  try {
    state = JSON.parse(readFileSync(STATE_FILE, "utf8")) as PersistedState;
  } catch {
    return;
  }
  for (const pid of state.pids) killGroup(pid, "SIGINT");
  await new Promise((r) => setTimeout(r, 1_500));
  for (const pid of state.pids) killGroup(pid, "SIGKILL");
  try {
    rmSync(state.tmpDir, { recursive: true, force: true });
  } catch {
    void 0;
  }
  try {
    rmSync(STATE_FILE, { force: true });
  } catch {
    void 0;
  }
}

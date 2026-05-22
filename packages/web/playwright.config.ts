import { defineConfig, devices } from "@playwright/test";

const useEmulator = process.env["E2E_NO_EMULATOR"] !== "1";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  reporter: process.env["CI"] ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  ...(useEmulator
    ? {
        globalSetup: "./e2e/setup/global-setup.ts",
        globalTeardown: "./e2e/setup/global-teardown.ts",
      }
    : {
        webServer: {
          command: "pnpm dev",
          url: "http://localhost:5173",
          reuseExistingServer: true,
          timeout: 60_000,
        },
      }),
});

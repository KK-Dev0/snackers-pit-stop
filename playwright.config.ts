import { defineConfig, devices } from "@playwright/test";

const port = "3100";
// Use localhost: Next dev blocks cross-origin HMR resources from 127.0.0.1.
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  globalSetup: "./tests/e2e/global-setup.ts",

  use: {
    baseURL,
    trace: "on-first-retry",
    serviceWorkers: "block",
    reducedMotion: "reduce",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PORT: port,
      DATABASE_URL: process.env.DATABASE_URL ?? "file:local.db",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});

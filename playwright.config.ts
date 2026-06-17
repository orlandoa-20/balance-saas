import { defineConfig, devices } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  use: { baseURL: BASE, trace: "on-first-retry" },
  // Auto-start the dev server locally unless an external URL is provided.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npm run dev", url: BASE, reuseExistingServer: true, timeout: 120_000 },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

import { defineConfig } from "@playwright/test";

// Runs against the production build (pnpm build first). Uses the installed Microsoft Edge.
export default defineConfig({
  fullyParallel: false,
  testDir: "tests/e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:4321",
    channel: "msedge",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm preview --port 4321",
    reuseExistingServer: true,
    timeout: 120_000,
    url: "http://localhost:4321",
  },
});

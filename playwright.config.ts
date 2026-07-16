import { defineConfig, devices } from "@playwright/test";

// End-to-end smoke, run the way CI runs it: against a real Postgres (service container in
// CI; docker-compose locally) with the seeded catalog. S01's only flow is "the pages render
// a seeded product"; the browse → cart → checkout flagship flow grows sprint by sprint.
// Port is configurable so a local run can dodge a port already in use; CI leaves it at 3000.
const PORT = Number(process.env.PORT ?? 3000);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  // Boot the app for the tests. `pnpm dev` needs no prior build and reads DATABASE_URL from
  // the environment — the same env CI's e2e job exports. Migrate + seed happen before this.
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

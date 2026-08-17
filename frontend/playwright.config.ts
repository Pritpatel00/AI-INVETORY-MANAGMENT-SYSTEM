import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright e2e configuration for the Nirka AI Voice Inventory application.
 *
 * The tests run against the local development stack:
 *
 *   - Web app:    http://localhost:3000   (npm run dev, vite/vinext)
 *   - Inventory:  http://localhost:4000   (npm run api:dev, NestJS)
 *   - Keycloak:   http://localhost:8080   (npm run auth:local:start)
 *   - PostgreSQL: localhost:5434          (npm run db:local:start)
 *   - Valkey + Mailpit: no longer required (supplier-email flow removed)
 *
 * The web app is started automatically if it is not already running
 * (`reuseExistingServer`). Postgres, Keycloak and the API must be up before
 * `npx playwright test` — the spec fails fast with a clear message otherwise.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  // The approval flow mutates shared state (Keycloak client settings and the
  // audit ledger), so the file must never run in parallel workers.
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Never let the PWA service worker serve a stale cached shell during a test.
    serviceWorkers: "block",
    locale: "en-US",
  },
  projects: [
    {
      name: "chromium",
      // Drive the locally installed Chrome so no Playwright browser download is
      // required. Swap for the Playwright-managed Chromium by removing
      // `channel` and running `npx playwright install chromium`.
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

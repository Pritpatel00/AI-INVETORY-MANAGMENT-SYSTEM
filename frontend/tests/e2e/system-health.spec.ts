import { expect, test } from "@playwright/test";

/**
 * Administrator System Health page (e2e).
 *
 * Verifies the post-supplier-email-cleanup health surface:
 *   1. The Administrator signs in through the real Keycloak login page.
 *   2. The System health page lists exactly the six services the application
 *      currently requires (Web application, NestJS API, PostgreSQL, Keycloak,
 *      Speech-to-text, Ollama AI), each with a clear status badge.
 *   3. The obsolete "Notification queue" / Valkey service is no longer shown.
 *   4. The Refresh button re-runs the detailed health probe, shows a loading
 *      state while checking and keeps the "Last checked" timestamp current.
 */

const WEB_APP_URL = "http://localhost:3000";
const ADMINISTRATOR = { username: "admin1", password: "Admin@123" };

const ACTIVE_SERVICES = [
  "Web application",
  "NestJS API",
  "PostgreSQL",
  "Keycloak",
  "Speech-to-text",
  "Ollama AI",
];

test("administrator System Health page lists active services and refreshes", async ({
  page,
}) => {
  // 1. Sign in as the Administrator through the real Keycloak flow.
  await page.goto(WEB_APP_URL);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible({
    timeout: 30_000,
  });

  const adminRoleCard = page
    .locator("button[aria-pressed]")
    .filter({ hasText: "Administrator" });
  await adminRoleCard.click();
  await expect(adminRoleCard).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Employee ID").fill(ADMINISTRATOR.username);
  await page
    .getByRole("button", { name: /Continue as Administrator/ })
    .click();

  await page.waitForURL(
    /localhost:8080\/realms\/nirka-inventory\/protocol\/openid-connect\/auth/,
  );
  await page.locator("#username").fill(ADMINISTRATOR.username);
  await page.locator("#password").fill(ADMINISTRATOR.password);
  await page
    .locator('#kc-form-login button[type="submit"]')
    .first()
    .click();

  // 2. Land on the administrator overview and open the System health page.
  await page.waitForURL(/localhost:3000/);
  await expect(page.locator("#admin-overview")).toBeVisible({
    timeout: 30_000,
  });
  await page
    .locator("aside")
    .getByRole("button", { name: "System health", exact: true })
    .click();
  const healthSection = page.locator("#admin-system-health");
  await expect(healthSection).toBeVisible();

  // 3. The page lists exactly the six services the app currently requires.
  await expect(
    healthSection.getByText("Web application", { exact: true }),
  ).toBeVisible({ timeout: 20_000 });
  for (const service of ACTIVE_SERVICES) {
    await expect(
      healthSection.getByText(service, { exact: true }),
    ).toBeVisible();
  }

  // 4. The obsolete Notification queue / Valkey status is gone.
  await expect(
    healthSection.getByText("Notification queue", { exact: true }),
  ).toHaveCount(0);
  await expect(healthSection).not.toContainText("Valkey");
  await expect(healthSection).not.toContainText("6379");

  // 5. Every service carries a clear status badge (Healthy / Degraded /
  //    Unavailable) and the last-checked time is shown.
  await expect(healthSection.getByTestId("health-last-checked")).toBeVisible();
  const statusBadges = healthSection
    .locator("span.rounded-full")
    .filter({ hasText: /^(Online|Degraded|Offline)$/ });
  await expect(statusBadges).toHaveCount(6);
  // Every service must carry one of the three clear statuses and its own
  // last-checked time.
  for (let index = 0; index < 6; index += 1) {
    await expect(statusBadges.nth(index)).toHaveText(
      /^(Online|Degraded|Offline)$/,
    );
  }
  await expect(
    healthSection.locator("p", { hasText: /^Last checked ·/ }),
  ).toHaveCount(6);

  // 6. Refresh re-runs the probe with a visible loading state. The health
  //    fetch is delayed slightly so the loading state is observable.
  await page.route("**/api/health/detailed", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    await route.continue();
  });
  await healthSection
    .getByRole("button", { name: /^Refresh health$/ })
    .click();
  await expect(
    healthSection.getByRole("button", { name: /^Checking/ }),
  ).toBeVisible();
  await expect(
    healthSection.getByRole("button", { name: /^Refresh health$/ }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(healthSection.getByTestId("health-last-checked")).toBeVisible();
  await expect(
    healthSection.getByText("Web application", { exact: true }),
  ).toBeVisible();
});

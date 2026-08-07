// Screenshots Manager Overview, Approvals page, and the Products & rules table.
// Usage: node screenshot.mjs <outputPrefix>   (e.g. "after")
import { chromium } from "@playwright/test";

const WEB_APP_URL = "http://localhost:3000";
const prefix = process.argv[2] ?? "shot";
const out = (name) => `.freebuff/ui-diff/${prefix}-${name}.png`;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto(WEB_APP_URL);
  await page.getByRole("heading", { name: "Welcome back" }).waitFor({ timeout: 30_000 });

  // Manager role card + employee id
  const managerRoleCard = page.locator("button[aria-pressed]").filter({ hasText: "Manager" });
  await managerRoleCard.click();
  await page.getByLabel("Employee ID").fill("manager1");
  await page.getByRole("button", { name: /Continue as Manager/ }).click();

  // Keycloak login
  await page.waitForURL(/localhost:8080\/realms\/nirka-inventory\/protocol\/openid-connect\/auth/);
  await page.locator("#username").fill("manager1");
  await page.locator("#password").fill("Manager@123");
  await page.locator('#kc-form-login button[type="submit"]').first().click();

  await page.waitForURL(/localhost:3000/);
  await page.locator("#manager-overview-metrics").waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2_500); // let data + animations settle
  await page.screenshot({ path: out("overview"), fullPage: false });

  // Approvals page
  await page.getByRole("button", { name: "Approvals", exact: true }).click();
  await page.locator("#manager-approvals").waitFor({ timeout: 15_000 });
  await page.waitForTimeout(1_500);
  await page.screenshot({ path: out("approvals"), fullPage: false });

  // Products & rules (product table)
  await page.getByRole("button", { name: "Products & rules", exact: true }).click();
  await page.waitForTimeout(2_000);
  await page.screenshot({ path: out("products"), fullPage: false });

  console.log("DONE", out("overview"), out("approvals"), out("products"));
} finally {
  await browser.close();
}

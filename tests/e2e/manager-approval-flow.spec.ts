import { expect, test } from "@playwright/test";

/**
 * Manager approval flow (M10 Playwright e2e).
 *
 * End-to-end coverage of the Stage 8 risk-routing + manager review pipeline:
 *   1. A worker voice-style cycle-count proposal is created and confirmed via
 *      the inventory API, routing it to PENDING_REVIEW (cycle counts always
 *      require manager approval).
 *   2. The manager signs in through the real Keycloak login page, opens the
 *      approval queue and approves the transaction.
 *   3. The transaction posts atomically: it leaves the pending queue, the
 *      audit history shows it as POSTED with the manager as reviewer, and the
 *      API confirms status POSTED / approvedBy.
 *
 * Setup notes:
 *   - The pending transaction is created through the API in `beforeAll`
 *     (Playwright best practice: API-level setup, UI-level assertions). Voice
 *     capture itself is exercised by a separate spec that mocks MediaRecorder.   *   - The web client normally has `directAccessGrantsEnabled = false`, so
   *     `beforeAll` temporarily enables it (plus the app redirect URI) through
   *     the Keycloak admin API — the same pattern the infrastructure verify
   *     scripts use — and `afterAll` restores the original settings.
 */

const KEYCLOAK_BASE_URL = "http://localhost:8080";
const API_BASE_URL = "http://localhost:4000/api";
const WEB_APP_URL = "http://localhost:3000";
const REALM = "nirka-inventory";
const WEB_CLIENT_ID = "nirka-inventory-web";

const KEYCLOAK_ADMIN = { username: "nirka-admin", password: "nirka-admin-dev" };
const WORKER = { username: "worker1", password: "Worker@123" };
const MANAGER = { username: "manager1", password: "Manager@123" };

interface BalanceRecord {
  id: string;
  quantity: number;
  reservedQuantity: number;
  product: { id: string; name: string; unit: string; active?: boolean };
  location: { id: string; code: string; name: string };
}

interface TransactionRecord {
  id: string;
  status: string;
  quantity: number;
  product: { name: string; unit: string };
  approvedBy?: { displayName: string } | null;
}

interface PendingTransaction {
  id: string;
  shortId: string;
  productName: string;
  quantity: number;
  unit: string;
}

let pendingTransaction: PendingTransaction | null = null;
let restoreKeycloakClient: (() => Promise<void>) | null = null;

async function expectJsonOk(response: Response, what: string) {
  if (!response.ok) {
    throw new Error(
      `${what} failed with HTTP ${response.status}: ${await response.text()}`,
    );
  }
}

async function getKeycloakAdminToken(): Promise<string> {
  const response = await fetch(
    `${KEYCLOAK_BASE_URL}/realms/master/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: "admin-cli",
        grant_type: "password",
        username: KEYCLOAK_ADMIN.username,
        password: KEYCLOAK_ADMIN.password,
      }),
    },
  );
  await expectJsonOk(response, "Keycloak admin token request");
  const payload = (await response.json()) as { access_token: string };
  return payload.access_token;
}

async function getAccessToken(user: {
  username: string;
  password: string;
}): Promise<string> {
  const response = await fetch(
    `${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: WEB_CLIENT_ID,
        grant_type: "password",
        username: user.username,
        password: user.password,
      }),
    },
  );
  await expectJsonOk(response, `Access token for ${user.username}`);
  const payload = (await response.json()) as { access_token: string };
  return payload.access_token;
}

async function readWebClient(
  adminToken: string,
): Promise<Record<string, unknown>> {
  const response = await fetch(
    `${KEYCLOAK_BASE_URL}/admin/realms/${REALM}/clients?clientId=${WEB_CLIENT_ID}`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  await expectJsonOk(response, "Keycloak web client lookup");
  const clients = (await response.json()) as Array<Record<string, unknown>>;
  const client = clients[0];
  if (!client) {
    throw new Error(`Keycloak client "${WEB_CLIENT_ID}" was not found.`);
  }
  return client;
}

async function writeWebClient(
  adminToken: string,
  client: Record<string, unknown>,
) {
  const response = await fetch(
    `${KEYCLOAK_BASE_URL}/admin/realms/${REALM}/clients/${String(client.id)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(client),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Keycloak client update failed with HTTP ${response.status}: ${await response.text()}`,
    );
  }
}

async function apiRequest<T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  await expectJsonOk(response, `Inventory API ${init?.method ?? "GET"} ${path}`);
  return response.json() as Promise<T>;
}

test.beforeAll(async () => {
  // 1. Temporarily configure the Keycloak web client for the test run:
  //    password grants (worker setup API calls) and the :3002 redirect URI.
  const adminToken = await getKeycloakAdminToken();
  const originalClient = await readWebClient(adminToken);
  const clientSnapshot = JSON.parse(
    JSON.stringify(originalClient),
  ) as Record<string, unknown>;
  restoreKeycloakClient = async () => {
    // The admin access token from beforeAll may have expired by now; refresh it.
    const freshAdminToken = await getKeycloakAdminToken();
    await writeWebClient(freshAdminToken, clientSnapshot);
  };

  const redirectUris = Array.isArray(originalClient.redirectUris)
    ? (originalClient.redirectUris as string[])
    : [];
  const redirectPattern = `${WEB_APP_URL}/*`;
  await writeWebClient(adminToken, {
    ...originalClient,
    directAccessGrantsEnabled: true,
    redirectUris: redirectUris.includes(redirectPattern)
      ? redirectUris
      : [...redirectUris, redirectPattern],
  });

  // 2. Create and confirm a cycle count as the worker. Cycle counts always
  //    route to manager review, so the transaction lands in the approval queue
  //    without touching stock. The physical count uses the full on-hand
  //    quantity (not just the available remainder), because the approval rule
  //    rejects a count below the reserved quantity — and counting the on-hand
  //    amount matches the system quantity, so no net stock change occurs.
  const workerToken = await getAccessToken(WORKER);
  const balances = await apiRequest<BalanceRecord[]>(
    workerToken,
    "/inventory/balances",
  );
  const balance = balances.find(
    (entry) => entry.quantity > 0 && entry.product.active !== false,
  );
  if (!balance) {
    throw new Error(
      "No stock balance with a positive quantity was found. Seed the demo catalogue with `npm run api:db:seed:demo` and try again.",
    );
  }

  const countedQuantity = Math.max(1, balance.quantity);
  const transaction = await apiRequest<TransactionRecord>(
    workerToken,
    "/inventory/transactions",
    {
      method: "POST",
      body: JSON.stringify({
        action: "CYCLE_COUNT",
        productId: balance.product.id,
        quantity: countedQuantity,
        condition: "GOOD",
        sourceLocationId: balance.location.id,
        transcript: `E2E cycle count: ${countedQuantity} ${balance.product.unit} of ${balance.product.name} at ${balance.location.name}.`,
        clientRequestId: `e2e-approve-${Date.now()}`,
      }),
    },
  );

  const confirmation = await apiRequest<{ outcome: string }>(
    workerToken,
    `/inventory/transactions/${transaction.id}/confirm`,
    { method: "POST", body: "{}" },
  );
  expect(confirmation.outcome, "cycle count must route to review").toBe(
    "PENDING_REVIEW",
  );

  // 3. Stage-8 guard: a worker token must NOT be allowed to approve.
  const workerApprove = await fetch(
    `${API_BASE_URL}/inventory/transactions/${transaction.id}/approve`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${workerToken}`,
      },
      body: JSON.stringify({ note: "must be rejected" }),
    },
  );
  expect(workerApprove.status, "worker approval must be forbidden").toBe(403);

  pendingTransaction = {
    id: transaction.id,
    shortId: `TX-${transaction.id.slice(0, 8).toUpperCase()}`,
    productName: balance.product.name,
    quantity: countedQuantity,
    unit: balance.product.unit,
  };
});

test.afterAll(async () => {
  await restoreKeycloakClient?.();
});

test("manager approves a pending cycle count and the audit trail records it", async ({
  page,
}) => {
  if (!pendingTransaction) {
    throw new Error("beforeAll did not create a pending transaction.");
  }
  const tx = pendingTransaction;

  // 1. The application boots to the secure login screen.
  await page.goto(WEB_APP_URL);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible({
    timeout: 30_000,
  });

  // 2. Choose the Manager workspace and start secure sign-in.
  const managerRoleCard = page
    .locator("button[aria-pressed]")
    .filter({ hasText: "Manager" });
  await managerRoleCard.click();
  await expect(managerRoleCard).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Employee ID").fill(MANAGER.username);
  await page
    .getByRole("button", { name: /Continue as Manager/ })
    .click();

  // 3. Sign in through the real Keycloak login page.
  await page.waitForURL(
    /localhost:8080\/realms\/nirka-inventory\/protocol\/openid-connect\/auth/,
  );
  await page.locator("#username").fill(MANAGER.username);
  await page.locator("#password").fill(MANAGER.password);
  await page
    .locator('#kc-form-login button[type="submit"]')
    .first()
    .click();

  // 4. Redirected back into the Manager dashboard. Wait for the first data
  //    fetch to resolve, then open the Transactions page (Needs review tab
  //    is the default).
  await page.waitForURL(/localhost:3000/);
  await expect(page.locator("#manager-overview-metrics")).toBeVisible();
  await page.getByRole("button", { name: /^Transactions/ }).click();
  await expect(page.locator("#manager-tx-tabbar")).toBeVisible();
  await expect(page.locator("#manager-approvals")).toBeVisible();

  // 5. The pending cycle count appears in the approval queue.
  const pendingCard = page
    .locator("#manager-approvals .divide-y > div")
    .filter({ hasText: tx.shortId });
  await expect(pendingCard).toHaveCount(1);
  await expect(pendingCard).toContainText(/Cycle count/i);
  await expect(pendingCard).toContainText(tx.productName);
  await expect(pendingCard).toContainText(`${tx.quantity} ${tx.unit}`);

  // 6. Approve and post it.
  await pendingCard
    .getByRole("button", { name: "Approve and post" })
    .click();
  await expect(
    page.getByText(
      "Transaction approved and the validated stock adjustment was posted.",
    ),
  ).toBeVisible();
  await expect(
    page.locator("#manager-approvals .divide-y > div").filter({
      hasText: tx.shortId,
    }),
  ).toHaveCount(0);

  // 7. The audit ledger records the posted transaction with the manager as
  //    reviewer. Switch to the History tab inside Transactions.
  await page
    .getByRole("button", { name: "History", exact: true })
    .click();
  await expect(page.locator("#manager-audit-history")).toBeVisible();
  const auditRow = page
    .locator("#manager-audit-history tbody tr")
    .filter({ hasText: tx.shortId });
  await expect(auditRow).toHaveCount(1);
  await expect(auditRow).toContainText(/Cycle count/i);
  await expect(auditRow).toContainText(tx.productName);
  await expect(
    auditRow.locator("span").filter({ hasText: "Posted" }),
  ).toHaveCount(1);
  await expect(auditRow).toContainText("Inventory Manager");

  // 8. Backend confirmation: the transaction is POSTED with an approver.
  const managerToken = await getAccessToken(MANAGER);
  const posted = await apiRequest<TransactionRecord>(
    managerToken,
    `/inventory/transactions/${tx.id}`,
  );
  expect(posted.status).toBe("POSTED");
  expect(posted.approvedBy?.displayName).toBe("Inventory Manager");
});

import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { unlink } from "node:fs/promises";
import { join } from "node:path";

/**
 * Recount-task lifecycle e2e.
 *
 * Regression coverage for the bug where a completed recount reappeared as an
 * open task in the Warehouse Executive queue:
 *
 *   1. Manager requests recount → exactly one open recount task appears.
 *   2. Worker submits a matching recount → the new transaction posts.
 *   3. The linked discrepancy closes.
 *   4. The linked recount task becomes COMPLETED.
 *   5. Worker Open Tasks no longer contains the recount.
 *   6. The open-task badge becomes zero.
 *   7. The original (RECOUNT_REQUESTED) and recount (POSTED) transactions
 *      remain in audit history.
 *   8. A non-matching recount completes the worker task but returns the
 *      discrepancy to manager review.
 *   9. Page refresh does not recreate the completed recount task.
 *  10. No duplicate recount task is created.
 *
 * The queue is driven by the real assigned task status. A transaction keeps
 * RECOUNT_REQUESTED in history forever, so the frontend must never rebuild an
 * open card from that status alone — only from a genuinely open linked task.
 *
 * Setup notes:
 *   - Web app on :3000, API on :4000, Keycloak on :8080, Postgres :5434.
 *   - The Keycloak web client is temporarily given password grants and the
 *     :3000 redirect URI (restored in afterAll), same as the other specs.
 *   - The microphone is mocked and the speech/AI endpoints are routed to
 *     deterministic responses so the worker voice flow is stable offline.
 */

const KEYCLOAK_BASE_URL = "http://localhost:8080";
const API_BASE_URL = "http://localhost:4000/api";
const WEB_APP_URL = "http://localhost:3000";
const REALM = "nirka-inventory";
const WEB_CLIENT_ID = "nirka-inventory-web";

const KEYCLOAK_ADMIN = { username: "nirka-admin", password: "nirka-admin-dev" };
const WORKER = { username: "worker1", password: "Worker@123" };
const MANAGER = { username: "manager1", password: "Manager@123" };
const ADMINISTRATOR = { username: "admin1", password: "Admin@123" };

interface BalanceRecord {
  id: string;
  quantity: number;
  reservedQuantity: number;
  product: { id: string; name: string; unit: string; active?: boolean };
  location: { id: string; code: string; name: string };
}

interface DiscrepancyRecord {
  id: string;
  caseNumber: string;
  transactionId: string;
  status: string;
  expectedQuantity: number;
  countedQuantity: number;
  recountTaskId?: string | null;
  resolutionTransactionId?: string | null;
}

interface CreatedCaseRecord {
  id: string;
  caseNumber: string;
  transactionId: string;
  productId: string;
  locationId: string;
  recountTaskId?: string | null;
  resolutionTransactionId?: string | null;
}

interface TransactionRecord {
  id: string;
  status: string;
  action: string;
  quantity: number;
}

interface InventoryTaskRecord {
  id: string;
  type: string;
  status: string;
  sourceTransactionId?: string | null;
  discrepancies?: Array<{ id: string }> | null;
}

let restoreKeycloakClient: (() => Promise<void>) | null = null;

/** Every case this spec creates, so afterAll can remove all temporary records. */
const createdCases: CreatedCaseRecord[] = [];
/** Every inventory balance this spec can change, keyed by balance id. */
const touchedBalances = new Map<
  string,
  { quantity: number; reservedQuantity: number }
>();
/** Rows created inside this window are removed in afterAll. */
const testWindowStart = new Date();

function trackBalance(
  balance: Pick<BalanceRecord, "id" | "quantity" | "reservedQuantity">,
) {
  if (!touchedBalances.has(balance.id)) {
    touchedBalances.set(balance.id, {
      quantity: balance.quantity,
      reservedQuantity: balance.reservedQuantity,
    });
  }
}

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

/** Raw fetch so tests can assert expected failure status codes. */
async function rawApiCall(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
}

/**
 * Create a differing cycle count as the worker and return the single
 * discrepancy case the backend must create (stock stays unchanged).
 */
async function createDifferingCase(
  workerToken: string,
  productId: string,
  locationId: string,
  countedQuantity: number,
  transcriptNote = "",
): Promise<CreatedCaseRecord> {
  const unit = "unit";
  const transaction = await apiRequest<TransactionRecord>(
    workerToken,
    "/inventory/transactions",
    {
      method: "POST",
      body: JSON.stringify({
        action: "CYCLE_COUNT",
        productId,
        quantity: countedQuantity,
        condition: "GOOD",
        sourceLocationId: locationId,
        transcript: `E2E recount lifecycle: counted ${countedQuantity} ${unit}. ${transcriptNote}`.trim(),
        clientRequestId: `e2e-recount-lifecycle-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      }),
    },
  );
  const confirmation = await apiRequest<{ outcome: string }>(
    workerToken,
    `/inventory/transactions/${transaction.id}/confirm`,
    { method: "POST", body: "{}" },
  );
  if (confirmation.outcome !== "PENDING_REVIEW") {
    throw new Error(
      `Expected a differing cycle count to route to review, got ${confirmation.outcome}.`,
    );
  }
  const cases = await apiRequest<{ items: DiscrepancyRecord[] }>(
    workerToken,
    "/discrepancies?pageSize=50",
  );
  const created = cases.items.find(
    (entry) => entry.transactionId === transaction.id,
  );
  if (!created) {
    throw new Error("The differing cycle count did not create a discrepancy case.");
  }
  const record: CreatedCaseRecord = {
    id: created.id,
    caseNumber: created.caseNumber,
    transactionId: transaction.id,
    productId,
    locationId,
    recountTaskId: null,
    resolutionTransactionId: null,
  };
  createdCases.push(record);
  return record;
}

/**
 * Test-record cleanup runs directly against the local PostgreSQL test
 * database (psql on :5434) in FK-safe order so no temporary transaction,
 * case, task, notification, evidence row or reorder draft survives a run.
 */
const TEST_DB = {
  host: "localhost",
  port: "5434",
  user: "nirka_inventory",
  database: "nirka_inventory",
  password: process.env.E2E_PG_PASSWORD ?? "nirka_inventory_dev",
};

function runSql(sql: string): string {
  return execFileSync(
    "psql",
    [
      "-h", TEST_DB.host,
      "-p", TEST_DB.port,
      "-U", TEST_DB.user,
      "-d", TEST_DB.database,
      "-v", "ON_ERROR_STOP=1",
      "-t",
      "-A",
      "-c", sql,
    ],
    {
      env: { ...process.env, PGPASSWORD: TEST_DB.password },
      stdio: "pipe",
    },
  ).toString();
}

const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;
const inList = (ids: string[]) => ids.map(quote).join(", ");

async function cleanupTestRecords() {
  if (createdCases.length === 0) return;
  const caseIds = createdCases.map((entry) => entry.id);
  const taskIds = [
    ...new Set(
      createdCases
        .map((entry) => entry.recountTaskId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const transactionIds = new Set<string>(
    createdCases.map((entry) => entry.transactionId),
  );
  // Recount transactions link back to their task through recountTaskId, which
  // is not exposed by the transaction API, so find them directly in the DB.
  if (taskIds.length > 0) {
    const rows = runSql(
      `SELECT id FROM inventory_transactions WHERE "recountTaskId" IN (${inList(taskIds)});`,
    );
    for (const line of rows.split("\n").map((line) => line.trim()).filter(Boolean)) {
      transactionIds.add(line);
    }
  }
  const allTransactionIds = [...transactionIds];
  const productIds = [...new Set(createdCases.map((entry) => entry.productId))];
  const locationIds = [...new Set(createdCases.map((entry) => entry.locationId))];

  let storageKeys: string[] = [];
  try {
    const rows = runSql(
      `SELECT "storageKey" FROM discrepancy_evidence WHERE "discrepancyId" IN (${inList(caseIds)}) OR "transactionId" IN (${inList(allTransactionIds)});`,
    );
    storageKeys = rows.split("\n").map((line) => line.trim()).filter(Boolean);
  } catch {
    // Evidence rows may not exist; file cleanup below is best-effort too.
  }

  runSql(
    `DELETE FROM discrepancy_evidence WHERE "discrepancyId" IN (${inList(caseIds)}) OR "transactionId" IN (${inList(allTransactionIds)});`,
  );
  runSql(
    `DELETE FROM notifications WHERE "linkId" IN (${inList([...caseIds, ...taskIds])});`,
  );
  runSql(
    `DELETE FROM discrepancy_audit_events WHERE "discrepancyId" IN (${inList(caseIds)});`,
  );
  runSql(`DELETE FROM discrepancies WHERE id IN (${inList(caseIds)});`);
  // Release the task ↔ transaction links in both directions.
  if (taskIds.length > 0) {
    runSql(
      `UPDATE inventory_tasks SET "sourceTransactionId" = NULL WHERE id IN (${inList(taskIds)});`,
    );
  }
  runSql(
    `DELETE FROM inventory_transactions WHERE id IN (${inList(allTransactionIds)})${taskIds.length > 0 ? ` OR "recountTaskId" IN (${inList(taskIds)})` : ""};`,
  );
  if (taskIds.length > 0) {
    runSql(`DELETE FROM inventory_tasks WHERE id IN (${inList(taskIds)});`);
  }
  if (productIds.length > 0 && locationIds.length > 0) {
    runSql(
      `DELETE FROM reorder_drafts WHERE "productId" IN (${inList(productIds)}) AND "locationId" IN (${inList(locationIds)}) AND status IN ('DRAFT', 'CANCELLED') AND "createdAt" >= ${quote(testWindowStart.toISOString())};`,
    );
  }
  for (const storageKey of storageKeys) {
    await unlink(join(process.cwd(), ".local", "evidence", storageKey)).catch(
      () => undefined,
    );
  }
}

/** Sign a browser session in through the real Keycloak login page. */
async function signInAs(
  page: Page,
  user: { username: string; password: string },
  roleLabel: string,
) {
  await page.goto(WEB_APP_URL);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible({
    timeout: 30_000,
  });
  await page
    .locator("button[aria-pressed]")
    .filter({ hasText: roleLabel })
    .click();
  await page.getByLabel("Employee ID").fill(user.username);
  await page.getByRole("button", { name: /Continue as/ }).click();
  await page.waitForURL(/localhost:8080\/realms\//);
  await page.locator("#username").fill(user.username);
  await page.locator("#password").fill(user.password);
  await page.locator('#kc-form-login button[type="submit"]').first().click();
  await page.waitForURL(/localhost:3000/);
}

/**
 * Put Voice Entry into its editable transcript state without using physical
 * microphone hardware or the local speech model. The AI extraction route is
 * deterministic: the counted quantity is fixed to `countedQuantity`, matching
 * what the worker types, while the task context supplies product/location.
 */
async function installEditableTranscriptCapture(
  page: Page,
  countedQuantity: number,
) {
  await page.route("**/api/speech/transcribe", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        evidenceId: "e2e-recount-empty-transcript",
        storageKey: "e2e/recount.webm",
        text: "",
        language: "en",
        languageProbability: 1,
        duration: 0.1,
        model: "e2e-microphone-mock",
        segments: [],
      }),
    });
  });
  await page.route("**/api/ai/extract-inventory", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        transcript: `Counted ${countedQuantity} units on the shelf.`,
        evidenceId: null,
        model: "e2e-deterministic-extraction",
        readyForConfirmation: true,
        requiresManagerReview: true,
        confidence: 1,
        missingFields: [],
        lowConfidenceFields: [],
        clarificationQuestions: [],
        fields: {
          action: "CYCLE_COUNT",
          product: null,
          quantity: countedQuantity,
          sourceLocation: null,
          destinationLocation: null,
          condition: "GOOD",
          referenceNumber: null,
          notes: "Recount completed from assigned task.",
        },
        fieldConfidence: {
          action: 1,
          product: 1,
          quantity: 1,
          sourceLocation: 1,
          destinationLocation: 1,
          condition: 1,
          referenceNumber: 1,
        },
        sourceLocationSource: null,
        destinationLocationSource: null,
        safetyNotice: "",
      }),
    });
  });
  await page.addInitScript(() => {
    if (location.origin !== "http://localhost:3000") return;

    class FakeMediaRecorder {
      static isTypeSupported(type: string) {
        return type === "audio/webm";
      }

      readonly mimeType: string;
      state = "inactive";
      ondataavailable: ((event: Event) => void) | null = null;
      onstop: ((event: Event) => void) | null = null;

      constructor(_stream: MediaStream, options?: { mimeType?: string }) {
        this.mimeType = options?.mimeType ?? "audio/webm";
      }

      start() {
        this.state = "recording";
      }

      stop() {
        if (this.state !== "recording") return;
        this.state = "inactive";
        const dataEvent = new Event("dataavailable");
        Object.defineProperty(dataEvent, "data", {
          value: new Blob(["e2e"], { type: this.mimeType }),
        });
        this.ondataavailable?.(dataEvent);
        this.onstop?.(new Event("stop"));
      }
    }

    Object.defineProperty(window, "MediaRecorder", {
      value: FakeMediaRecorder,
      configurable: true,
    });
    if (!navigator.mediaDevices) {
      Object.defineProperty(navigator, "mediaDevices", {
        value: {},
        configurable: true,
      });
    }
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: async () => new MediaStream(),
      configurable: true,
    });
  });
}

/**
 * Complete the recount shown in the worker queue using the editable
 * transcript path. Returns nothing; the caller asserts the resulting state.
 */
async function completeRecountInBrowser(
  page: Page,
  caseNumber: string,
  countedQuantity: number,
) {
  await signInAs(page, WORKER, "Warehouse Executive");
  await page.getByRole("button", { name: /^Task queue/ }).click();

  const recountCard = page
    .locator("article")
    .filter({ hasText: "Recount required" })
    .filter({ hasText: caseNumber });
  await expect(recountCard).toHaveCount(1);

  await recountCard.getByRole("button", { name: "Start with voice" }).click();
  await expect(page.getByText("Active assigned task")).toBeVisible();

  await page
    .getByRole("button", { name: "Start microphone recording" })
    .click();
  await page.getByRole("button", { name: "Stop recording" }).click();

  await page.getByLabel("Editable voice transcript").fill(
    `Counted ${countedQuantity} units on the shelf.`,
  );
  await page.getByRole("button", { name: "Extract inventory details" }).click();
  await expect(page.getByRole("button", { name: "Confirm inventory update" })).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole("button", { name: "Confirm inventory update" }).click();
}

/** Assert the worker queue no longer contains the case and the badge is zero. */
async function expectQueueEmpty(page: Page, caseNumber: string) {
  await page.getByRole("button", { name: /^Task queue/ }).click();
  await expect(
    page.locator("article").filter({ hasText: caseNumber }),
  ).toHaveCount(0);
  await expect(page.getByText(/\b0 open\b/)).toBeVisible();
}

test.beforeAll(async () => {
  const adminToken = await getKeycloakAdminToken();
  const originalClient = await readWebClient(adminToken);
  const clientSnapshot = JSON.parse(
    JSON.stringify(originalClient),
  ) as Record<string, unknown>;
  restoreKeycloakClient = async () => {
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
});

test.afterAll(async () => {
  try {
    // Restore every balance this spec may have changed, then remove all
    // temporary records so consecutive full-suite runs stay idempotent.
    const administratorToken = await getAccessToken(ADMINISTRATOR);
    const balances = await apiRequest<BalanceRecord[]>(
      administratorToken,
      "/inventory/balances",
    );
    for (const [balanceId, baseline] of touchedBalances) {
      const current = balances.find((balance) => balance.id === balanceId);
      if (
        current &&
        (current.quantity !== baseline.quantity ||
          current.reservedQuantity !== baseline.reservedQuantity)
      ) {
        await apiRequest(administratorToken, "/inventory/balance-adjustments", {
          method: "POST",
          body: JSON.stringify({
            balanceId,
            quantity: baseline.quantity,
            reservedQuantity: baseline.reservedQuantity,
            reason: "Restore recount-task-lifecycle E2E baseline.",
          }),
        });
      }
    }
    await cleanupTestRecords();
  } finally {
    await restoreKeycloakClient?.();
  }
});

/** Pick a balance the spec has not used yet, preferring larger quantities. */
async function pickUnusedBalance(workerToken: string): Promise<BalanceRecord> {
  const balances = await apiRequest<BalanceRecord[]>(
    workerToken,
    "/inventory/balances",
  );
  const usedProductIds = new Set(createdCases.map((entry) => entry.productId));
  const balance = balances
    .filter(
      (entry) =>
        entry.quantity > 10 &&
        entry.product.active !== false &&
        !usedProductIds.has(entry.product.id),
    )
    .sort((a, b) => b.quantity - a.quantity)[0];
  if (!balance) {
    throw new Error(
      "No unused stock balance above 10 units was found. Seed the demo catalogue with `npm run api:db:seed:demo` and try again.",
    );
  }
  trackBalance(balance);
  return balance;
}

test("manager requests a recount and the backend creates exactly one open RECOUNT task", async ({
  page,
}) => {
  const workerToken = await getAccessToken(WORKER);
  const managerToken = await getAccessToken(MANAGER);
  const balance = await pickUnusedBalance(workerToken);
  const expectedQuantity = balance.quantity;
  const created = await createDifferingCase(
    workerToken,
    balance.product.id,
    balance.location.id,
    expectedQuantity - 3,
    "Matching recount lifecycle test.",
  );
  const expectedCase = created;

  // Manager requests the recount through the Pending approvals review UI
  // (the transaction path), which marks the original transaction
  // RECOUNT_REQUESTED — exactly the reported bug scenario.
  await signInAs(page, MANAGER, "Manager");
  await expect(page.locator("#manager-overview-metrics")).toBeVisible();
  // The Pending approvals review list lives on the Transactions page.
  await page.getByRole("button", { name: /^Transactions/ }).click();
  const pendingCard = page
    .locator("#manager-approvals .divide-y > div")
    .filter({
      hasText: `TX-${expectedCase.transactionId.slice(0, 8).toUpperCase()}`,
    });
  await expect(pendingCard).toHaveCount(1);
  await pendingCard
    .getByRole("button", { name: "Request recount" })
    .click();
  await expect(
    page.getByText("Recount requested. No inventory stock was changed."),
  ).toBeVisible();

  const updated = await apiRequest<DiscrepancyRecord>(
    managerToken,
    `/discrepancies/${expectedCase.id}`,
  );
  expect(updated.status).toBe("RECOUNT_REQUESTED");
  expectedCase.recountTaskId = updated.recountTaskId ?? null;
  expect(expectedCase.recountTaskId).toBeTruthy();

  // The original audit transaction is marked RECOUNT_REQUESTED and keeps that
  // historical status even after the recount is completed later.
  const originalTransaction = await apiRequest<TransactionRecord>(
    workerToken,
    `/inventory/transactions/${expectedCase.transactionId}`,
  );
  expect(originalTransaction.status).toBe("RECOUNT_REQUESTED");

  // Test 10 (case A): exactly one recount task exists for the case, linked to
  // the original transaction and still open.
  const tasks = await apiRequest<InventoryTaskRecord[]>(
    workerToken,
    "/tasks",
  );
  const linked = tasks.filter((task) =>
    task.discrepancies?.some((entry) => entry.id === expectedCase.id),
  );
  expect(linked).toHaveLength(1);
  expect(linked[0]).toMatchObject({
    type: "RECOUNT",
    status: "OPEN",
    sourceTransactionId: expectedCase.transactionId,
  });
});

test("the worker queue shows exactly one open recount card", async ({ page }) => {
  const workerToken = await getAccessToken(WORKER);
  const expectedCase = createdCases.find((entry) => entry.recountTaskId);
  if (!expectedCase) {
    throw new Error("The previous test did not create a recount task.");
  }

  await signInAs(page, WORKER, "Warehouse Executive");
  await page.getByRole("button", { name: /^Task queue/ }).click();
  await expect(
    page.locator("article").filter({ hasText: "Recount required" }).filter({
      hasText: expectedCase.caseNumber,
    }),
  ).toHaveCount(1);
  await expect(page.getByText(/\b1 open\b/)).toBeVisible();

  // Test 10 (case A, queue view): the case number appears on exactly one card.
  const workerTasks = await apiRequest<InventoryTaskRecord[]>(
    workerToken,
    "/tasks",
  );
  expect(
    workerTasks.filter((task) =>
      task.discrepancies?.some((entry) => entry.id === expectedCase.id),
    ),
  ).toHaveLength(1);
});

test("a matching recount posts, closes the case, completes the task, empties the queue and survives a page refresh", async ({
  page,
}) => {
  const workerToken = await getAccessToken(WORKER);
  const managerToken = await getAccessToken(MANAGER);
  const balances = await apiRequest<BalanceRecord[]>(
    workerToken,
    "/inventory/balances",
  );
  const caseRecord = createdCases.find((entry) => entry.recountTaskId);
  if (!caseRecord) {
    throw new Error("beforeAll/previous test did not create a recount case.");
  }
  const recountTaskId = caseRecord.recountTaskId!;
  const expectedQuantity = balances.find(
    (entry) => entry.product.id === caseRecord.productId,
  )?.quantity;
  if (!expectedQuantity) {
    throw new Error("The expected system stock could not be resolved.");
  }

  await installEditableTranscriptCapture(page, expectedQuantity);
  await completeRecountInBrowser(page, caseRecord.caseNumber, expectedQuantity);

  // Test 2: the matching recount transaction posts.
  await expect(page.getByText("Transaction posted")).toBeVisible({
    timeout: 30_000,
  });

  // Tests 5 + 6: the queue no longer contains the recount and the badge is 0.
  await expectQueueEmpty(page, caseRecord.caseNumber);

  // Test 9: a page refresh does not recreate the completed recount task.
  await page.reload();
  await page.getByRole("button", { name: /^Task queue/ }).click();
  await expect(
    page.locator("article").filter({ hasText: caseRecord.caseNumber }),
  ).toHaveCount(0);
  await expect(page.getByText(/\b0 open\b/)).toBeVisible();

  // Test 4: the linked recount task is COMPLETED.
  const tasks = await apiRequest<InventoryTaskRecord[]>(workerToken, "/tasks");
  const completedTask = tasks.find((task) => task.id === recountTaskId);
  expect(completedTask?.status).toBe("COMPLETED");

  // Test 3: the linked discrepancy is CLOSED.
  const discrepancy = await apiRequest<DiscrepancyRecord>(
    managerToken,
    `/discrepancies/${caseRecord.id}`,
  );
  expect(discrepancy.status).toBe("CLOSED");
  expect(discrepancy.resolutionTransactionId).toBeTruthy();

  // Test 7: audit history preserves BOTH transactions — the original keeps
  // RECOUNT_REQUESTED and the recount transaction is POSTED.
  const transactions = await apiRequest<TransactionRecord[]>(
    workerToken,
    "/inventory/transactions",
  );
  const original = transactions.find(
    (transaction) => transaction.id === caseRecord.transactionId,
  );
  expect(original?.status).toBe("RECOUNT_REQUESTED");
  const recountRows = runSql(
    `SELECT status FROM inventory_transactions WHERE "recountTaskId" = ${quote(recountTaskId)};`,
  ).trim();
  expect(recountRows).toBe("POSTED");

  // Stock ends at the physical count, which equals the pre-test system value.
  const balancesAfter = await apiRequest<BalanceRecord[]>(
    workerToken,
    "/inventory/balances",
  );
  const after = balancesAfter.find(
    (entry) => entry.product.id === caseRecord.productId,
  );
  expect(after?.quantity).toBe(expectedQuantity);
});

test("a non-matching recount completes the worker task but returns the case to manager review", async ({
  page,
}) => {
  const workerToken = await getAccessToken(WORKER);
  const managerToken = await getAccessToken(MANAGER);
  const balance = await pickUnusedBalance(workerToken);
  const expectedQuantity = balance.quantity;
  const created = await createDifferingCase(
    workerToken,
    balance.product.id,
    balance.location.id,
    expectedQuantity - 3,
    "Non-matching recount lifecycle test.",
  );

  // Request the recount through the API for speed (the UI path is covered by
  // the first test) and confirm exactly one task was created.
  const requested = await apiRequest<DiscrepancyRecord>(
    managerToken,
    `/discrepancies/${created.id}/request-recount`,
    {
      method: "POST",
      body: JSON.stringify({ instructions: "Count the full shelf again." }),
    },
  );
  expect(requested.status).toBe("RECOUNT_REQUESTED");
  created.recountTaskId = requested.recountTaskId ?? null;
  expect(created.recountTaskId).toBeTruthy();
  const tasks = await apiRequest<InventoryTaskRecord[]>(workerToken, "/tasks");
  expect(
    tasks.filter((task) =>
      task.discrepancies?.some((entry) => entry.id === created.id),
    ),
  ).toHaveLength(1);

  // Worker completes the recount one unit below system stock.
  await installEditableTranscriptCapture(page, expectedQuantity - 1);
  await completeRecountInBrowser(page, created.caseNumber, expectedQuantity - 1);
  await expect(page.getByText("Pending manager review")).toBeVisible({
    timeout: 30_000,
  });

  // Test 5 + 6: the task still leaves the open queue.
  await expectQueueEmpty(page, created.caseNumber);

  // Test 8: the worker task is COMPLETED but the case returns to review.
  const updated = await apiRequest<DiscrepancyRecord>(
    managerToken,
    `/discrepancies/${created.id}`,
  );
  expect(updated.status).toBe("AWAITING_REVIEW");
  const tasksAfter = await apiRequest<InventoryTaskRecord[]>(
    workerToken,
    "/tasks",
  );
  const linkedTask = tasksAfter.find((task) => task.id === created.recountTaskId);
  expect(linkedTask?.status).toBe("COMPLETED");

  // The new recount transaction is confirmed but not posted (no stock change).
  const recountStatus = runSql(
    `SELECT status FROM inventory_transactions WHERE "recountTaskId" = ${quote(created.recountTaskId!)};`,
  ).trim();
  expect(recountStatus).toBe("PENDING");
  const balancesAfter = await apiRequest<BalanceRecord[]>(
    workerToken,
    "/inventory/balances",
  );
  const after = balancesAfter.find((entry) => entry.id === balance.id);
  expect(after?.quantity).toBe(expectedQuantity);
});

test("a second recount request is refused while a recount task is open", async () => {
  const workerToken = await getAccessToken(WORKER);
  const managerToken = await getAccessToken(MANAGER);
  const balance = await pickUnusedBalance(workerToken);
  const expectedQuantity = balance.quantity;
  const created = await createDifferingCase(
    workerToken,
    balance.product.id,
    balance.location.id,
    expectedQuantity - 3,
    "Duplicate recount guard test.",
  );

  await apiRequest<DiscrepancyRecord>(
    managerToken,
    `/discrepancies/${created.id}/request-recount`,
    {
      method: "POST",
      body: JSON.stringify({ instructions: "Count the shelf once." }),
    },
  );
  const updated = await apiRequest<DiscrepancyRecord>(
    managerToken,
    `/discrepancies/${created.id}`,
  );
  expect(updated.status).toBe("RECOUNT_REQUESTED");
  created.recountTaskId = updated.recountTaskId ?? null;
  expect(created.recountTaskId).toBeTruthy();

  // Test 10: a second request while the task is still open is refused.
  const duplicateAttempt = await rawApiCall(
    managerToken,
    `/discrepancies/${created.id}/request-recount`,
    {
      method: "POST",
      body: JSON.stringify({ instructions: "Duplicate recount must be refused." }),
    },
  );
  expect(duplicateAttempt.status).toBe(409);

  // Exactly one recount task exists for the case.
  const tasks = await apiRequest<InventoryTaskRecord[]>(
    workerToken,
    "/tasks",
  );
  expect(
    tasks.filter((task) =>
      task.discrepancies?.some((entry) => entry.id === created.id),
    ),
  ).toHaveLength(1);
});

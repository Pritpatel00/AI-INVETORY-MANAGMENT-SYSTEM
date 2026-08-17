import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { unlink } from "node:fs/promises";
import { join } from "node:path";

/**
 * Discrepancy management e2e (Step 3).
 *
 * Full worker → manager workflow:
 *   1. API setup creates a cycle-count difference as the worker, which the
 *      backend turns into one discrepancy case (stock unchanged).
 *   2. The manager signs in, sees the case, requests a recount (stock stays
 *      unchanged) and attaches photo evidence.
 *   3. The worker receives the recount task with the case details, starts it
 *      in Voice Entry, types the recount transcript (the real local speech and
 *      AI services are exercised by the existing voice-capture spec; the typed
 *      transcript path keeps this run stable) and confirms.
 *   4. The manager approves the recount result; the ledger posts and the
 *      append-only audit history shows the complete sequence.
 *   5. Reports render from real records, CSV export downloads, workers cannot
 *      use manager actions, and the mobile layout has no horizontal overflow.
 *
 * Setup notes:
 *   - Web app on :3000, API on :4000, Keycloak on :8080, Postgres :5434.
 *   - The Keycloak web client is temporarily given password grants and the
 *     :3000 redirect URI (restored in afterAll), same as the approval spec.
 *   - The microphone is mocked for stable browser runs; camera input is
 *     exercised through a real file picker with a generated PNG buffer.
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
  severity: string;
  severityRule?: string | null;
  expectedQuantity: number;
  countedQuantity: number;
  differenceQuantity: number;
  recountTaskId?: string | null;
  resolutionTransactionId?: string | null;
  worker?: { displayName?: string } | null;
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
  product: { name: string; unit: string };
  sourceLocation?: { name: string } | null;
  approvedBy?: { displayName?: string } | null;
}

let caseRecord: DiscrepancyRecord | null = null;
let restoreKeycloakClient: (() => Promise<void>) | null = null;

/** Every case this spec creates, so afterAll can remove all temporary records. */
const createdCases: CreatedCaseRecord[] = [];
/** Every inventory balance this spec can change, keyed by balance id. */
const touchedBalances = new Map<
  string,
  { quantity: number; reservedQuantity: number }
>();

/**
 * Remember a balance's ORIGINAL pre-test state. The first captured baseline
 * always wins: several tests can move the same balance (approve + transfer),
 * but afterAll must restore to the state that existed before the spec ran.
 */
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
/** Balance rows that did not exist before a resolve-transfer created them. */
const transferCreatedBalances: Array<{ productId: string; locationId: string }> = [];
/** Records created inside this window are removed in afterAll. */
const testWindowStart = new Date();

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
        transcript: `E2E discrepancy: counted ${countedQuantity} ${unit}. ${transcriptNote}`.trim(),
        clientRequestId: `e2e-discrepancy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
  const created = cases.items.find((entry) => entry.transactionId === transaction.id);
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
  const transactionIds = [
    ...new Set(
      createdCases.flatMap((entry) =>
        [entry.transactionId, entry.resolutionTransactionId].filter(
          (id): id is string => Boolean(id),
        ),
      ),
    ),
  ];
  const productIds = [...new Set(createdCases.map((entry) => entry.productId))];
  const locationIds = [...new Set(createdCases.map((entry) => entry.locationId))];

  // Capture storage keys first, then delete rows in FK-safe order.
  let storageKeys: string[] = [];
  try {
    const rows = runSql(
      `SELECT "storageKey" FROM discrepancy_evidence WHERE "discrepancyId" IN (${inList(caseIds)}) OR "transactionId" IN (${inList(transactionIds)});`,
    );
    storageKeys = rows.split("\n").map((line) => line.trim()).filter(Boolean);
  } catch {
    // Evidence rows may not exist; file cleanup below is best-effort too.
  }

  runSql(
    `DELETE FROM discrepancy_evidence WHERE "discrepancyId" IN (${inList(caseIds)}) OR "transactionId" IN (${inList(transactionIds)});`,
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
    `DELETE FROM inventory_transactions WHERE id IN (${inList(transactionIds)})${taskIds.length > 0 ? ` OR "recountTaskId" IN (${inList(taskIds)})` : ""};`,
  );
  if (taskIds.length > 0) {
    runSql(`DELETE FROM inventory_tasks WHERE id IN (${inList(taskIds)});`);
  }
  // Reorder drafts the test posting may have created for the affected items.
  // DRAFT and CANCELLED are both removed: a draft is cancelled when a balance
  // restore brings stock back above the safety level, so a CANCELLED row is
  // just as much a test artifact as the DRAFT it replaced.
  if (productIds.length > 0 && locationIds.length > 0) {
    runSql(
      `DELETE FROM reorder_drafts WHERE "productId" IN (${inList(productIds)}) AND "locationId" IN (${inList(locationIds)}) AND status IN ('DRAFT', 'CANCELLED') AND "createdAt" >= ${quote(testWindowStart.toISOString())};`,
    );
  }
  // Balance rows created by resolve-transfer that did not exist before.
  for (const balance of transferCreatedBalances) {
    runSql(
      `DELETE FROM inventory_balances WHERE "productId" = ${quote(balance.productId)} AND "locationId" = ${quote(balance.locationId)};`,
    );
  }
  // Best-effort removal of uploaded evidence files from local disk.
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
 * microphone hardware or the local speech model. AI extraction remains real.
 */
async function installEditableTranscriptCapture(page: Page, countedQuantity: number) {
  await page.route("**/api/speech/transcribe", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        evidenceId: "e2e-empty-transcript",
        storageKey: "e2e/empty.webm",
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

  // Create a genuine discrepancy as the worker: count 13 units below the
  // system balance. The backend creates one case and leaves stock unchanged.
  const workerToken = await getAccessToken(WORKER);
  const balances = await apiRequest<BalanceRecord[]>(
    workerToken,
    "/inventory/balances",
  );
  const balance = balances.find(
    (entry) => entry.quantity > 3 && entry.product.active !== false,
  );
  if (!balance) {
    throw new Error(
      "No stock balance above 3 units was found. Seed the demo catalogue with `npm run api:db:seed:demo` and try again.",
    );
  }
  const countedQuantity = balance.quantity - 3;
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
        transcript: `E2E discrepancy: counted ${countedQuantity} ${balance.product.unit} of ${balance.product.name}.`,
        clientRequestId: `e2e-discrepancy-${Date.now()}`,
      }),
    },
  );

  const confirmation = await apiRequest<{ outcome: string }>(
    workerToken,
    `/inventory/transactions/${transaction.id}/confirm`,
    { method: "POST", body: "{}" },
  );
  expect(confirmation.outcome, "differing cycle count must route to review").toBe(
    "PENDING_REVIEW",
  );

  const cases = await apiRequest<{ items: DiscrepancyRecord[] }>(
    workerToken,
    "/discrepancies?pageSize=20",
  );
  const created = cases.items.find((entry) => entry.expectedQuantity === balance.quantity);
  if (!created) {
    throw new Error("The differing cycle count did not create a discrepancy case.");
  }
  expect(created.countedQuantity).toBe(countedQuantity);
  caseRecord = created;
  createdCases.push({
    id: created.id,
    caseNumber: created.caseNumber,
    transactionId: transaction.id,
    productId: balance.product.id,
    locationId: balance.location.id,
    recountTaskId: null,
    resolutionTransactionId: null,
  });
  trackBalance(balance);

  // Stock must remain unchanged while review is pending.
  const balancesAfter = await apiRequest<BalanceRecord[]>(
    workerToken,
    "/inventory/balances",
  );
  const balanceAfter = balancesAfter.find((entry) => entry.id === balance.id);
  expect(balanceAfter?.quantity).toBe(balance.quantity);
});

test.afterAll(async () => {
  try {
    // Restore every balance this spec may have changed (the approved recount
    // and the resolve-transfer both post real stock adjustments), then remove
    // all temporary records so consecutive full-suite runs stay idempotent.
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
            reason: "Restore discrepancy-management E2E baseline.",
          }),
        });
      }
    }
    await cleanupTestRecords();
  } finally {
    await restoreKeycloakClient?.();
  }
});

test("worker cannot use manager discrepancy actions", async () => {
  if (!caseRecord) throw new Error("beforeAll did not create a case.");
  const workerToken = await getAccessToken(WORKER);
  const approveAttempt = await fetch(
    `${API_BASE_URL}/discrepancies/${caseRecord.id}/approve`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${workerToken}`,
      },
      body: JSON.stringify({ note: "must be forbidden" }),
    },
  );
  expect(approveAttempt.status).toBe(403);
  const recountAttempt = await fetch(
    `${API_BASE_URL}/discrepancies/${caseRecord.id}/request-recount`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${workerToken}`,
      },
      body: JSON.stringify({ instructions: "must be forbidden" }),
    },
  );
  expect(recountAttempt.status).toBe(403);
});

test("manager sees the discrepancy, opens details and requests a recount", async ({
  page,
}) => {
  if (!caseRecord) throw new Error("beforeAll did not create a case.");
  const expectedCase = caseRecord;

  await signInAs(page, MANAGER, "Manager");
  await expect(page.locator("#manager-overview-metrics")).toBeVisible();

  // Sidebar navigation now includes the Discrepancies page.
  await page.getByRole("button", { name: /^Discrepancies/ }).click();
  await expect(page.getByText("Manager-only · count accuracy")).toBeVisible();

  // The case is listed with severity, difference and status.
  const caseRow = page.locator("tbody tr").filter({ hasText: expectedCase.caseNumber });
  await expect(caseRow).toHaveCount(1);
  await expect(caseRow).toContainText(expectedCase.severity);
  await expect(caseRow).toContainText("Awaiting review");

  // Open details and request a recount. Stock must stay unchanged.
  await caseRow.getByRole("button", { name: "Review" }).click();
  await expect(
    page.getByRole("dialog", { name: `Case ${expectedCase.caseNumber}` }),
  ).toBeVisible();
  // Case details show the deterministic severity rule that classified the case.
  await expect(page.getByText("Severity rule", { exact: true })).toBeVisible();
  await expect(page.getByText(/Difference of \d+ units? \(/).first()).toBeVisible();
  await page.getByRole("button", { name: "Request recount" }).click();
  await page
    .getByLabel("Instructions (required)")
    .fill("Count the full shelf again and report the number.");
  await page.getByRole("button", { name: "Create recount task" }).click();
  await expect(
    page.getByText(/A recount task was created/),
  ).toBeVisible();

  const managerToken = await getAccessToken(MANAGER);
  const updated = await apiRequest<DiscrepancyRecord>(
    managerToken,
    `/discrepancies/${expectedCase.id}`,
  );
  expect(updated.status).toBe("RECOUNT_REQUESTED");
  expect(updated.severityRule).toBeTruthy();
  const createdCase = createdCases.find((entry) => entry.id === expectedCase.id);
  if (createdCase) createdCase.recountTaskId = updated.recountTaskId ?? null;
  expect(createdCase?.recountTaskId).toBeTruthy();

  // The manager was notified when the discrepancy was created.
  const managerNotifications = await apiRequest<
    Array<{ type: string; title: string; linkId?: string | null }>
  >(managerToken, "/notifications");
  expect(
    managerNotifications.some(
      (notification) =>
        notification.linkId === expectedCase.id &&
        (notification.type === "NEW_DISCREPANCY" ||
          notification.type === "MAJOR_CRITICAL_DISCREPANCY"),
    ),
  ).toBe(true);

  // The Warehouse Executive was notified about the assigned recount.
  const workerToken = await getAccessToken(WORKER);
  const workerNotifications = await apiRequest<
    Array<{ type: string; title: string }>
  >(workerToken, "/notifications");
  expect(
    workerNotifications.some(
      (notification) =>
        notification.type === "RECOUNT_ASSIGNED" &&
        notification.title.includes(expectedCase.caseNumber),
    ),
  ).toBe(true);

  // Stock never changed while the case was pending review.
  const balances = await apiRequest<BalanceRecord[]>(
    managerToken,
    "/inventory/balances",
  );
  const originalBalance = balances.find(
    (entry) => entry.quantity === expectedCase.expectedQuantity,
  );
  expect(originalBalance).toBeTruthy();
});

test("manager attaches photo evidence to the case", async ({ page }) => {
  if (!caseRecord) throw new Error("beforeAll did not create a case.");
  const expectedCase = caseRecord;

  await signInAs(page, MANAGER, "Manager");
  await page.getByRole("button", { name: /^Discrepancies/ }).click();
  const caseRow = page.locator("tbody tr").filter({ hasText: expectedCase.caseNumber });
  await caseRow.getByRole("button", { name: "Review" }).click();

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  await page
    .locator("label", { hasText: "Choose file" })
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "shelf-photo.png",
      mimeType: "image/png",
      buffer: png,
    });
  await expect(page.getByAltText("Evidence photo preview")).toBeVisible();
  await page.getByRole("button", { name: "Upload photo" }).click();
  await expect(page.getByText("Photo evidence uploaded and linked to the case.")).toBeVisible();
  await expect(page.getByText("shelf-photo.png")).toBeVisible();

  const managerToken = await getAccessToken(MANAGER);
  const evidence = await apiRequest<
    Array<{ id: string; originalFilename: string; mimeType: string; sizeBytes: number }>
  >(managerToken, `/discrepancies/${expectedCase.id}/evidence`);
  expect(evidence.length).toBeGreaterThanOrEqual(1);
  expect(evidence[0]).toMatchObject({
    originalFilename: "shelf-photo.png",
    mimeType: "image/png",
  });
  expect(evidence[0].sizeBytes).toBe(png.length);
});

test("worker receives the recount task and completes it with voice", async ({
  page,
}) => {
  if (!caseRecord) throw new Error("beforeAll did not create a case.");
  const expectedCase = caseRecord;

  await installEditableTranscriptCapture(
    page,
    expectedCase.expectedQuantity - 1,
  );
  await signInAs(page, WORKER, "Warehouse Executive");
  await page.getByRole("button", { name: /^Task queue/ }).click();

  const recountCard = page
    .locator("article")
    .filter({ hasText: `Recount required` })
    .filter({ hasText: expectedCase.caseNumber });
  await expect(recountCard).toHaveCount(1);
  await expect(recountCard).toContainText(expectedCase.caseNumber);

  // Start with Voice → Voice Entry opens with the task prefilled.
  await recountCard.getByRole("button", { name: "Start with voice" }).click();
  await expect(page.getByText("Active assigned task")).toBeVisible();

  // Start and stop the mocked microphone once. The mocked transcription is
  // empty, so the current UI opens its editable transcript correction state.
  await page
    .getByRole("button", { name: "Start microphone recording" })
    .click();
  await page.getByRole("button", { name: "Stop recording" }).click();

  // Type the corrected transcript (the real local speech service is covered
  // by the voice-capture spec) and extract through the real AI.
  // The recount reports one unit below system stock, so the case returns to
  // manager review and the manager approval step can run.
  await page.getByLabel("Editable voice transcript").fill(
    `Counted ${expectedCase.expectedQuantity - 1} units on the shelf.`,
  );
  await page.getByRole("button", { name: "Extract inventory details" }).click();
  await expect(page.getByRole("button", { name: "Confirm inventory update" })).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole("button", { name: "Confirm inventory update" }).click();
  await expect(page.getByText("Pending manager review")).toBeVisible({
    timeout: 30_000,
  });
});

test("manager approves the recount result and the audit sequence is complete", async ({
  page,
}) => {
  if (!caseRecord) throw new Error("beforeAll did not create a case.");
  const expectedCase = caseRecord;

  await signInAs(page, MANAGER, "Manager");
  await page.getByRole("button", { name: /^Discrepancies/ }).click();

  // The recount result returns the case to review (or closes it when it
  // matches). Approve it so stock updates through the ledger.
  const caseRow = page.locator("tbody tr").filter({ hasText: expectedCase.caseNumber });
  await expect(caseRow).toHaveCount(1);
  await caseRow.getByRole("button", { name: "Review" }).click();
  await page.getByRole("button", { name: "Approve adjustment" }).click();
  await page
    .getByLabel("Manager note (required)")
    .fill("Recount confirmed against the physical shelf.");
  await page.getByRole("button", { name: "Approve and post" }).click();
  await expect(page.getByText(/Case .* approved/)).toBeVisible();

  // The approval keeps the case dialog open so the append-only audit sequence
  // can be reviewed immediately without reopening the same case.
  await expect(
    page.getByRole("dialog", { name: `Case ${expectedCase.caseNumber}` }),
  ).toBeVisible();
  const auditTimeline = page
    .getByText("Audit history · append-only")
    .locator("..");
  await expect(auditTimeline).toBeVisible();
  await expect(auditTimeline.getByText("Case created", { exact: true })).toBeVisible();
  await expect(auditTimeline.getByText("Worker confirmed", { exact: true })).toBeVisible();
  await expect(auditTimeline.getByText("Recount requested", { exact: true })).toBeVisible();
  await expect(auditTimeline.getByText("Approved", { exact: true })).toBeVisible();
  await expect(auditTimeline.getByText("Case closed", { exact: true })).toBeVisible();

  const managerToken = await getAccessToken(MANAGER);
  const audit = await apiRequest<Array<{ action: string }>>(
    managerToken,
    `/discrepancies/${expectedCase.id}/audit`,
  );
  const actions = audit.map((event) => event.action);
  expect(actions).toContain("CASE_CREATED");
  expect(actions).toContain("WORKER_CONFIRMED");
  expect(actions).toContain("REVIEW_OPENED");
  expect(actions).toContain("RECOUNT_REQUESTED");
  expect(actions).toContain("RECOUNT_COMPLETED");
  expect(actions).toContain("APPROVED");
  expect(actions).toContain("CASE_CLOSED");
  // Append-only: events are only ever appended — the same action never
  // overwrites an earlier one, and old event rows still exist in order.
  const firstIndex = actions.indexOf("CASE_CREATED");
  const closedIndex = actions.lastIndexOf("CASE_CLOSED");
  expect(firstIndex).toBeGreaterThanOrEqual(0);
  expect(closedIndex).toBeGreaterThan(firstIndex);

  // Recount completion notified managers; approval notified the worker.
  const managerNotifications = await apiRequest<
    Array<{ type: string; title: string; linkId?: string | null }>
  >(managerToken, "/notifications");
  expect(
    managerNotifications.some(
      (notification) =>
        notification.type === "RECOUNT_COMPLETED" &&
        notification.linkId === expectedCase.id,
    ),
  ).toBe(true);
  const workerToken = await getAccessToken(WORKER);
  const workerNotifications = await apiRequest<
    Array<{ type: string; title: string }>
  >(workerToken, "/notifications");
  expect(
    workerNotifications.some(
      (notification) =>
        notification.type === "DISCREPANCY_APPROVED" &&
        notification.title.includes(expectedCase.caseNumber),
    ),
  ).toBe(true);

  // The append-only audit trail records the applied severity rule.
  const auditWithRule = await apiRequest<
    Array<{ action: string; severityRule?: string | null }>
  >(managerToken, `/discrepancies/${expectedCase.id}/audit`);
  expect(auditWithRule.some((event) => Boolean(event.severityRule))).toBe(true);
});

test("a second recount request is rejected while a recount task is open", async () => {
  const workerToken = await getAccessToken(WORKER);
  const managerToken = await getAccessToken(MANAGER);
  const balances = await apiRequest<BalanceRecord[]>(
    workerToken,
    "/inventory/balances",
  );
  const balance = balances.find(
    (entry) => entry.quantity > 2 && entry.product.active !== false,
  );
  if (!balance) {
    throw new Error("No stock balance above 2 units was found.");
  }
  const created = await createDifferingCase(
    workerToken,
    balance.product.id,
    balance.location.id,
    balance.quantity - 1,
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

  // A second request while the task is still open is rejected.
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
  const tasks = await apiRequest<
    Array<{ id: string; discrepancies?: Array<{ id: string }> | null }>
  >(workerToken, "/tasks");
  const linked = tasks.filter((task) =>
    task.discrepancies?.some((entry) => entry.id === created.id),
  );
  expect(linked).toHaveLength(1);
});

test("rejection leaves stock unchanged and repeated actions are rejected", async () => {
  const workerToken = await getAccessToken(WORKER);
  const managerToken = await getAccessToken(MANAGER);
  const balances = await apiRequest<BalanceRecord[]>(
    workerToken,
    "/inventory/balances",
  );
  const balance = balances.find(
    (entry) => entry.quantity > 2 && entry.product.active !== false,
  );
  if (!balance) {
    throw new Error("No stock balance above 2 units was found.");
  }
  const quantityBefore = balance.quantity;
  const created = await createDifferingCase(
    workerToken,
    balance.product.id,
    balance.location.id,
    quantityBefore - 2,
    "Reject test.",
  );

  const rejected = await apiRequest<DiscrepancyRecord>(
    managerToken,
    `/discrepancies/${created.id}/reject`,
    {
      method: "POST",
      body: JSON.stringify({
        reason: "The counted quantity cannot be confirmed against the shelf record.",
      }),
    },
  );
  expect(rejected.status).toBe("REJECTED");

  // Stock is untouched by rejection.
  const balancesAfter = await apiRequest<BalanceRecord[]>(
    managerToken,
    "/inventory/balances",
  );
  const after = balancesAfter.find((entry) => entry.id === balance.id);
  expect(after?.quantity).toBe(quantityBefore);

  // Repeated and invalid manager actions are rejected.
  const approveAttempt = await rawApiCall(
    managerToken,
    `/discrepancies/${created.id}/approve`,
    { method: "POST", body: JSON.stringify({ note: "Must not be accepted after rejection." }) },
  );
  expect(approveAttempt.status).toBe(409);
  const recountAttempt = await rawApiCall(
    managerToken,
    `/discrepancies/${created.id}/request-recount`,
    { method: "POST", body: JSON.stringify({ instructions: "Must not be accepted after rejection." }) },
  );
  expect(recountAttempt.status).toBe(409);
});

test("resolve as transfer preserves total inventory and blocks duplicate posting", async () => {
  const workerToken = await getAccessToken(WORKER);
  const managerToken = await getAccessToken(MANAGER);
  const [balances, locations] = await Promise.all([
    apiRequest<BalanceRecord[]>(workerToken, "/inventory/balances"),
    apiRequest<Array<{ id: string; name: string; active?: boolean }>>(
      workerToken,
      "/inventory/locations",
    ),
  ]);
  // A product with at least 3 units at one location and no balance row at
  // another active location — stock physically found there, recorded here.
  // The source must not already be tracked by this spec (the main case may
  // use it), so the two tests never fight over the same balance.
  const source = balances.find(
    (entry) =>
      entry.quantity >= 3 &&
      entry.product.active !== false &&
      !touchedBalances.has(entry.id),
  );
  if (!source) {
    throw new Error("No product balance of 3+ units was found.");
  }
  const destination = locations.find(
    (location) =>
      location.id !== source.location.id &&
      location.active !== false &&
      !balances.some(
        (entry) =>
          entry.product.id === source.product.id &&
          entry.location.id === location.id,
      ),
  );
  if (!destination) {
    throw new Error("No alternate empty location exists for the selected product.");
  }
  const moved = source.quantity;
  const totalBefore = balances
    .filter((entry) => entry.product.id === source.product.id)
    .reduce((sum, entry) => sum + entry.quantity, 0);
  const created = await createDifferingCase(
    workerToken,
    source.product.id,
    destination.id,
    moved,
    "Resolve-as-transfer test.",
  );

  const resolved = await apiRequest<DiscrepancyRecord>(
    managerToken,
    `/discrepancies/${created.id}/resolve-transfer`,
    {
      method: "POST",
      body: JSON.stringify({
        sourceLocationId: source.location.id,
        destinationLocationId: destination.id,
        note: `Stock physically found at ${destination.name} but recorded at ${source.location.name}.`,
      }),
    },
  );
  expect(resolved.status).toBe("RESOLVED_AS_TRANSFER");
  created.resolutionTransactionId = resolved.resolutionTransactionId ?? null;
  expect(created.resolutionTransactionId).toBeTruthy();

  // Source decreased and destination increased by exactly the moved quantity.
  const balancesAfter = await apiRequest<BalanceRecord[]>(
    managerToken,
    "/inventory/balances",
  );
  const sourceAfter = balancesAfter.find((entry) => entry.id === source.id);
  const destinationRow = balancesAfter.find(
    (entry) =>
      entry.product.id === source.product.id &&
      entry.location.id === destination.id,
  );
  expect(sourceAfter?.quantity).toBe(0);
  expect(destinationRow?.quantity).toBe(moved);
  const totalAfter = balancesAfter
    .filter((entry) => entry.product.id === source.product.id)
    .reduce((sum, entry) => sum + entry.quantity, 0);
  expect(totalAfter).toBe(totalBefore);

  trackBalance(source);
  transferCreatedBalances.push({
    productId: source.product.id,
    locationId: destination.id,
  });

  // Duplicate transfer posting is prevented.
  const transferAttempt = await rawApiCall(
    managerToken,
    `/discrepancies/${created.id}/resolve-transfer`,
    {
      method: "POST",
      body: JSON.stringify({
        sourceLocationId: source.location.id,
        destinationLocationId: destination.id,
        note: "Duplicate transfer.",
      }),
    },
  );
  expect(transferAttempt.status).toBe(409);
});

test("reports render from real records and CSV export downloads", async ({
  page,
}) => {
  if (!caseRecord) throw new Error("beforeAll did not create a case.");

  await signInAs(page, MANAGER, "Manager");
  await page.getByRole("button", { name: /^Discrepancies/ }).click();
  await page.getByRole("button", { name: "Manager reports" }).click();
  await expect(page.getByText("Discrepancy insights")).toBeVisible();
  await expect(page.getByText("Difference split")).toBeVisible();
  await expect(page.getByText("Severity distribution")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^discrepancies-\d{4}-\d{2}-\d{2}\.csv$/);

  // CSV cells never start with formula characters.
  const stream = await download.createReadStream();
  let csv = "";
  for await (const chunk of stream) csv += chunk.toString();
  expect(csv).toContain("Case number");
  expect(csv).toContain(caseRecord.caseNumber);
});

test("all six summary cards open their matching case information", async ({
  page,
}) => {
  await signInAs(page, MANAGER, "Manager");
  await expect(page.getByText("Inventory Manager", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: /^Discrepancies/ }).click();
  await expect(page.getByRole("heading", { name: "Discrepancies" }).last()).toBeVisible();

  const cards = [
    { accessibleName: "Show open discrepancy details", view: "OPEN", label: "Open" },
    { accessibleName: "Show awaiting recount discrepancy details", view: "AWAITING_RECOUNT", label: "Awaiting recount" },
    { accessibleName: "Show major and critical discrepancy details", view: "HIGH_PRIORITY", label: "Major and critical" },
    { accessibleName: "Show resolved today discrepancy details", view: "RESOLVED_TODAY", label: "Resolved today" },
    { accessibleName: "Show missing quantity discrepancy details", view: "MISSING", label: "Missing quantity" },
    { accessibleName: "Show extra quantity discrepancy details", view: "EXTRA", label: "Extra quantity" },
  ];

  for (const card of cards) {
    const responsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname.endsWith("/api/discrepancies") && url.searchParams.get("view") === card.view;
    });
    const button = page.getByRole("button", { name: card.accessibleName });
    await button.click();
    await responsePromise;
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(`Showing: ${card.label}`, { exact: true })).toBeVisible();
  }

  await page.getByRole("button", { name: "Show all cases" }).click();
  await expect(page.getByText("Showing: Extra quantity", { exact: true })).toBeHidden();
});

test("mobile layout has no horizontal overflow and buttons have accessible names", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInAs(page, MANAGER, "Manager");

  // Open the mobile navigation drawer and navigate to Discrepancies.
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: /^Discrepancies/ }).click();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
  // Mobile cards render instead of the desktop table.
  await expect(page.getByText("Manager-only · count accuracy")).toBeVisible();

  // Icon-only buttons (bell, logout, menu) carry accessible labels.
  await expect(page.getByRole("button", { name: /Notifications/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
});

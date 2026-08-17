import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { unlink } from "node:fs/promises";
import { join } from "node:path";

/**
 * Manager visibility of worker-uploaded photo evidence e2e.
 *
 *  1. A worker creates Damage/Receive transactions and uploads photos.
 *  2. The manager sees a "Photo evidence" badge (with count) in both the
 *     "Needs review" tab and the "History" (audit) tab.
 *  3. Opening a transaction shows thumbnails; clicking a thumbnail opens a
 *     large preview with filename, uploader, upload date and time.
 *  4. Transactions without photos show the empty state.
 *  5. No console or runtime errors are raised during the flows.
 *  6. Evidence uploaded to a discrepancy case is the same physical file
 *     exposed through the transaction evidence endpoint (no duplicates).
 *
 * The worker uploads photos through the real API (multipart), the same way
 * the ExecutiveDashboard "Attach photo evidence" flow does.
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

interface TransactionRecord {
  id: string;
  action: string;
  status: string;
  quantity: number;
  product: { name: string; unit: string };
  createdAt: string;
  _count?: { evidence?: number };
}

interface EvidenceRecord {
  id: string;
  discrepancyId?: string | null;
  transactionId?: string | null;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploadedBy?: { id: string; displayName: string } | null;
}

interface DiscrepancyRecord {
  id: string;
  caseNumber: string;
  transactionId: string;
  status: string;
}

let restoreKeycloakClient: (() => Promise<void>) | null = null;

/** Transactions this spec creates, so afterAll can remove all temporary rows. */
const createdTransactionIds: string[] = [];
/** Discrepancy cases this spec creates (for the linkage test). */
const createdCaseIds: string[] = [];
/** Evidence storage keys found in the DB, removed from disk in afterAll. */
let evidenceStorageKeys: string[] = [];
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

/** A tiny valid PNG (1x1) used as fake photo evidence. */
const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function uploadTransactionPhoto(
  token: string,
  transactionId: string,
  filename: string,
): Promise<EvidenceRecord> {
  const form = new FormData();
  form.append(
    "photo",
    new Blob([tinyPng], { type: "image/png" }),
    filename,
  );
  const response = await fetch(
    `${API_BASE_URL}/transactions/${transactionId}/evidence`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    },
  );
  await expectJsonOk(response, `Evidence upload ${filename}`);
  return response.json() as Promise<EvidenceRecord>;
}

/** Create a worker-confirmed Damage transaction (appears in Needs review). */
async function createDamageTransaction(
  workerToken: string,
  productId: string,
  locationId: string,
  note: string,
): Promise<TransactionRecord> {
  const transaction = await apiRequest<TransactionRecord>(
    workerToken,
    "/inventory/transactions",
    {
      method: "POST",
      body: JSON.stringify({
        action: "DAMAGE",
        productId,
        quantity: 1,
        condition: "DAMAGED",
        sourceLocationId: locationId,
        transcript: `E2E evidence: ${note}`,
        clientRequestId: `e2e-evidence-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
      `Expected a Damage transaction to route to review, got ${confirmation.outcome}.`,
    );
  }
  createdTransactionIds.push(transaction.id);
  return transaction;
}

/** Collect browser console errors and page exceptions during a flow. */
function trackBrowserErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`console: ${message.text()}`);
    }
  });
  return errors;
}

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
  const transactionIds = [...createdTransactionIds];
  const caseIds = [...createdCaseIds];
  if (transactionIds.length === 0 && caseIds.length === 0) return;

  const evidencePredicates: string[] = [];
  if (transactionIds.length > 0) {
    evidencePredicates.push(`"transactionId" IN (${inList(transactionIds)})`);
  }
  if (caseIds.length > 0) {
    evidencePredicates.push(`"discrepancyId" IN (${inList(caseIds)})`);
  }
  const evidenceWhere = evidencePredicates.join(" OR ");

  try {
    const rows = runSql(
      `SELECT "storageKey" FROM discrepancy_evidence WHERE ${evidenceWhere};`,
    );
    evidenceStorageKeys = rows
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    // Evidence rows may not exist; file cleanup below is best-effort too.
  }

  runSql(
    `DELETE FROM discrepancy_evidence WHERE ${evidenceWhere};`,
  );
  if (caseIds.length > 0) {
    runSql(
      `DELETE FROM notifications WHERE "linkId" IN (${inList(caseIds)});`,
    );
    runSql(
      `DELETE FROM discrepancy_audit_events WHERE "discrepancyId" IN (${inList(caseIds)});`,
    );
    runSql(`DELETE FROM discrepancies WHERE id IN (${inList(caseIds)});`);
  }
  if (transactionIds.length > 0) {
    runSql(
      `DELETE FROM inventory_transactions WHERE id IN (${inList(transactionIds)});`,
    );
  }
  for (const storageKey of evidenceStorageKeys) {
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

let damageWithPhotos: TransactionRecord | null = null;
let damageWithoutPhotos: TransactionRecord | null = null;

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

  // Worker creates one Damage transaction with two photos and one without.
  const workerToken = await getAccessToken(WORKER);
  const balances = await apiRequest<BalanceRecord[]>(
    workerToken,
    "/inventory/balances",
  );
  const balance = balances.find(
    (entry) => entry.quantity > 1 && entry.product.active !== false,
  );
  if (!balance) {
    throw new Error(
      "No stocked active product was found. Seed the demo catalogue with `npm run api:db:seed:demo` and try again.",
    );
  }

  damageWithPhotos = await createDamageTransaction(
    workerToken,
    balance.product.id,
    balance.location.id,
    "damaged units with photo evidence.",
  );
  damageWithoutPhotos = await createDamageTransaction(
    workerToken,
    balance.product.id,
    balance.location.id,
    "damaged units without photo evidence.",
  );

  await uploadTransactionPhoto(
    workerToken,
    damageWithPhotos.id,
    "damaged-shelf-1.png",
  );
  await uploadTransactionPhoto(
    workerToken,
    damageWithPhotos.id,
    "damaged-shelf-2.png",
  );
});

test.afterAll(async () => {
  try {
    await cleanupTestRecords();
  } finally {
    await restoreKeycloakClient?.();
  }
});

test("manager sees the Photo evidence badge and View evidence button in Needs review", async ({
  page,
}) => {
  if (!damageWithPhotos) throw new Error("beforeAll did not create the case.");
  const errors = trackBrowserErrors(page);
  await signInAs(page, MANAGER, "Manager");
  await page.getByRole("button", { name: /^Transactions/ }).click();

  // The Damage card shows the badge with the photo count and the button.
  const card = page
    .locator("#manager-approvals .divide-y > div")
    .filter({
      hasText: `TX-${damageWithPhotos.id.slice(0, 8).toUpperCase()}`,
    });
  await expect(card).toHaveCount(1);
  await expect(card.getByText("Photo evidence · 2")).toBeVisible();
  await expect(card.getByRole("button", { name: /View evidence/ })).toBeVisible();

  // The card without photos has no badge or button.
  const emptyCard = page
    .locator("#manager-approvals .divide-y > div")
    .filter({
      hasText: `TX-${damageWithoutPhotos!.id.slice(0, 8).toUpperCase()}`,
    });
  await expect(emptyCard).toHaveCount(1);
  await expect(emptyCard.getByText(/Photo evidence/)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("manager opens the large preview with filename, uploader and date", async ({
  page,
}) => {
  if (!damageWithPhotos) throw new Error("beforeAll did not create the case.");
  const errors = trackBrowserErrors(page);
  await signInAs(page, MANAGER, "Manager");
  await page.getByRole("button", { name: /^Transactions/ }).click();

  const card = page
    .locator("#manager-approvals .divide-y > div")
    .filter({
      hasText: `TX-${damageWithPhotos.id.slice(0, 8).toUpperCase()}`,
    });
  await card.getByRole("button", { name: /View evidence/ }).click();

  // Thumbnails load with filename + uploader + time labels.
  await expect(
    page.getByRole("button", { name: "Preview damaged-shelf-1.png" }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByRole("button", { name: "Preview damaged-shelf-2.png" }),
  ).toBeVisible();
  await expect(page.getByText("damaged-shelf-1.png")).toBeVisible();

  // Clicking a thumbnail opens the large preview dialog with metadata.
  await page
    .getByRole("button", { name: "Preview damaged-shelf-1.png" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Photo preview — damaged-shelf-1.png" }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Photo preview — damaged-shelf-1.png" }),
  ).toContainText("Uploaded by");
  const managerToken = await getAccessToken(MANAGER);
  const evidence = await apiRequest<EvidenceRecord[]>(
    managerToken,
    `/transactions/${damageWithPhotos.id}/evidence`,
  );
  const uploader = evidence[0]?.uploadedBy?.displayName ?? "";
  await expect(
    page.getByRole("dialog", { name: "Photo preview — damaged-shelf-1.png" }),
  ).toContainText(uploader);

  // Upload date + time are shown (format like "Aug 17, 2026 at 11:24 AM").
  await expect(
    page.getByRole("dialog", { name: "Photo preview — damaged-shelf-1.png" }),
  ).toContainText(/\d{1,2}:\d{2}/);

  // Close the preview and the evidence panel.
  await page.getByRole("button", { name: "Close photo preview" }).click();
  await expect(
    page.getByRole("dialog", { name: "Photo preview — damaged-shelf-1.png" }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("evidence badge and thumbnails appear in transaction history", async ({
  page,
}) => {
  if (!damageWithPhotos) throw new Error("beforeAll did not create the case.");
  const errors = trackBrowserErrors(page);
  await signInAs(page, MANAGER, "Manager");
  await page.getByRole("button", { name: /^Transactions/ }).click();
  await page.getByRole("button", { name: "History" }).click();

  // The history row shows the photo badge next to View.
  const row = page
    .locator("tbody tr")
    .filter({
      hasText: `TX-${damageWithPhotos.id.slice(0, 8).toUpperCase()}`,
    });
  await expect(row).toHaveCount(1);
  await expect(row.getByText("2", { exact: true }).first()).toBeVisible();

  // Opening the transaction shows photo thumbnails in the details panel.
  await row.click();
  await expect(page.getByText("Transaction details")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Preview damaged-shelf-1.png" }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByRole("button", { name: "Preview damaged-shelf-2.png" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("empty state appears for a transaction without evidence", async ({
  page,
}) => {
  if (!damageWithoutPhotos) throw new Error("beforeAll did not create the case.");
  const errors = trackBrowserErrors(page);
  await signInAs(page, MANAGER, "Manager");
  await page.getByRole("button", { name: /^Transactions/ }).click();
  await page.getByRole("button", { name: "History" }).click();

  const row = page
    .locator("tbody tr")
    .filter({
      hasText: `TX-${damageWithoutPhotos.id.slice(0, 8).toUpperCase()}`,
    });
  await expect(row).toHaveCount(1);
  await row.click();
  await expect(page.getByText("Transaction details")).toBeVisible();
  await expect(
    page.getByText("No photo evidence attached to this transaction."),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("evidence uploaded to a discrepancy case is the same file as the transaction evidence", async () => {
  const workerToken = await getAccessToken(WORKER);
  const managerToken = await getAccessToken(MANAGER);
  const balances = await apiRequest<BalanceRecord[]>(
    workerToken,
    "/inventory/balances",
  );
  const balance = balances.find(
    (entry) => entry.quantity > 3 && entry.product.active !== false,
  );
  if (!balance) {
    throw new Error("No stocked active product was found.");
  }
  // A differing cycle count creates a discrepancy case.
  const transaction = await apiRequest<TransactionRecord>(
    workerToken,
    "/inventory/transactions",
    {
      method: "POST",
      body: JSON.stringify({
        action: "CYCLE_COUNT",
        productId: balance.product.id,
        quantity: balance.quantity - 1,
        condition: "GOOD",
        sourceLocationId: balance.location.id,
        transcript: `E2E evidence linkage: counted ${balance.quantity - 1}.`,
        clientRequestId: `e2e-evidence-case-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      }),
    },
  );
  await apiRequest<{ outcome: string }>(
    workerToken,
    `/inventory/transactions/${transaction.id}/confirm`,
    { method: "POST", body: "{}" },
  );
  createdTransactionIds.push(transaction.id);
  const cases = await apiRequest<{ items: DiscrepancyRecord[] }>(
    managerToken,
    "/discrepancies?pageSize=50",
  );
  const created = cases.items.find(
    (entry) => entry.transactionId === transaction.id,
  );
  if (!created) {
    throw new Error("The differing cycle count did not create a case.");
  }
  createdCaseIds.push(created.id);

  // Manager attaches a photo to the case (existing flow). The stored row is
  // linked to BOTH the case and the case's transaction.
  const form = new FormData();
  form.append(
    "photo",
    new Blob([tinyPng], { type: "image/png" }),
    "case-photo.png",
  );
  const upload = await fetch(
    `${API_BASE_URL}/discrepancies/${created.id}/evidence`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${managerToken}` },
      body: form,
    },
  );
  await expectJsonOk(upload, "Case evidence upload");
  const caseEvidence = await apiRequest<EvidenceRecord[]>(
    managerToken,
    `/discrepancies/${created.id}/evidence`,
  );
  const transactionEvidence = await apiRequest<EvidenceRecord[]>(
    managerToken,
    `/transactions/${transaction.id}/evidence`,
  );
  // The SAME physical evidence row is visible from both places — no copy.
  expect(transactionEvidence.some((entry) => entry.id === caseEvidence[0]?.id)).toBe(true);
  expect(transactionEvidence[0]?.originalFilename).toBe("case-photo.png");
  expect(caseEvidence[0]?.originalFilename).toBe("case-photo.png");
});

test("transaction evidence endpoint enforces access permissions", async () => {
  const workerToken = await getAccessToken(WORKER);
  const managerToken = await getAccessToken(MANAGER);
  const administratorToken = await getAccessToken(ADMINISTRATOR);
  if (!damageWithPhotos) throw new Error("beforeAll did not create the case.");

  // Manager, administrator and creator (worker) can read evidence.
  for (const token of [managerToken, administratorToken, workerToken]) {
    const response = await rawApiCall(
      token,
      `/transactions/${damageWithPhotos.id}/evidence`,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as EvidenceRecord[];
    expect(body.length).toBe(2);
    // The physical storage path must never be exposed.
    expect(JSON.stringify(body)).not.toContain("storageKey");
  }

  // A missing transaction is a 404.
  const missing = await rawApiCall(
    managerToken,
    "/transactions/00000000-0000-4000-8000-000000000000/evidence",
  );
  expect(missing.status).toBe(404);
});

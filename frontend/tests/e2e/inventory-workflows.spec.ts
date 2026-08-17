import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";

const KEYCLOAK_BASE_URL = "http://localhost:8080";
const API_BASE_URL = "http://localhost:4000/api";
const REALM = "nirka-inventory";
const WEB_CLIENT_ID = "nirka-inventory-web";
const KEYCLOAK_ADMIN = { username: "nirka-admin", password: "nirka-admin-dev" };
const WORKER = { username: "worker1", password: "Worker@123" };
const MANAGER = { username: "manager1", password: "Manager@123" };
const ADMINISTRATOR = { username: "admin1", password: "Admin@123" };

interface ProductRecord {
  id: string;
  sku: string;
  name: string;
  unit: string;
  active: boolean;
  safetyStock: number;
}

interface LocationRecord {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

interface BalanceRecord {
  id: string;
  quantity: number;
  reservedQuantity: number;
  product: ProductRecord;
  location: LocationRecord;
}

interface TransactionRecord {
  id: string;
  action: string;
  status: string;
  quantity: number;
  product: ProductRecord;
  sourceLocation?: LocationRecord | null;
  destinationLocation?: LocationRecord | null;
  reviewReasons?: string | null;
  systemQuantityBefore?: number | null;
  systemQuantityAfter?: number | null;
  createdBy?: { displayName?: string } | null;
}

interface DiscrepancyRecord {
  id: string;
  status: string;
  transactionId?: string | null;
  expectedQuantity: number;
  countedQuantity: number;
}

interface ConfirmationRecord {
  outcome: "POSTED" | "PENDING_REVIEW";
  transaction: TransactionRecord;
}

interface ReorderDraftRecord {
  id: string;
  status: string;
  currentStock: number;
  safetyStock: number;
  suggestedQuantity: number;
  product: ProductRecord;
  location: LocationRecord;
}

interface TaskRecord {
  id: string;
  type: string;
  status: string;
  title: string;
  product?: ProductRecord | null;
}

const runId = Date.now().toString(36).toUpperCase();
const createdTransactionIds: string[] = [];
let restoreKeycloakClient: (() => Promise<void>) | null = null;
let workerToken = "";
let managerToken = "";
let administratorToken = "";
let product: ProductRecord | null = null;
let source: LocationRecord | null = null;
let destination: LocationRecord | null = null;
let inactiveDestination: LocationRecord | null = null;
let differingCycleCount: TransactionRecord | null = null;
let recountTaskId: string | null = null;

async function expectJsonOk(response: Response, what: string) {
  if (!response.ok) {
    throw new Error(
      `${what} failed with HTTP ${response.status}: ${await response.text()}`,
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

/**
 * Temporary-record cleanup against the local PostgreSQL test database, run in
 * afterAll so a full run never leaves transactions, cases, tasks,
 * notifications, balance rows, reorder drafts or the fixture product behind.
 */
const TEST_DB = {
  host: "localhost",
  port: "5434",
  user: "nirka_inventory",
  database: "nirka_inventory",
  password: process.env.E2E_PG_PASSWORD ?? "nirka_inventory_dev",
};
const quoteSql = (value: string) => `'${value.replaceAll("'", "''")}'`;

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

async function cleanupWorkflowRecords() {
  if (!product) return;
  const productId = quoteSql(product.id);
  try {
    runSql(
      `DELETE FROM discrepancy_evidence WHERE "discrepancyId" IN (SELECT id FROM discrepancies WHERE "productId" = ${productId});`,
    );
    runSql(
      `DELETE FROM notifications WHERE "linkId" IN (SELECT id FROM discrepancies WHERE "productId" = ${productId}) OR "linkId" IN (SELECT id FROM inventory_tasks WHERE "productId" = ${productId});`,
    );
    runSql(
      `DELETE FROM discrepancy_audit_events WHERE "discrepancyId" IN (SELECT id FROM discrepancies WHERE "productId" = ${productId});`,
    );
    runSql(`DELETE FROM discrepancies WHERE "productId" = ${productId};`);
    runSql(
      `UPDATE inventory_tasks SET "sourceTransactionId" = NULL WHERE "productId" = ${productId};`,
    );
    runSql(`DELETE FROM inventory_transactions WHERE "productId" = ${productId};`);
    runSql(`DELETE FROM inventory_tasks WHERE "productId" = ${productId};`);
    runSql(`DELETE FROM inventory_balances WHERE "productId" = ${productId};`);
    runSql(`DELETE FROM reorder_drafts WHERE "productId" = ${productId};`);
    runSql(`DELETE FROM products WHERE id = ${productId};`);
  } catch (error) {
    // Best-effort cleanup: the balance and product restore already ran.
    console.warn("inventory-workflows cleanup failed:", (error as Error).message);
  }
}

async function getKeycloakAdminToken() {
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
  await expectJsonOk(response, "Keycloak administrator token request");
  return ((await response.json()) as { access_token: string }).access_token;
}

async function getAccessToken(user: { username: string; password: string }) {
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
  return ((await response.json()) as { access_token: string }).access_token;
}

async function readWebClient(adminToken: string) {
  const response = await fetch(
    `${KEYCLOAK_BASE_URL}/admin/realms/${REALM}/clients?clientId=${WEB_CLIENT_ID}`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  await expectJsonOk(response, "Keycloak web client lookup");
  const client = ((await response.json()) as Array<Record<string, unknown>>)[0];
  if (!client) throw new Error("Keycloak web client was not found.");
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
  await expectJsonOk(response, "Keycloak web client update");
}

async function balancesForProduct() {
  if (!product) throw new Error("Test product is not ready.");
  const balances = await apiRequest<BalanceRecord[]>(
    managerToken,
    "/inventory/balances",
  );
  return balances.filter((balance) => balance.product.id === product!.id);
}

async function quantityAt(locationId: string) {
  const balance = (await balancesForProduct()).find(
    (entry) => entry.location.id === locationId,
  );
  return balance?.quantity ?? 0;
}

async function createAndConfirm(input: {
  action: string;
  quantity: number;
  sourceLocationId?: string;
  destinationLocationId?: string;
}) {
  if (!product) throw new Error("Test product is not ready.");
  const transaction = await apiRequest<TransactionRecord>(
    workerToken,
    "/inventory/transactions",
    {
      method: "POST",
      body: JSON.stringify({
        ...input,
        productId: product.id,
        condition: "GOOD",
        transcript: `Automated E2E ${input.action} workflow ${runId}.`,
        clientRequestId: `e2e-workflow-${runId}-${input.action}-${createdTransactionIds.length}`,
      }),
    },
  );
  createdTransactionIds.push(transaction.id);
  return apiRequest<ConfirmationRecord>(
    workerToken,
    `/inventory/transactions/${transaction.id}/confirm`,
    { method: "POST", body: "{}" },
  );
}

test.describe.serial("complete inventory workflows", () => {
  test.beforeAll(async () => {
    const keycloakAdminToken = await getKeycloakAdminToken();
    const originalClient = await readWebClient(keycloakAdminToken);
    const snapshot = JSON.parse(JSON.stringify(originalClient)) as Record<
      string,
      unknown
    >;
    restoreKeycloakClient = async () => {
      await writeWebClient(await getKeycloakAdminToken(), snapshot);
    };
    await writeWebClient(keycloakAdminToken, {
      ...originalClient,
      directAccessGrantsEnabled: true,
    });

    workerToken = await getAccessToken(WORKER);
    managerToken = await getAccessToken(MANAGER);
    administratorToken = await getAccessToken(ADMINISTRATOR);

    const locations = await apiRequest<LocationRecord[]>(
      managerToken,
      "/inventory/locations",
    );
    [source, destination] = locations.filter((location) => location.active).slice(0, 2);
    if (!source || !destination) {
      throw new Error("At least two active warehouse locations are required.");
    }

    inactiveDestination = await apiRequest<LocationRecord>(
      managerToken,
      "/inventory/locations",
      {
        method: "POST",
        body: JSON.stringify({
          code: `INACTIVE-${runId}`,
          name: `Inactive ${runId}`,
          description: "Temporary inactive Receive destination test.",
        }),
      },
    );
    inactiveDestination = await apiRequest<LocationRecord>(
      managerToken,
      `/inventory/locations/${inactiveDestination.id}`,
      { method: "PATCH", body: JSON.stringify({ active: false }) },
    );

    product = await apiRequest<ProductRecord>(
      managerToken,
      "/inventory/products",
      {
        method: "POST",
        body: JSON.stringify({
          sku: `E2E-${runId}`,
          name: `Workflow Test ${runId}`,
          unit: "unit",
          safetyStock: 90,
          reorderQuantity: 50,
          controlled: false,
        }),
      },
    );

    // Opening 85 at source + 50 received - 50 shipped - 20 transferred - 3
    // damage - 2 loss leaves a final product-level available total of 80,
    // genuinely below the 90 safety stock. The product-level reorder rule
    // then creates exactly one Purchase Item for this SKU (see the
    // "Low stock creates Purchase Items" test below).
    for (const [location, quantity] of [
      [source, 85],
      [destination, 0],
    ] as Array<[LocationRecord, number]>) {
      await apiRequest(administratorToken, "/inventory/opening-balances", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          locationId: location.id,
          quantity,
          reservedQuantity: 0,
          effectiveDate: new Date().toISOString(),
          reason: `Automated E2E opening stock ${runId}.`,
        }),
      });
    }
  });

  test.afterAll(async () => {
    try {
      if (product && administratorToken) {
        for (const balance of await balancesForProduct()) {
          if (balance.quantity !== 0 || balance.reservedQuantity !== 0) {
            await apiRequest(
              administratorToken,
              "/inventory/balance-adjustments",
              {
                method: "POST",
                body: JSON.stringify({
                  balanceId: balance.id,
                  quantity: 0,
                  reservedQuantity: 0,
                  reason: `Restore automated E2E fixture ${runId}.`,
                }),
              },
            );
          }
        }
        await apiRequest(
          managerToken,
          `/inventory/products/${product.id}`,
          { method: "DELETE" },
        );
      }
      if (inactiveDestination && managerToken) {
        await apiRequest(
          managerToken,
          `/inventory/locations/${inactiveDestination.id}`,
          { method: "DELETE" },
        );
      }
      await cleanupWorkflowRecords();
    } finally {
      await restoreKeycloakClient?.();
    }
  });

  test("Receive increases destination stock and posts", async () => {
    const before = await quantityAt(source!.id);
    const result = await createAndConfirm({
      action: "RECEIVE",
      quantity: 50,
      destinationLocationId: source!.id,
    });
    expect(result.outcome).toBe("POSTED");
    expect(await quantityAt(source!.id)).toBe(before + 50);
    expect(result.transaction.systemQuantityBefore).toBe(before);
    expect(result.transaction.systemQuantityAfter).toBe(before + 50);
    expect(result.transaction.destinationLocation?.id).toBe(source!.id);
  });

  test("Receive rejects missing, unknown and inactive destination locations", async () => {
    if (!product || !inactiveDestination) {
      throw new Error("Receive destination validation fixture is not ready.");
    }
    for (const [label, destinationLocationId] of [
      ["missing", undefined],
      ["unknown", "00000000-0000-4000-8000-000000000999"],
      ["inactive", inactiveDestination.id],
    ] as const) {
      const response = await fetch(`${API_BASE_URL}/inventory/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${workerToken}`,
        },
        body: JSON.stringify({
          action: "RECEIVE",
          productId: product.id,
          quantity: 5,
          condition: "GOOD",
          destinationLocationId,
          transcript: `Automated ${label} Receive destination test ${runId}.`,
        }),
      });
      expect(response.ok, `${label} destination must be rejected`).toBe(false);
      expect(response.status).toBe(label === "missing" ? 400 : 404);
    }
  });

  test("Ship decreases source stock and posts", async () => {
    const before = await quantityAt(source!.id);
    const result = await createAndConfirm({
      action: "SHIP",
      quantity: 50,
      sourceLocationId: source!.id,
    });
    expect(result.outcome).toBe("POSTED");
    expect(await quantityAt(source!.id)).toBe(before - 50);
    expect(result.transaction.systemQuantityBefore).toBe(before);
    expect(result.transaction.systemQuantityAfter).toBe(before - 50);
    expect(result.transaction.sourceLocation?.id).toBe(source!.id);
  });

  test("Insufficient Ship is rejected and stock is unchanged", async () => {
    const before = await quantityAt(source!.id);
    // Create the Ship directly (do not register it as a completed workflow
    // row) so the rejected fixture cannot pollute the audit-history suite.
    const transaction = await apiRequest<TransactionRecord>(
      workerToken,
      "/inventory/transactions",
      {
        method: "POST",
        body: JSON.stringify({
          action: "SHIP",
          productId: product!.id,
          quantity: before + 1_000_000,
          sourceLocationId: source!.id,
          condition: "GOOD",
          transcript: `Automated insufficient Ship rejection ${runId}.`,
          clientRequestId: `e2e-insufficient-${runId}`,
        }),
      },
    );
    await expect(
      apiRequest<ConfirmationRecord>(
        workerToken,
        `/inventory/transactions/${transaction.id}/confirm`,
        { method: "POST", body: "{}" },
      ),
    ).rejects.toThrow(/Insufficient available stock/);
    expect(await quantityAt(source!.id)).toBe(before);
  });

  test("Transfer preserves total inventory and bypasses approval", async () => {
    const sourceBefore = await quantityAt(source!.id);
    const destinationBefore = await quantityAt(destination!.id);
    const result = await createAndConfirm({
      action: "TRANSFER",
      quantity: 20,
      sourceLocationId: source!.id,
      destinationLocationId: destination!.id,
    });
    expect(result.outcome).toBe("POSTED");
    const sourceAfter = await quantityAt(source!.id);
    const destinationAfter = await quantityAt(destination!.id);
    expect(sourceAfter).toBe(sourceBefore - 20);
    expect(destinationAfter).toBe(destinationBefore + 20);
    expect(sourceAfter + destinationAfter).toBe(
      sourceBefore + destinationBefore,
    );
    expect(result.transaction.systemQuantityBefore).toBe(sourceBefore);
    expect(result.transaction.systemQuantityAfter).toBe(sourceAfter);
    expect(result.transaction.sourceLocation?.id).toBe(source!.id);
    expect(result.transaction.destinationLocation?.id).toBe(destination!.id);
  });

  test("Same-location Transfer is rejected", async () => {
    const before = await quantityAt(source!.id);
    await expect(
      createAndConfirm({
        action: "TRANSFER",
        quantity: 5,
        sourceLocationId: source!.id,
        destinationLocationId: source!.id,
      }),
    ).rejects.toThrow(/Source and destination locations must be different/);
    expect(await quantityAt(source!.id)).toBe(before);
  });

  test("Matching cycle count posts automatically", async () => {
    const current = await quantityAt(source!.id);
    const result = await createAndConfirm({
      action: "CYCLE_COUNT",
      quantity: current,
      sourceLocationId: source!.id,
    });
    expect(result.outcome).toBe("POSTED");
    expect(await quantityAt(source!.id)).toBe(current);
    expect(result.transaction.systemQuantityBefore).toBe(current);
    expect(result.transaction.systemQuantityAfter).toBe(current);
  });

  test("Different cycle count creates discrepancy and recount task", async () => {
    const current = await quantityAt(source!.id);
    const result = await createAndConfirm({
      action: "CYCLE_COUNT",
      quantity: current - 2,
      sourceLocationId: source!.id,
    });
    expect(result.outcome).toBe("PENDING_REVIEW");
    differingCycleCount = result.transaction;
    expect(await quantityAt(source!.id)).toBe(current);

    const recount = await apiRequest<{ outcome: string }>(
      managerToken,
      `/inventory/transactions/${result.transaction.id}/request-recount`,
      {
        method: "POST",
        body: JSON.stringify({ note: "Automated E2E recount request." }),
      },
    );
    expect(recount.outcome).toBe("RECOUNT_REQUESTED");
    const tasks = await apiRequest<TaskRecord[]>(workerToken, "/tasks");
    const recountTask = tasks.find(
      (task) => task.type === "RECOUNT" && task.product?.id === product!.id,
    );
    expect(recountTask).toBeTruthy();
    recountTaskId = recountTask?.id ?? null;
  });

  test("Matching recount closes the discrepancy automatically", async () => {
    if (!differingCycleCount || !recountTaskId) {
      throw new Error("Recount fixture is not ready.");
    }
    const current = await quantityAt(source!.id);
    const transaction = await apiRequest<TransactionRecord>(
      workerToken,
      "/inventory/transactions",
      {
        method: "POST",
        body: JSON.stringify({
          action: "CYCLE_COUNT",
          productId: product!.id,
          quantity: current,
          condition: "GOOD",
          sourceLocationId: source!.id,
          recountTaskId,
          transcript: `Automated matching recount ${runId}.`,
          clientRequestId: `e2e-recount-${runId}`,
        }),
      },
    );
    createdTransactionIds.push(transaction.id);
    const result = await apiRequest<ConfirmationRecord>(
      workerToken,
      `/inventory/transactions/${transaction.id}/confirm`,
      { method: "POST", body: "{}" },
    );
    expect(result.outcome).toBe("POSTED");
    expect(await quantityAt(source!.id)).toBe(current);
    expect(result.transaction.systemQuantityBefore).toBe(current);
    expect(result.transaction.systemQuantityAfter).toBe(current);

    const cases = await apiRequest<{ items: DiscrepancyRecord[] }>(
      managerToken,
      "/discrepancies?pageSize=50",
    );
    const caseRecord = cases.items.find(
      (entry) => entry.transactionId === differingCycleCount!.id,
    );
    expect(caseRecord, "the original case must still exist").toBeTruthy();
    expect(caseRecord?.status).toBe("CLOSED");
  });

  test("Damage requires manager approval before stock changes", async () => {
    const before = await quantityAt(source!.id);
    const result = await createAndConfirm({
      action: "DAMAGE",
      quantity: 3,
      sourceLocationId: source!.id,
    });
    expect(result.outcome).toBe("PENDING_REVIEW");
    expect(await quantityAt(source!.id)).toBe(before);
    const approved = await apiRequest<{ outcome: string }>(
      managerToken,
      `/inventory/transactions/${result.transaction.id}/approve`,
      {
        method: "POST",
        body: JSON.stringify({ note: "Automated DAMAGE approval." }),
      },
    );
    expect(approved.outcome).toBe("POSTED");
    expect(await quantityAt(source!.id)).toBe(before - 3);
  });

  test("removed Use stock and Loss actions are rejected", async () => {
    for (const action of ["USE", "LOSS"]) {
      await expect(
        apiRequest(workerToken, "/inventory/transactions", {
          method: "POST",
          body: JSON.stringify({
            action,
            productId: product!.id,
            quantity: 1,
            sourceLocationId: source!.id,
            condition: "GOOD",
            clientRequestId: `e2e-removed-${runId}-${action}`,
          }),
        }),
      ).rejects.toThrow(/have been removed/i);
    }
  });

  test("Low stock creates exactly one product-level Purchase Item", async () => {
    const drafts = await apiRequest<ReorderDraftRecord[]>(
      managerToken,
      "/inventory/reorder-drafts",
    );
    const fixtureDrafts = drafts.filter(
      (draft) =>
        draft.product.id === product!.id && draft.status === "DRAFT",
    );
    // Purchase Items is a product-level list: one DRAFT per product/SKU even
    // when the product holds stock at several locations (source and
    // destination after the transfer), never a row per location.
    expect(fixtureDrafts.length, "one Purchase Item per product").toBe(1);
    const draft = fixtureDrafts[0];
    expect(draft.product.sku).toBe(product!.sku);
    // currentStock reflects the system-wide available quantity, below safety.
    expect(draft.currentStock).toBeLessThan(draft.safetyStock);
    expect(draft.suggestedQuantity).toBeGreaterThan(0);
  });

  test("Purchase Item disappears when total product availability recovers", async () => {
    // Bring the system-wide total back above safety stock (80 + 40 = 120)
    // with a receive at the source. The next reorder evaluation cancels the
    // product-level Purchase Item.
    const result = await createAndConfirm({
      action: "RECEIVE",
      quantity: 40,
      destinationLocationId: source!.id,
    });
    expect(result.outcome).toBe("POSTED");
    await apiRequest(
      managerToken,
      "/inventory/reorder-drafts/refresh",
      { method: "POST", body: "{}" },
    );
    const drafts = await apiRequest<ReorderDraftRecord[]>(
      managerToken,
      "/inventory/reorder-drafts",
    );
    expect(
      drafts.some(
        (draft) =>
          draft.product.id === product!.id && draft.status === "DRAFT",
      ),
      "no Purchase Item once stock recovers above safety",
    ).toBe(false);
  });

  test("Low stock Purchase Items and all actions appear in audit history", async () => {
    const drafts = await apiRequest<ReorderDraftRecord[]>(
      managerToken,
      "/inventory/reorder-drafts",
    );
    expect(
      drafts.some(
        (draft) =>
          draft.product.id === product!.id && draft.status === "DRAFT",
      ),
    ).toBe(false);

    const transactions = await apiRequest<TransactionRecord[]>(
      managerToken,
      "/inventory/transactions",
    );
    const fixtureTransactions = transactions.filter((transaction) =>
      createdTransactionIds.includes(transaction.id),
    );
    const fixtureActions = new Set(
      fixtureTransactions.map((transaction) => transaction.action),
    );
    for (const action of [
      "RECEIVE",
      "SHIP",
      "TRANSFER",
      "CYCLE_COUNT",
      "DAMAGE",
    ]) {
      expect(fixtureActions.has(action), `${action} audit record`).toBe(true);
    }
    expect(differingCycleCount?.status).toBeDefined();

    // Every posted movement must carry the before/after balance snapshot in
    // its audit record (worker, status, source/destination, balances, times).
    const movementRows = fixtureTransactions.filter((transaction) =>
      ["RECEIVE", "SHIP", "TRANSFER"].includes(transaction.action),
    );
    expect(movementRows.length).toBeGreaterThan(0);
    for (const row of movementRows) {
      expect(row.status).toBe("POSTED");
      expect(typeof row.systemQuantityBefore).toBe("number");
      expect(typeof row.systemQuantityAfter).toBe("number");
      expect(row.createdBy?.displayName).toBeTruthy();
      if (row.action === "RECEIVE") {
        expect(row.destinationLocation?.id).toBeTruthy();
      } else {
        expect(row.sourceLocation?.id).toBeTruthy();
      }
    }
  });

  test("Valid Receive, Ship and Transfer never enter the approval queue", async () => {
    const transactions = await apiRequest<TransactionRecord[]>(
      managerToken,
      "/inventory/transactions",
    );
    const movementRows = transactions.filter(
      (transaction) =>
        createdTransactionIds.includes(transaction.id) &&
        ["RECEIVE", "SHIP", "TRANSFER"].includes(transaction.action),
    );
    expect(movementRows.length).toBeGreaterThan(0);
    for (const row of movementRows) {
      expect(row.status, `${row.action} must post without review`).toBe(
        "POSTED",
      );
    }
    // Nothing from this suite sits in the manager approval queue.
    expect(
      transactions.some(
        (transaction) =>
          createdTransactionIds.includes(transaction.id) &&
          ["RECEIVE", "SHIP", "TRANSFER"].includes(transaction.action) &&
          transaction.status === "PENDING_REVIEW",
      ),
    ).toBe(false);
  });

  test("Role permissions block worker-only forbidden manager operations", async () => {
    const transactions = await apiRequest<TransactionRecord[]>(
      workerToken,
      "/inventory/transactions",
    );
    const pending = transactions.find(
      (transaction) => transaction.id === differingCycleCount?.id,
    );
    expect(pending).toBeDefined();

    const workerApprove = await fetch(
      `${API_BASE_URL}/inventory/transactions/${pending!.id}/approve`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${workerToken}`,
        },
        body: JSON.stringify({ note: "Worker must not approve." }),
      },
    );
    expect(workerApprove.status).toBe(403);

    const workerPurchaseItems = await fetch(
      `${API_BASE_URL}/inventory/reorder-drafts`,
      { headers: { Authorization: `Bearer ${workerToken}` } },
    );
    expect(workerPurchaseItems.status).toBe(403);
  });
});

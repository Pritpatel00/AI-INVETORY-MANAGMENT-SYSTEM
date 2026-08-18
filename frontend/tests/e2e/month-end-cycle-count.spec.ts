import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";

/**
 * Month-End Cycle Count planning workflow (API + browser).
 *
 * Cycle counts are a controlled month-end activity: a manager selects a count
 * period and one or more locations, and the system generates one count task
 * per stocked item (on-hand > 0) at each selected location. Repeating the
 * exact same request returns the existing plan (idempotent), the database
 * prevents duplicate period/product/location counts, the assigned Warehouse
 * Executive is notified, the worker speaks only the counted quantity, exact
 * counts post automatically while differing counts create a discrepancy, and
 * the manager monitors every plan and its tasks.
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

interface ProductRecord {
  id: string;
  sku: string;
  name: string;
  unit: string;
  active: boolean;
}
interface LocationRecord {
  id: string;
  code: string;
  name: string;
  active: boolean;
}
interface AssigneeRecord {
  id: string;
  employeeId: string;
  displayName: string;
}
interface TaskRecord {
  id: string;
  type: string;
  status: string;
  title: string;
  description?: string | null;
  periodMonth?: string | null;
  product?: ProductRecord | null;
  location?: LocationRecord | null;
  cycleCountPlan?: { id: string; planNumber: string; periodMonth: string; blindCount: boolean } | null;
}
interface PlanRecord {
  id: string;
  planNumber: string;
  title: string;
  periodMonth: string;
  blindCount: boolean;
  instructions?: string | null;
  assignedToId: string;
  totalTasks?: number;
  openTasks?: number;
  completedTasks?: number;
  discrepancyCount?: number;
  status?: string;
  locations?: Array<{ id: string; code: string; name: string }>;
  assignedTo?: { id: string; employeeId: string; displayName: string };
  tasks?: Array<{
    id: string;
    status: string;
    title: string;
    product?: ProductRecord | null;
    location?: LocationRecord | null;
    discrepancies?: Array<{ id: string; caseNumber: string; status: string }>;
  }>;
}
interface NotificationRecord {
  id: string;
  type: string;
  title: string;
  message: string;
}
interface DiscrepancyRecord {
  id: string;
  status: string;
  transactionId?: string | null;
}

const runId = Date.now().toString(36).toUpperCase();
const planIds: string[] = [];
let restoreKeycloakClient: (() => Promise<void>) | null = null;
let workerToken = "";
let managerToken = "";
let administratorToken = "";
let workerUserId = "";
let locationA: LocationRecord | null = null;
let locationB: LocationRecord | null = null;
let stockedProduct: ProductRecord | null = null;
let zeroStockProduct: ProductRecord | null = null;
let oneLocationPlan: PlanRecord | null = null;
let multiLocationPlan: PlanRecord | null = null;

/** A future month-end 5:00 PM due date that stays valid whenever the suite runs. */
function futureMonthEnd(offsetMonths = 1) {
  const now = new Date();
  const targetMonth = now.getMonth() + offsetMonths;
  const year = now.getFullYear() + Math.floor(targetMonth / 12);
  const month = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const periodMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
  return {
    periodMonth,
    dueAt: `${periodMonth}-${String(lastDay).padStart(2, "0")}T17:00:00.000Z`,
  };
}
// Distinct periods keep every plan independent: the one-location plan and the
// multi-location plan must not share a period, because the same period/product/
// location duplicate rule correctly stops the second plan from re-counting.
const periodOne = futureMonthEnd(1);
const periodTwo = futureMonthEnd(2);

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
  const productIds = [stockedProduct, zeroStockProduct]
    .filter(Boolean)
    .map((product) => quoteSql(product!.id));
  if (productIds.length === 0) return;
  const productList = productIds.join(", ");
  const planList = planIds.map(quoteSql).join(", ") || "NULL";
  try {
    runSql(
      `DELETE FROM discrepancy_evidence WHERE "discrepancyId" IN (SELECT id FROM discrepancies WHERE "productId" IN (${productList}));`,
    );
    runSql(
      `DELETE FROM notifications WHERE "linkId" IN (SELECT id FROM discrepancies WHERE "productId" IN (${productList})) OR "linkId" IN (SELECT id FROM inventory_tasks WHERE "productId" IN (${productList}));`,
    );
    runSql(
      `DELETE FROM discrepancy_audit_events WHERE "discrepancyId" IN (SELECT id FROM discrepancies WHERE "productId" IN (${productList}));`,
    );
    runSql(`DELETE FROM discrepancies WHERE "productId" IN (${productList});`);
    runSql(
      `UPDATE inventory_tasks SET "sourceTransactionId" = NULL WHERE "productId" IN (${productList});`,
    );
    runSql(`DELETE FROM inventory_transactions WHERE "productId" IN (${productList});`);
    runSql(
      `DELETE FROM inventory_tasks WHERE "productId" IN (${productList}) OR "cycleCountPlanId" IN (${planList});`,
    );
    runSql(`DELETE FROM cycle_count_plans WHERE id IN (${planList});`);
    runSql(`DELETE FROM inventory_balances WHERE "productId" IN (${productList});`);
    runSql(`DELETE FROM reorder_drafts WHERE "productId" IN (${productList});`);
    runSql(`DELETE FROM products WHERE id IN (${productList});`);
    for (const location of [locationA, locationB].filter(Boolean) as LocationRecord[]) {
      runSql(`DELETE FROM locations WHERE id = ${quoteSql(location.id)};`);
    }
  } catch (error) {
    console.warn("month-end-cycle-count cleanup failed:", (error as Error).message);
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

async function createPlan(input: {
  periodMonth: string;
  locationIds: string[];
  assignedToId: string;
  priority?: string;
  dueAt?: string;
  blindCount?: boolean;
  instructions?: string;
}) {
  const plan = await apiRequest<
    PlanRecord & { idempotent?: boolean; createdTasks?: number; skippedDuplicates?: number; selectedLocations?: number }
  >(
    managerToken,
    "/tasks/cycle-count-plans",
    {
      method: "POST",
      body: JSON.stringify({
        periodMonth: input.periodMonth,
        locationIds: input.locationIds,
        assignedToId: input.assignedToId,
        priority: input.priority ?? "MEDIUM",
        dueAt: input.dueAt,
        blindCount: input.blindCount ?? true,
        instructions: input.instructions,
      }),
    },
  );
  planIds.push(plan.id);
  return plan;
}

test.describe.serial("month-end cycle count planning workflow", () => {
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

    // Dedicated test locations so the generated-task counts are isolated to
    // this suite's fixture products (the demo locations already hold stock
    // for many catalogue items).
    locationA = await apiRequest<LocationRecord>(
      managerToken,
      "/inventory/locations",
      {
        method: "POST",
        body: JSON.stringify({
          code: `CCPA-${runId}`,
          name: `Count Zone A ${runId}`,
          description: "Temporary month-end cycle count fixture.",
        }),
      },
    );
    locationB = await apiRequest<LocationRecord>(
      managerToken,
      "/inventory/locations",
      {
        method: "POST",
        body: JSON.stringify({
          code: `CCPB-${runId}`,
          name: `Count Zone B ${runId}`,
          description: "Temporary month-end cycle count fixture.",
        }),
      },
    );

    const assignees = await apiRequest<AssigneeRecord[]>(
      managerToken,
      "/tasks/assignees",
    );
    const worker1 = assignees.find(
      (assignee) => assignee.employeeId === WORKER.username.toUpperCase(),
    ) ?? assignees[0];
    if (!worker1) throw new Error("No active Warehouse Executive is available.");
    workerUserId = worker1.id;

    stockedProduct = await apiRequest<ProductRecord>(
      managerToken,
      "/inventory/products",
      {
        method: "POST",
        body: JSON.stringify({
          sku: `CCP-${runId}`,
          name: `Cycle Plan Item ${runId}`,
          unit: "unit",
          safetyStock: 5,
          reorderQuantity: 10,
          controlled: false,
        }),
      },
    );
    zeroStockProduct = await apiRequest<ProductRecord>(
      managerToken,
      "/inventory/products",
      {
        method: "POST",
        body: JSON.stringify({
          sku: `CCPZ-${runId}`,
          name: `Zero Stock Item ${runId}`,
          unit: "unit",
          safetyStock: 5,
          reorderQuantity: 10,
          controlled: false,
        }),
      },
    );

    for (const [product, location, quantity] of [
      [stockedProduct, locationA, 25],
      [stockedProduct, locationB, 12],
      [zeroStockProduct, locationB, 0],
    ] as Array<[ProductRecord, LocationRecord, number]>) {
      await apiRequest(administratorToken, "/inventory/opening-balances", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          locationId: location.id,
          quantity,
          reservedQuantity: 0,
          effectiveDate: new Date().toISOString(),
          reason: `Automated month-end cycle count fixture ${runId}.`,
        }),
      });
    }
  });

  test.afterAll(async () => {
    try {
      await cleanupWorkflowRecords();
    } finally {
      await restoreKeycloakClient?.();
    }
  });

  test("manager creates a one-location plan with one task per stocked item", async () => {
    if (!stockedProduct || !locationA) {
      throw new Error("Fixture is not ready.");
    }
    const plan = await createPlan({
      periodMonth: periodOne.periodMonth,
      locationIds: [locationA.id],
      assignedToId: workerUserId,
      dueAt: periodOne.dueAt,
      blindCount: true,
      instructions: "Use the red scanner for this plan.",
    });
    oneLocationPlan = plan;

    expect(plan.periodMonth).toBe(periodOne.periodMonth);
    expect(plan.blindCount).toBe(true);
    expect(plan.instructions).toBe("Use the red scanner for this plan.");
    expect(plan.assignedToId).toBe(workerUserId);
    expect(plan.idempotent).toBe(false);
    expect(plan.selectedLocations).toBe(1);
    // Only the stocked product lives at location A; the zero-stock product has
    // no balance there, so exactly one task is generated.
    expect(plan.createdTasks).toBe(1);
    const tasks = await apiRequest<TaskRecord[]>(workerToken, "/tasks");
    const planTasks = tasks.filter((task) => task.cycleCountPlan?.id === plan.id);
    expect(planTasks).toHaveLength(1);
    expect(planTasks[0].type).toBe("CYCLE_COUNT");
    expect(planTasks[0].product?.id).toBe(stockedProduct.id);
    expect(planTasks[0].location?.id).toBe(locationA.id);
    expect(planTasks[0].periodMonth).toBe(periodOne.periodMonth);
    expect(planTasks[0].status).toBe("OPEN");
    // Blind count: the task description tells the worker not to rely on the
    // system quantity.
    expect(planTasks[0].description).toMatch(/Blind count/i);
    expect(planTasks[0].description).toMatch(/Instructions: Use the red scanner/i);
  });

  test("manager creates a multi-location plan covering every stocked item-location", async () => {
    if (!stockedProduct || !zeroStockProduct || !locationA || !locationB) {
      throw new Error("Fixture is not ready.");
    }
    const fixtureProduct = stockedProduct;
    const emptyProduct = zeroStockProduct;
    const zoneA = locationA;
    const zoneB = locationB;
    const plan = await createPlan({
      periodMonth: periodTwo.periodMonth,
      locationIds: [locationA.id, locationB.id],
      assignedToId: workerUserId,
      dueAt: periodTwo.dueAt,
      blindCount: true,
    });
    multiLocationPlan = plan;

    expect(plan.selectedLocations).toBe(2);
    // Stocked item-locations: Item@A and Item@B. The zero-quantity record
    // Zero Stock Item@B must never generate a task.
    expect(plan.createdTasks).toBe(2);
    const tasks = await apiRequest<TaskRecord[]>(workerToken, "/tasks");
    const planTasks = tasks.filter((task) => task.cycleCountPlan?.id === plan.id);
    expect(planTasks).toHaveLength(2);
    const keys = planTasks.map((task) => `${task.product?.id}:${task.location?.id}`).sort();
    expect(keys).toEqual(
      [`${fixtureProduct.id}:${zoneA.id}`, `${fixtureProduct.id}:${zoneB.id}`].sort(),
    );
    expect(
      planTasks.some(
        (task) => task.product?.id === emptyProduct.id,
      ),
      "zero-stock item-location records must not produce tasks",
    ).toBe(false);
  });

  test("repeating the exact request returns the existing plan without duplicates", async () => {
    if (!multiLocationPlan || !locationA || !locationB) {
      throw new Error("Multi-location plan fixture is not ready.");
    }
    const repeat = await createPlan({
      periodMonth: periodTwo.periodMonth,
      locationIds: [locationA.id, locationB.id],
      assignedToId: workerUserId,
      dueAt: periodTwo.dueAt,
      blindCount: true,
    });

    // Idempotent: the exact same request returns the winner's plan and its
    // tasks, and never creates new rows.
    expect(repeat.idempotent).toBe(true);
    expect(repeat.id).toBe(multiLocationPlan.id);
    expect(repeat.createdTasks).toBe(2);

    const tasks = await apiRequest<TaskRecord[]>(workerToken, "/tasks");
    const planTasks = tasks.filter((task) => task.cycleCountPlan?.id === multiLocationPlan!.id);
    expect(planTasks).toHaveLength(2);
  });

  test("a different request for the same period cannot duplicate tasks", async () => {
    if (!locationA || !locationB) {
      throw new Error("Locations fixture is not ready.");
    }
    // A new request (different priority) for the same period and locations has
    // every item-location already counted, so it is rejected instead of
    // creating a second set of tasks for the same period.
    const response = await fetch(`${API_BASE_URL}/tasks/cycle-count-plans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${managerToken}`,
      },
      body: JSON.stringify({
        periodMonth: periodTwo.periodMonth,
        locationIds: [locationA.id, locationB.id],
        assignedToId: workerUserId,
        priority: "HIGH",
        dueAt: periodTwo.dueAt,
        blindCount: true,
      }),
    });
    expect(response.ok, "duplicate-period request must be rejected").toBe(false);
    expect(response.status).toBe(409);
  });

  test("rejects a due date outside the count period", async () => {
    if (!locationA) throw new Error("Locations fixture is not ready.");
    const outside = new Date(periodOne.dueAt);
    outside.setMonth(outside.getMonth() + 1);
    const response = await fetch(`${API_BASE_URL}/tasks/cycle-count-plans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${managerToken}`,
      },
      body: JSON.stringify({
        periodMonth: periodOne.periodMonth,
        locationIds: [locationA.id],
        assignedToId: workerUserId,
        priority: "MEDIUM",
        dueAt: outside.toISOString(),
        blindCount: true,
      }),
    });
    expect(response.ok, "due date outside the period must be rejected").toBe(false);
    expect(response.status).toBe(400);
  });

  test("rejects a selected location with no stocked items", async () => {
    if (!locationA) {
      throw new Error("Locations fixture is not ready.");
    }
    const emptyLocation = await apiRequest<LocationRecord>(
      managerToken,
      "/inventory/locations",
      {
        method: "POST",
        body: JSON.stringify({
          code: `EMPTY-${runId}`,
          name: `Empty Count Location ${runId}`,
          description: "Temporary empty location for month-end validation.",
        }),
      },
    );
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/cycle-count-plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${managerToken}`,
        },
        body: JSON.stringify({
          periodMonth: periodOne.periodMonth,
          locationIds: [locationA.id, emptyLocation.id],
          assignedToId: workerUserId,
          priority: "MEDIUM",
          dueAt: periodOne.dueAt,
          blindCount: true,
        }),
      });
      expect(response.ok, "empty location must be rejected").toBe(false);
      expect(response.status).toBe(400);
      const payload = (await response.json()) as { message: string };
      expect(payload.message).toMatch(/no items with stock/i);
    } finally {
      await apiRequest(
        managerToken,
        `/inventory/locations/${emptyLocation.id}`,
        { method: "DELETE" },
      );
    }
  });

  test("only managers and administrators can create plans", async () => {
    if (!locationA) throw new Error("Locations fixture is not ready.");
    const response = await fetch(`${API_BASE_URL}/tasks/cycle-count-plans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${workerToken}`,
      },
      body: JSON.stringify({
        periodMonth: periodOne.periodMonth,
        locationIds: [locationA.id],
        assignedToId: workerUserId,
        priority: "MEDIUM",
        dueAt: periodOne.dueAt,
        blindCount: true,
      }),
    });
    expect(response.status).toBe(403);
  });

  test("the assigned Warehouse Executive is notified about the plan", async () => {
    if (!oneLocationPlan) throw new Error("Plan fixture is not ready.");
    const notifications = await apiRequest<NotificationRecord[]>(
      workerToken,
      "/notifications",
    );
    const notice = notifications.find(
      (entry) =>
        entry.type === "CYCLE_COUNT_PLAN_ASSIGNED" &&
        entry.message.includes(oneLocationPlan!.planNumber),
    );
    expect(notice, "worker must receive a month-end count plan notification").toBeTruthy();
  });

  test("manager plan monitoring lists plans with task statistics", async () => {
    if (!oneLocationPlan) throw new Error("Plan fixture is not ready.");
    const plans = await apiRequest<PlanRecord[]>(
      managerToken,
      "/tasks/cycle-count-plans",
    );
    const plan = plans.find((entry) => entry.id === oneLocationPlan!.id);
    expect(plan).toBeTruthy();
    expect(plan?.totalTasks).toBe(1);
    expect(plan?.openTasks).toBe(1);
    expect(plan?.completedTasks).toBe(0);
    expect(plan?.status).toBe("OPEN");
    expect(plan?.locations).toHaveLength(1);
    expect(plan?.assignedTo?.employeeId).toBe(WORKER.username.toUpperCase());
  });

  test("an exact count linked to the task posts and completes the task atomically", async () => {
    if (!oneLocationPlan || !stockedProduct || !locationA) {
      throw new Error("Plan fixture is not ready.");
    }
    const tasks = await apiRequest<TaskRecord[]>(workerToken, "/tasks");
    const planTask = tasks.find((task) => task.cycleCountPlan?.id === oneLocationPlan!.id);
    if (!planTask) throw new Error("The plan task was not found.");

    // The worker speaks only the counted quantity; the product and location
    // come from the assigned task (taskId link).
    const transaction = await apiRequest<{ id: string; action: string }>(
      workerToken,
      "/inventory/transactions",
      {
        method: "POST",
        body: JSON.stringify({
          action: "CYCLE_COUNT",
          productId: stockedProduct.id,
          quantity: 25,
          condition: "GOOD",
          sourceLocationId: locationA.id,
          taskId: planTask.id,
          transcript: `Automated exact month-end count ${runId}.`,
          clientRequestId: `e2e-ccp-exact-${runId}`,
        }),
      },
    );
    const confirmation = await apiRequest<{ outcome: string }>(
      workerToken,
      `/inventory/transactions/${transaction.id}/confirm`,
      { method: "POST", body: "{}" },
    );
    expect(confirmation.outcome).toBe("POSTED");

    const refreshed = await apiRequest<TaskRecord[]>(workerToken, "/tasks");
    const completedTask = refreshed.find((task) => task.id === planTask.id);
    expect(completedTask?.status).toBe("COMPLETED");
    // The completed task disappears from the worker's open-task queue.
    const openQueue = refreshed.filter(
      (task) =>
        task.status === "OPEN" && task.type === "CYCLE_COUNT",
    );
    expect(
      openQueue.some((task) => task.id === planTask.id),
      "completed tasks must leave the open queue",
    ).toBe(false);
  });

  test("a differing count creates a discrepancy and completes the task", async () => {
    if (!multiLocationPlan || !stockedProduct || !locationB) {
      throw new Error("Multi-location plan fixture is not ready.");
    }
    const tasks = await apiRequest<TaskRecord[]>(workerToken, "/tasks");
    const planTask = tasks.find(
      (task) =>
        task.cycleCountPlan?.id === multiLocationPlan!.id &&
        task.location?.id === locationB!.id,
    );
    if (!planTask) throw new Error("The plan task at location B was not found.");

    const transaction = await apiRequest<{ id: string; action: string }>(
      workerToken,
      "/inventory/transactions",
      {
        method: "POST",
        body: JSON.stringify({
          action: "CYCLE_COUNT",
          productId: stockedProduct.id,
          quantity: 8,
          condition: "GOOD",
          sourceLocationId: locationB.id,
          taskId: planTask.id,
          transcript: `Automated differing month-end count ${runId}.`,
          clientRequestId: `e2e-ccp-diff-${runId}`,
        }),
      },
    );
    const confirmation = await apiRequest<{ outcome: string }>(
      workerToken,
      `/inventory/transactions/${transaction.id}/confirm`,
      { method: "POST", body: "{}" },
    );
    expect(confirmation.outcome).toBe("PENDING_REVIEW");

    const refreshed = await apiRequest<TaskRecord[]>(workerToken, "/tasks");
    const completedTask = refreshed.find((task) => task.id === planTask.id);
    expect(completedTask?.status).toBe("COMPLETED");

    // The discrepancy is linked back to the plan's task so the manager plan
    // monitoring section can show a discrepancy count per plan.
    const cases = await apiRequest<{ items: DiscrepancyRecord[] }>(
      managerToken,
      "/discrepancies?pageSize=50",
    );
    expect(
      cases.items.some((entry) => entry.transactionId === transaction.id),
      "the differing count must create a discrepancy",
    ).toBe(true);
    const detail = await apiRequest<PlanRecord>(
      managerToken,
      `/tasks/cycle-count-plans/${multiLocationPlan!.id}`,
    );
    expect(detail.discrepancyCount).toBeGreaterThanOrEqual(1);
    const affectedTask = detail.tasks?.find((task) => task.id === planTask.id);
    expect(affectedTask?.discrepancies?.length ?? 0).toBeGreaterThanOrEqual(1);
  });

  test("manager can open a plan and see every generated task", async ({ page }) => {
    if (!oneLocationPlan || !stockedProduct) {
      throw new Error("Plan fixture is not ready.");
    }
    await page.goto(WEB_APP_URL);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible({
      timeout: 30_000,
    });

    const managerRoleCard = page
      .locator("button[aria-pressed]")
      .filter({ hasText: "Manager" });
    await managerRoleCard.click();
    await expect(managerRoleCard).toHaveAttribute("aria-pressed", "true");
    await page.getByLabel("Employee ID").fill(MANAGER.username);
    await page.getByRole("button", { name: /Continue as Manager/ }).click();
    await page.waitForURL(/localhost:8080\/realms\/nirka-inventory\/protocol\/openid-connect\/auth/);
    await page.locator("#username").fill(MANAGER.username);
    await page.locator("#password").fill(MANAGER.password);
    await page.locator('#kc-form-login button[type="submit"]').first().click();
    await page.waitForURL(/localhost:3000/);
    await expect(page.locator("#manager-overview-metrics")).toBeVisible();

    await page.getByRole("button", { name: /^Task planning/ }).click();
    const plansSection = page.locator("#manager-cycle-count-plans");
    await expect(plansSection).toBeVisible();
    const planRow = plansSection
      .locator("tbody tr")
      .filter({ hasText: oneLocationPlan!.planNumber });
    await expect(planRow.first()).toContainText(periodOne.periodMonth.split("-")[0]);
    await planRow.first().getByRole("button", { name: "View tasks" }).click();
    await expect(
      plansSection.getByText(stockedProduct!.name, { exact: true }),
    ).toBeVisible();
    await expect(plansSection.getByText("Count period")).toBeVisible();
    await expect(plansSection.getByText(/Blind count/).first()).toBeVisible();
  });

  test("worker queue shows the month-end count task with period and voice start", async ({ page }) => {
    if (!stockedProduct) {
      throw new Error("Plan fixture is not ready.");
    }
    await page.goto(WEB_APP_URL);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible({
      timeout: 30_000,
    });

    const workerRoleCard = page
      .locator("button[aria-pressed]")
      .filter({ hasText: "Warehouse Executive" });
    await workerRoleCard.click();
    await expect(workerRoleCard).toHaveAttribute("aria-pressed", "true");
    await page.getByLabel("Employee ID").fill(WORKER.username);
    await page.getByRole("button", { name: /Continue as Warehouse Executive/ }).click();
    await page.waitForURL(/localhost:8080\/realms\/nirka-inventory\/protocol\/openid-connect\/auth/);
    await page.locator("#username").fill(WORKER.username);
    await page.locator("#password").fill(WORKER.password);
    await page.locator('#kc-form-login button[type="submit"]').first().click();
    await page.waitForURL(/localhost:3000/);

    await page.getByRole("button", { name: /^Task queue/ }).click();
    await expect(page.getByRole("heading", { name: "Work assigned to you" })).toBeVisible();

    // The multi-location plan's open task (Item @ Storage A in periodTwo) is
    // still open and must display the month-end labels: month-end badge, count
    // period, plan number and the Start with voice button.
    const taskCard = page
      .locator(".worker-task-card")
      .filter({ hasText: stockedProduct!.name });
    await expect(taskCard.first()).toContainText("Month-End Cycle Count");
    await expect(taskCard.first()).toContainText("Count period");
    await expect(taskCard.first().getByRole("button", { name: "Start with voice" })).toBeVisible();
  });
});

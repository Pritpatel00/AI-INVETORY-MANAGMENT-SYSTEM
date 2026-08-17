import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";

/**
 * Automatic Warehouse Executive task assignment for reservation shipments.
 *
 *  1. The manager prepares a shipment through the application modal (no
 *     native browser prompt) and the task is automatically assigned to the
 *     active Warehouse Executive with the fewest open tasks.
 *  2. The assigned worker receives the task with a badge update and full
 *     details (product, quantity, source location, order + shipment
 *     references, due date, priority, instructions).
 *  3. The worker completes the task without voice (Start task + Complete
 *     task) and with voice (prefilled details + confirmation). Both paths
 *     post the Ship transaction atomically: on-hand AND reserved decrease
 *     together and the reservation moves to Partially Fulfilled / Fulfilled.
 *  4. Partial fulfilment keeps the remaining quantity reserved and a second
 *     shipment task can be prepared for the rest.
 *  5. No native prompt, no console error and no runtime overlay appears.
 *
 * The voice test mocks the microphone (MediaRecorder) and intercepts the
 * speech-transcription request with a canned transcript; the real Qwen/Ollama
 * extraction still runs end to end with the task details prefilled.
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

interface ProductRecord { id: string; name: string; sku: string; unit: string; active: boolean; }
interface LocationRecord { id: string; name: string; code: string; active: boolean; }
interface BalanceRecord { id: string; quantity: number; reservedQuantity: number; product: ProductRecord; location: LocationRecord; }
interface ReservationRecord {
  id: string;
  reservationNumber: string;
  status: string;
  allocations: Array<{ id: string; quantity: number; shippedQuantity: number; releasedQuantity: number; product: ProductRecord; location: LocationRecord }>;
}
interface TaskRecord {
  id: string;
  type: string;
  status: string;
  quantity: number | null;
  shipmentReference: string | null;
  reservationId: string | null;
  assignedTo: { id: string; employeeId: string; displayName: string } | null;
  product?: ProductRecord | null;
  sourceLocation?: LocationRecord | null;
  reservation?: { request?: { referenceNumber?: string } } | null;
}
interface TransactionRecord { id: string; action: string; status: string; quantity: number; referenceNumber: string | null; notes: string | null; }

const createdRequestIds = new Set<string>();
const createdReservationIds = new Set<string>();
const createdTaskIds = new Set<string>();
const createdTransactionIds = new Set<string>();
const affectedBalances = new Map<string, { balanceId: string; quantity: number; reservedQuantity: number }>();
let restoreKeycloakClient: (() => Promise<void>) | null = null;
let fixtureProduct: ProductRecord | null = null;
let fixtureLocation: LocationRecord | null = null;

test.describe.configure({ retries: 2 });

async function expectJsonOk(response: Response, what: string) {
  if (!response.ok) {
    throw new Error(`${what} failed with HTTP ${response.status}: ${await response.text()}`);
  }
}

async function getKeycloakAdminToken(): Promise<string> {
  const response = await fetch(`${KEYCLOAK_BASE_URL}/realms/master/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: "admin-cli", grant_type: "password", username: KEYCLOAK_ADMIN.username, password: KEYCLOAK_ADMIN.password }),
  });
  await expectJsonOk(response, "Keycloak admin token request");
  return ((await response.json()) as { access_token: string }).access_token;
}

async function getAccessToken(user: { username: string; password: string }): Promise<string> {
  const response = await fetch(`${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: WEB_CLIENT_ID, grant_type: "password", username: user.username, password: user.password }),
  });
  await expectJsonOk(response, `Access token for ${user.username}`);
  return ((await response.json()) as { access_token: string }).access_token;
}

async function readWebClient(adminToken: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${KEYCLOAK_BASE_URL}/admin/realms/${REALM}/clients?clientId=${WEB_CLIENT_ID}`, { headers: { Authorization: `Bearer ${adminToken}` } });
  await expectJsonOk(response, "Keycloak web client lookup");
  const clients = (await response.json()) as Array<Record<string, unknown>>;
  const client = clients[0];
  if (!client) throw new Error(`Keycloak client "${WEB_CLIENT_ID}" was not found.`);
  return client;
}

async function writeWebClient(adminToken: string, client: Record<string, unknown>) {
  const response = await fetch(`${KEYCLOAK_BASE_URL}/admin/realms/${REALM}/clients/${String(client.id)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(client),
  });
  if (!response.ok) throw new Error(`Keycloak client update failed with HTTP ${response.status}: ${await response.text()}`);
}

const tokensByUser = new Map<string, string>();
async function freshToken(user: { username: string; password: string }): Promise<string> {
  const existing = tokensByUser.get(user.username);
  if (existing) return existing;
  const token = await getAccessToken(user);
  tokensByUser.set(user.username, token);
  return token;
}

async function apiRequest<T>(user: { username: string; password: string }, path: string, init?: RequestInit): Promise<T> {
  const token = await freshToken(user);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers },
  });
  await expectJsonOk(response, `Inventory API ${init?.method ?? "GET"} ${path}`);
  return response.json() as Promise<T>;
}

async function createFixture(requiredQuantity: number) {
  if (!fixtureProduct) throw new Error("Fixture product was not prepared.");
  const referenceNumber = `E2E-SHIP-${Date.now().toString(36).toUpperCase()}`;
  const request = await apiRequest<{ id: string; reservations: ReservationRecord[] }>(MANAGER, "/reservations/stock-requests", {
    method: "POST",
    body: JSON.stringify({
      requestType: "CUSTOMER_ORDER",
      referenceNumber,
      requestedFor: "E2E Shipment",
      requiredDate: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      lines: [{ productId: fixtureProduct.id, requiredQuantity }],
    }),
  });
  createdRequestIds.add(request.id);
  const reserved = await apiRequest<{ id: string; reservations: ReservationRecord[] }>(
    MANAGER,
    `/reservations/stock-requests/${request.id}/reserve-recommended`,
    { method: "POST" },
  );
  const reservation = reserved.reservations[0];
  createdReservationIds.add(reservation.id);
  return { requestId: request.id, reservation, referenceNumber };
}

async function prepareShipment(reservationId: string, allocationId: string, quantity: number, assignmentMode = "AUTO", priority = "MEDIUM", assignedToId?: string) {
  const result = await apiRequest<{ idempotent: boolean; task: TaskRecord }>(MANAGER, `/reservations/${reservationId}/shipments`, {
    method: "POST",
    body: JSON.stringify({
      allocationId,
      quantity,
      assignmentMode,
      ...(assignedToId ? { assignedToId } : {}),
      priority,
      dueAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
      instructions: `Carrier pickup for the prepared shipment.`,
    }),
  });
  createdTaskIds.add(result.task.id);
  return result;
}

/** Collect browser console errors and page exceptions during a flow. */
function trackBrowserErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

/** Fail the test if the app ever opens a native browser dialog. */
function trackDialogs(page: Page) {
  const dialogs: string[] = [];
  page.on("dialog", (dialog) => dialogs.push(dialog.message()));
  return dialogs;
}

async function signInAs(page: Page, user: { username: string; password: string }, roleLabel: string) {
  await page.goto(WEB_APP_URL);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible({ timeout: 30_000 });
  await page.locator("button[aria-pressed]").filter({ hasText: roleLabel }).click();
  await page.getByLabel("Employee ID").fill(user.username);
  await page.getByRole("button", { name: /Continue as/ }).click();
  await page.waitForURL(/localhost:8080\/realms\//);
  await page.locator("#username").fill(user.username);
  await page.locator("#password").fill(user.password);
  await page.locator('#kc-form-login button[type="submit"]').first().click();
  await page.waitForURL(/localhost:3000/);
}

async function installVoiceFixtures(page: Page, transcript: string) {
  await page.addInitScript(
    ({ speechText }: { speechText: string }) => {
      if (location.origin !== "http://localhost:3000") return;
      class FakeMediaRecorder {
        static isTypeSupported(type: string) { return type === "audio/webm"; }
        readonly mimeType: string;
        state = "inactive";
        ondataavailable: ((event: Event) => void) | null = null;
        onstop: ((event: Event) => void) | null = null;
        constructor(_stream: MediaStream, options?: { mimeType?: string }) {
          this.mimeType = options?.mimeType ?? "audio/webm";
        }
        start() { this.state = "recording"; }
        stop() {
          if (this.state !== "recording") return;
          this.state = "inactive";
          const blob = new Blob([new Uint8Array([0])], { type: this.mimeType });
          const dataEvent = new Event("dataavailable");
          Object.defineProperty(dataEvent, "data", { value: blob });
          this.ondataavailable?.(dataEvent);
          this.onstop?.(new Event("stop"));
        }
      }
      Object.defineProperty(window, "MediaRecorder", { value: FakeMediaRecorder, configurable: true });
      if (!navigator.mediaDevices) Object.defineProperty(navigator, "mediaDevices", { value: {}, configurable: true });
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", { value: async () => new MediaStream(), configurable: true });
      // Expose the canned transcript for the route mock below.
      (window as unknown as Record<string, unknown>).__cannedSpeech = speechText;
    },
    { speechText: transcript },
  );
  // Intercept the transcription upload: faster-whisper is not required for
  // this flow. The real Qwen/Ollama extraction still runs on the transcript.
  await page.route(`${API_BASE_URL}/speech/transcribe`, async (route) => {
    const speechText = await page.evaluate(() => (window as unknown as Record<string, unknown>).__cannedSpeech as string);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        evidenceId: null,
        storageKey: null,
        text: speechText,
        language: "en",
        languageProbability: 0.98,
        duration: 2.4,
        model: "faster-whisper (mocked for shipment e2e)",
        segments: [],
      }),
    });
  });
}

function runSql(statement: string): string {
  const result = execFileSync(
    "psql",
    [
      "-h", "localhost", "-p", "5434",
      "-U", "nirka_inventory",
      "-d", "nirka_inventory",
      "-v", "ON_ERROR_STOP=1",
      "-t", "-A",
      "-c", statement,
    ],
    { env: { ...process.env, PGPASSWORD: "nirka_inventory_dev" }, encoding: "utf8" },
  );
  return result.trim();
}

const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;
const inList = (ids: string[]) => [...ids].map(quote).join(", ");

async function cleanupTestRecords() {
  const requestIds = [...createdRequestIds];
  const reservationIds = [...createdReservationIds];
  const taskIds = [...createdTaskIds];
  const transactionIds = [...createdTransactionIds];
  if (requestIds.length === 0 && reservationIds.length === 0) return;
  try {
    if (requestIds.length > 0) {
      runSql(`DELETE FROM reservation_audit_events WHERE stock_request_id IN (${inList(requestIds)});`);
      runSql(`DELETE FROM stock_request_lines WHERE stock_request_id IN (${inList(requestIds)});`);
    }
    if (reservationIds.length > 0) {
      runSql(`DELETE FROM stock_reservation_allocations WHERE reservation_id IN (${inList(reservationIds)});`);
      runSql(`DELETE FROM stock_reservations WHERE id IN (${inList(reservationIds)});`);
    }
    if (taskIds.length > 0) {
      runSql(`DELETE FROM notifications WHERE "linkId" IN (${inList(taskIds)});`);
      runSql(`DELETE FROM inventory_tasks WHERE id IN (${inList(taskIds)});`);
    }
    if (transactionIds.length > 0) {
      runSql(`DELETE FROM inventory_transactions WHERE id IN (${inList(transactionIds)});`);
    }
    if (requestIds.length > 0) {
      runSql(`DELETE FROM stock_requests WHERE id IN (${inList(requestIds)});`);
    }
  } catch (error) {
    console.error("Cleanup SQL failed:", error);
  }
}

test.beforeAll(async () => {
  const adminToken = await getKeycloakAdminToken();
  const originalClient = await readWebClient(adminToken);
  const clientSnapshot = JSON.parse(JSON.stringify(originalClient)) as Record<string, unknown>;
  restoreKeycloakClient = async () => {
    const freshAdminToken = await getKeycloakAdminToken();
    await writeWebClient(freshAdminToken, clientSnapshot);
  };
  const redirectUris = Array.isArray(originalClient.redirectUris) ? (originalClient.redirectUris as string[]) : [];
  const redirectPattern = `${WEB_APP_URL}/*`;
  await writeWebClient(adminToken, {
    ...originalClient,
    directAccessGrantsEnabled: true,
    redirectUris: redirectUris.includes(redirectPattern) ? redirectUris : [...redirectUris, redirectPattern],
  });

  const balances = await apiRequest<BalanceRecord[]>(WORKER, "/inventory/balances");
  const candidate = balances
    .filter((entry) => entry.product.active && entry.location.active && entry.quantity - entry.reservedQuantity >= 2)
    .sort((left, right) => (right.quantity - right.reservedQuantity) - (left.quantity - left.reservedQuantity))[0];
  if (!candidate) {
    throw new Error("No stocked active product with at least 2 available units was found.");
  }
  fixtureProduct = candidate.product;
  fixtureLocation = candidate.location;
  affectedBalances.set(candidate.id, { balanceId: candidate.id, quantity: candidate.quantity, reservedQuantity: candidate.reservedQuantity });
});

test.afterAll(async () => {
  try {
    // Release any reserved stock that was not shipped, then restore the exact
    // baseline balances (a shipped fixture consumed on-hand stock).
    for (const reservationId of createdReservationIds) {
      await apiRequest(MANAGER, `/reservations/${reservationId}/release`, {
        method: "POST",
        body: JSON.stringify({ reason: "Close the reservation shipment E2E fixture." }),
      }).catch(() => null);
    }
    await cleanupTestRecords();
    for (const [balanceId, baseline] of affectedBalances) {
      await apiRequest(ADMINISTRATOR, "/inventory/balance-adjustments", {
        method: "POST",
        body: JSON.stringify({ balanceId, quantity: baseline.quantity, reservedQuantity: baseline.reservedQuantity, reason: "Restore the reservation shipment E2E baseline." }),
      }).catch(() => null);
    }
  } finally {
    await restoreKeycloakClient?.();
  }
});

test("manager prepares a shipment through the modal with automatic worker assignment (no native prompt)", async ({ page }) => {
  if (!fixtureProduct || !fixtureLocation) throw new Error("Fixture product or location unavailable.");
  const dialogs = trackDialogs(page);
  const errors = trackBrowserErrors(page);

  await signInAs(page, MANAGER, "Manager");
  await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Reservations" }).click();
  await expect(page.getByRole("heading", { name: "Requests and reservations" })).toBeVisible();

  // Create a stock request through the application form.
  const uiRequestedFor = `E2E UI Customer ${Date.now().toString(36).toUpperCase()}`;
  await page.getByRole("button", { name: "+ New stock request" }).click();
  const requestNumberPreview = page.getByLabel(/Order or request number REQ-\d+/);
  await expect(requestNumberPreview).toHaveText(/^REQ-\d{3,}$/);
  const displayedRequestNumber = (await requestNumberPreview.textContent())?.trim();
  await expect(page.getByRole("textbox", { name: /Order \/ request number/i })).toHaveCount(0);
  await page.getByLabel("Requested for").fill(uiRequestedFor);
  await page.getByLabel("Item").selectOption({ label: `${fixtureProduct.name} — ${fixtureProduct.sku}` });
  await page.getByLabel("Required quantity").fill("5");
  await page.getByRole("button", { name: "Confirm request" }).click();
  await expect(page.getByText(/Stock request REQ-\d+ confirmed\. It is ready for reservation\./)).toBeVisible({ timeout: 30_000 });

  // Reserve available stock (on-hand must NOT change).
  await page.locator("article").filter({ hasText: uiRequestedFor }).getByRole("button", { name: "Reserve available stock" }).click();
  await expect(page.getByText("Available stock was reserved. On-hand stock did not change.")).toBeVisible({ timeout: 30_000 });

  // Register the UI-created request and reservation for afterAll cleanup so
  // a failed run never leaves an orphaned E2E fixture behind.
  const uiRequests = await apiRequest<Array<{ id: string; requestNumber: string; referenceNumber: string; requestedFor: string; reservations: ReservationRecord[] }>>(MANAGER, "/reservations/stock-requests");
  const trackedRequest = uiRequests.find((entry) => entry.requestedFor === uiRequestedFor);
  const uiReference = trackedRequest?.requestNumber;
  let trackedReservationId: string | null = null;
  if (trackedRequest) {
    createdRequestIds.add(trackedRequest.id);
    for (const reservation of trackedRequest.reservations) {
      createdReservationIds.add(reservation.id);
      trackedReservationId = reservation.id;
    }
  }
  if (!trackedReservationId || !uiReference) throw new Error("The UI-created reservation or generated REQ number could not be found.");
  expect(uiReference).toBe(displayedRequestNumber);

  // Switch to the Reservations tab and open the Prepare shipment modal.
  await page.getByRole("button", { name: /^Reservations \(\d+\)$/ }).click();
  await page.locator("article").filter({ hasText: uiRequestedFor }).getByRole("button", { name: "Prepare shipment" }).click();
  await expect(page.getByRole("dialog", { name: "Prepare shipment" })).toBeVisible();

  // The modal reuses the reservation details instead of asking for them.
  await expect(page.getByRole("dialog", { name: "Prepare shipment" })).toContainText(fixtureProduct.name);
  await expect(page.getByRole("dialog", { name: "Prepare shipment" })).toContainText(fixtureLocation.name);
  await expect(page.getByRole("dialog", { name: "Prepare shipment" })).toContainText(`5 ${fixtureProduct.unit}`);
  await expect(page.getByRole("dialog", { name: "Prepare shipment" })).toContainText(uiRequestedFor);

  const shipmentDialog = page.getByRole("dialog", { name: "Prepare shipment" });

  // Assignment-mode controls appear inside the modal and AUTO is selected by default.
  await expect(shipmentDialog.getByText("Assign task to")).toBeVisible();
  await expect(shipmentDialog.getByRole("radio", { name: /Auto assign/ })).toBeChecked();
  await expect(shipmentDialog.getByRole("radio", { name: /Select Warehouse Executive/ })).not.toBeChecked();
  await expect(shipmentDialog.getByRole("radio", { name: /Leave unassigned/ })).not.toBeChecked();
  await expect(shipmentDialog.getByText("The system will select the available executive with the fewest open tasks.")).toBeVisible();

  // The shipment reference is generated automatically, read-only, and never editable.
  await expect(shipmentDialog.locator("label").filter({ hasText: "Shipment reference" })).toBeVisible();
  await expect(shipmentDialog.getByText("Generated automatically", { exact: true })).toBeVisible();
  // No editable input exists for the internal reference (the old manual SHIP field is gone).
  await expect(shipmentDialog.getByPlaceholder(/SHIP/)).toHaveCount(0);

  // Enter the shipment details and prepare it (scoped to the open dialog:
  // other reservation cards behind the overlay carry the same button).
  await shipmentDialog.getByLabel("Quantity to ship").fill("3");
  await shipmentDialog.getByLabel("Priority").selectOption("HIGH");
  await shipmentDialog.getByLabel("Instructions (optional)").fill("Stage at the dispatch door.");
  await shipmentDialog.getByRole("button", { name: "Prepare shipment", exact: true }).click();

  // The task is automatically assigned; the message names the worker and the
  // generated reference.
  await expect(page.getByText(/Shipment SHIP-\d+ prepared and assigned to/)).toBeVisible({ timeout: 30_000 });
  const task = await apiRequest<TaskRecord[]>(MANAGER, "/tasks");
  const shipmentTask = task.find((entry) => entry.type === "SHIP" && entry.reservationId === trackedReservationId);
  expect(shipmentTask, "the prepared shipment task should exist").toBeTruthy();
  expect(shipmentTask!.assignedTo, "an active executive must be auto-assigned").toBeTruthy();
  expect(shipmentTask!.shipmentReference, "a generated SHIP reference must be issued").toMatch(/^SHIP-\d+$/);
  createdTaskIds.add(shipmentTask!.id);

  // The worker is notified about the assignment.
  const workerNotifications = await apiRequest<Array<{ type: string; linkId: string }>>(WORKER, "/notifications");
  expect(workerNotifications.some((entry) => entry.type === "SHIPMENT_TASK_ASSIGNED" && entry.linkId === shipmentTask!.id)).toBe(true);

  // The reservation card now shows the shipment task (status, worker, reference).
  const reservationCard = page.locator("article").filter({ hasText: uiRequestedFor });
  await expect(reservationCard.getByText(`Shipment ${shipmentTask!.shipmentReference}`)).toBeVisible({ timeout: 10_000 });
  await expect(reservationCard.getByText(`assigned to ${shipmentTask!.assignedTo!.displayName}`)).toBeVisible();
  await expect(reservationCard.getByText("OPEN", { exact: true })).toBeVisible();

  // No native browser prompt was ever opened.
  expect(dialogs, "the application must not use native prompts").toEqual([]);
  expect(errors).toEqual([]);
});

test("assigned worker receives the task with a badge and completes it without voice", async ({ page }) => {
  if (!fixtureProduct || !fixtureLocation) throw new Error("Fixture product or location unavailable.");
  // Reuse the shipment prepared in the previous test (fixtures persist in order).
  const tasks = await apiRequest<TaskRecord[]>(WORKER, "/tasks");
  const shipmentTask = tasks.find((entry) => entry.type === "SHIP" && entry.status !== "COMPLETED" && entry.status !== "CANCELLED");
  if (!shipmentTask) throw new Error("No open shipment task was found; run the manager test first.");
  const shipmentReference = shipmentTask.shipmentReference!;
  createdTaskIds.add(shipmentTask.id);

  const dialogs = trackDialogs(page);
  const errors = trackBrowserErrors(page);

  await signInAs(page, WORKER, "Warehouse Executive");
  await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible({ timeout: 30_000 });

  // The task badge shows at least one open task.
  await expect(page.locator(".sidebar-nav-item").filter({ hasText: "Task queue" })).toContainText(/[1-9]/);
  await page.getByRole("button", { name: /Task queue/ }).click();

  // The task card shows the full shipment details.
  const card = page.locator(".worker-task-card").filter({ hasText: "Ship reserved stock" }).first();
  await expect(card).toContainText(shipmentReference);
  await expect(card).toContainText("Order ");
  await expect(card).toContainText(String(shipmentTask.quantity));
  await expect(card).toContainText(fixtureLocation.name);
  // The task was created through the manager's application modal, whose
  // instructions were typed into the modal, not via the API helper used by
  // the later tests in this file.
  await expect(card).toContainText("Stage at the dispatch door.");

  // Complete without voice: Start task then Complete task.
  await card.getByRole("button", { name: "Start task" }).click();
  await expect(page.getByText("Task started. Complete it after the physical work is done.")).toBeVisible({ timeout: 20_000 });
  await card.getByRole("button", { name: "Complete task" }).click();
  await expect(page.getByText("Shipment task completed. Stock was posted and the reservation was updated.")).toBeVisible({ timeout: 30_000 });

  // The completed task leaves the open queue.
  await expect(page.locator(".worker-task-card").filter({ hasText: shipmentReference })).toHaveCount(0, { timeout: 30_000 });

  // Backend: the reservation advanced and the Ship transaction was posted.
  const reservation = await apiRequest<ReservationRecord[]>(MANAGER, "/reservations");
  const affected = reservation.find((entry) => entry.id === shipmentTask.reservationId);
  expect(affected?.status).toBe("PARTIALLY_SHIPPED");
  const transaction = await apiRequest<TransactionRecord[]>(WORKER, "/inventory/transactions");
  expect(transaction.some((entry) => entry.action === "SHIP" && entry.status === "POSTED" && entry.quantity === shipmentTask.quantity)).toBe(true);

  expect(dialogs).toEqual([]);
  expect(errors).toEqual([]);
});

test("worker completes a full shipment with voice: prefilled details and confirmation", async ({ page }) => {
  if (!fixtureProduct || !fixtureLocation) throw new Error("Fixture unavailable.");
  const fixture = await createFixture(5);
  const allocation = fixture.reservation.allocations[0];
  const prepared = await prepareShipment(fixture.reservation.id, allocation.id, 5, "AUTO", "URGENT");
  const shipmentReference = prepared.task.shipmentReference!;

  const dialogs = trackDialogs(page);
  const errors = trackBrowserErrors(page);
  await installVoiceFixtures(page, `Shipped 5 ${fixtureProduct.unit} of ${fixtureProduct.name} from ${fixtureLocation.name} for ${fixture.referenceNumber}.`);

  await signInAs(page, WORKER, "Warehouse Executive");
  await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: /Task queue/ }).click();

  const card = page.locator(".worker-task-card").filter({ hasText: shipmentReference }).first();
  await expect(card).toBeVisible({ timeout: 30_000 });
  await card.getByRole("button", { name: "Start with voice" }).click();

  // The voice entry opens with the task details prefilled.
  await expect(page.getByText("Active assigned task")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Shipment reference", { exact: true })).toBeVisible();
  await expect(page.getByText(shipmentReference, { exact: true })).toBeVisible();
  await expect(page.getByText("Order reference", { exact: true })).toBeVisible();
  await expect(page.getByText(fixture.referenceNumber, { exact: true })).toBeVisible();
  await expect(page.getByText("Ship from", { exact: true })).toBeVisible();
  await expect(page.getByText(fixtureLocation.name, { exact: true })).toBeVisible();

  // Record (mocked) — the real extraction then runs on the canned transcript.
  await page.getByRole("button", { name: "Start microphone recording" }).click();
  await expect(page.getByText("Recording from your microphone…")).toBeVisible();
  await page.getByRole("button", { name: "Stop recording" }).click();

  await expect(page.getByText("Complete and ready for Warehouse Executive confirmation", { exact: true })).toBeVisible({ timeout: 240_000 });
  const voiceEntry = page.locator("#voice-entry");
  // The extraction summary panels are the cards whose value includes the SKU
  // in parentheses (the prefilled task card shows only the plain item name).
  await expect(voiceEntry.getByText("AI extraction")).toBeVisible();
  await expect(voiceEntry.getByText("Action", { exact: true }).locator("..")).toContainText(/ship/i);
  await expect(voiceEntry.getByText("Item name", { exact: true }).locator("..").filter({ hasText: "(" })).toContainText(fixtureProduct.name);
  await expect(voiceEntry.getByText("Number", { exact: true }).locator("..")).toContainText(/5/);
  await expect(voiceEntry.getByText("From shelf", { exact: true }).locator("..")).toContainText(fixtureLocation.name);

  // Confirm: the shipment posts and the reservation is fulfilled.
  await page.getByRole("button", { name: "Confirm inventory update" }).click();
  await expect(page.getByText("Transaction posted")).toBeVisible({ timeout: 60_000 });

  // The task left the open queue.
  await page.getByRole("button", { name: "Home" }).click();
  await page.getByRole("button", { name: /Task queue/ }).click();
  await expect(page.locator(".worker-task-card").filter({ hasText: shipmentReference })).toHaveCount(0, { timeout: 30_000 });

  // Backend: reservation fulfilled, task completed, transaction posted.
  const reservation = await apiRequest<ReservationRecord[]>(MANAGER, "/reservations");
  const affected = reservation.find((entry) => entry.id === fixture.reservation.id);
  expect(affected?.status).toBe("COMPLETED");
  const task = await apiRequest<TaskRecord[]>(WORKER, "/tasks");
  const completedTask = task.find((entry) => entry.id === prepared.task.id);
  expect(completedTask?.status).toBe("COMPLETED");
  const transaction = await apiRequest<TransactionRecord[]>(WORKER, "/inventory/transactions");
  expect(transaction.some((entry) => entry.action === "SHIP" && entry.status === "POSTED" && entry.quantity === 5 && entry.notes?.includes(shipmentReference))).toBe(true);

  expect(dialogs).toEqual([]);
  expect(errors).toEqual([]);
});

test("partial fulfilment keeps the remainder reserved and a second shipment completes it", async () => {
  if (!fixtureProduct) throw new Error("Fixture unavailable.");
  const fixture = await createFixture(5);
  const allocation = fixture.reservation.allocations[0];
  const balanceId = affectedBalances.keys().next().value as string;

  // Capture the balance now (earlier tests in this file already consumed
  // stock from the same fixture balance), then verify only this partial
  // shipment's delta: on-hand and reserved both fall by the shipped 3 units.
  const beforePartial = (await apiRequest<BalanceRecord[]>(WORKER, "/inventory/balances")).find((entry) => entry.id === balanceId);
  expect(beforePartial).toBeTruthy();

  // Ship 3 of the 5 reserved units (partial).
  const partial = await prepareShipment(fixture.reservation.id, allocation.id, 3);
  await apiRequest(WORKER, `/tasks/${partial.task.id}/start`, { method: "POST" });
  await apiRequest(WORKER, `/tasks/${partial.task.id}/complete`, { method: "POST" });

  const afterPartial = await apiRequest<BalanceRecord[]>(WORKER, "/inventory/balances");
  const balance = afterPartial.find((entry) => entry.id === balanceId);
  expect(balance).toBeTruthy();
  expect(balance!.quantity).toBe(beforePartial!.quantity - 3);
  expect(balance!.reservedQuantity).toBe(beforePartial!.reservedQuantity - 3);

  const reservation = await apiRequest<ReservationRecord[]>(MANAGER, "/reservations");
  const affected = reservation.find((entry) => entry.id === fixture.reservation.id);
  expect(affected?.status).toBe("PARTIALLY_SHIPPED");
  const remaining = affected!.allocations[0].quantity - affected!.allocations[0].shippedQuantity - affected!.allocations[0].releasedQuantity;
  expect(remaining).toBe(2);

  // A second shipment task can be prepared for the remaining 2 units.
  const rest = await prepareShipment(fixture.reservation.id, allocation.id, 2);
  expect(rest.idempotent).toBe(false);
  await apiRequest(WORKER, `/tasks/${rest.task.id}/start`, { method: "POST" });
  await apiRequest(WORKER, `/tasks/${rest.task.id}/complete`, { method: "POST" });

  const completed = await apiRequest<ReservationRecord[]>(MANAGER, "/reservations");
  const finished = completed.find((entry) => entry.id === fixture.reservation.id);
  expect(finished?.status).toBe("COMPLETED");
});

test("duplicate shipment preparation for the same reservation and quantity is idempotent", async () => {
  if (!fixtureProduct) throw new Error("Fixture unavailable.");
  const fixture = await createFixture(4);
  const allocation = fixture.reservation.allocations[0];
  const first = await prepareShipment(fixture.reservation.id, allocation.id, 4);
  const second = await prepareShipment(fixture.reservation.id, allocation.id, 4);
  expect(second.idempotent).toBe(true);
  expect(second.task.id).toBe(first.task.id);
  expect(second.task.shipmentReference).toBe(first.task.shipmentReference);
  const tasks = await apiRequest<TaskRecord[]>(MANAGER, "/tasks");
  const duplicates = tasks.filter((entry) => entry.type === "SHIP" && entry.reservationId === fixture.reservation.id && entry.quantity === 4 && ["OPEN", "IN_PROGRESS"].includes(entry.status));
  expect(duplicates.length).toBe(1);
});

test("manager manually assigns a Warehouse Executive from the Prepare Shipment modal", async ({ page }) => {
  if (!fixtureProduct) throw new Error("Fixture unavailable.");
  const fixture = await createFixture(4);
  const assignees = await apiRequest<Array<{ id: string; employeeId: string; displayName: string; openTaskCount?: number }>>(MANAGER, "/tasks/assignees");
  expect(assignees.length, "at least one active Warehouse Executive must exist").toBeGreaterThan(0);
  // Assign to WORKER1 so the worker-side queue assertions below can use the
  // worker1 credentials.
  const target = assignees.find((entry) => entry.employeeId === "WORKER1") ?? assignees[0];

  const dialogs = trackDialogs(page);
  const errors = trackBrowserErrors(page);

  await signInAs(page, MANAGER, "Manager");
  await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Reservations" }).click();
  await expect(page.getByRole("heading", { name: "Requests and reservations" })).toBeVisible();
  await page.getByRole("button", { name: /^Reservations \(\d+\)$/ }).click();

  const card = page.locator("article").filter({ hasText: fixture.referenceNumber });
  await card.getByRole("button", { name: "Prepare shipment" }).click();
  const dialog = page.getByRole("dialog", { name: "Prepare shipment" });
  await expect(dialog).toBeVisible();

  // Switch to manual assignment: the dropdown appears and lists every active
  // Warehouse Executive with their open-task count.
  await dialog.getByRole("radio", { name: /Select Warehouse Executive/ }).check();
  const dropdown = dialog.getByRole("combobox", { name: "Select Warehouse Executive" });
  await expect(dropdown).toBeVisible();
  // One placeholder option plus one entry per active Warehouse Executive.
  await expect(dropdown.locator("option")).toHaveCount(assignees.length + 1);
  await expect(dropdown).toContainText(`${target.displayName} (${target.employeeId})`);
  await expect(dropdown).toContainText("open tasks");
  await dropdown.selectOption(target.id);

  await dialog.getByRole("button", { name: "Prepare shipment", exact: true }).click();
  await expect(page.getByText(new RegExp(`Shipment SHIP-\\d+ prepared and assigned to ${target.displayName}`))).toBeVisible({ timeout: 30_000 });

  // The backend stored the selected worker and a generated reference.
  const tasks = await apiRequest<TaskRecord[]>(MANAGER, "/tasks");
  const shipmentTask = tasks.find((entry) => entry.type === "SHIP" && entry.reservationId === fixture.reservation.id);
  expect(shipmentTask, "the manually assigned shipment task should exist").toBeTruthy();
  expect(shipmentTask!.assignedTo?.id).toBe(target.id);
  expect(shipmentTask!.shipmentReference).toMatch(/^SHIP-\d+$/);
  createdTaskIds.add(shipmentTask!.id);

  // The selected worker sees the task in their queue.
  const workerTasks = await apiRequest<TaskRecord[]>(WORKER, "/tasks");
  expect(workerTasks.some((entry) => entry.id === shipmentTask!.id)).toBe(true);
  const workerNotifications = await apiRequest<Array<{ type: string; linkId: string }>>(WORKER, "/notifications");
  expect(workerNotifications.some((entry) => entry.type === "SHIPMENT_TASK_ASSIGNED" && entry.linkId === shipmentTask!.id)).toBe(true);

  expect(dialogs).toEqual([]);
  expect(errors).toEqual([]);
});

test("manager leaves a shipment unassigned and is notified that a worker must be assigned", async ({ page }) => {
  if (!fixtureProduct) throw new Error("Fixture unavailable.");
  const fixture = await createFixture(4);

  const dialogs = trackDialogs(page);
  const errors = trackBrowserErrors(page);

  await signInAs(page, MANAGER, "Manager");
  await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Reservations" }).click();
  await expect(page.getByRole("heading", { name: "Requests and reservations" })).toBeVisible();
  await page.getByRole("button", { name: /^Reservations \(\d+\)$/ }).click();

  const card = page.locator("article").filter({ hasText: fixture.referenceNumber });
  await card.getByRole("button", { name: "Prepare shipment" }).click();
  const dialog = page.getByRole("dialog", { name: "Prepare shipment" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("radio", { name: /Leave unassigned/ }).check();
  await dialog.getByRole("button", { name: "Prepare shipment", exact: true }).click();

  await expect(page.getByText(/Shipment SHIP-\d+ prepared and left unassigned/)).toBeVisible({ timeout: 30_000 });

  // The task exists with no assignee and a generated reference.
  const tasks = await apiRequest<TaskRecord[]>(MANAGER, "/tasks");
  const shipmentTask = tasks.find((entry) => entry.type === "SHIP" && entry.reservationId === fixture.reservation.id);
  expect(shipmentTask, "the unassigned shipment task should exist").toBeTruthy();
  expect(shipmentTask!.assignedTo).toBeNull();
  expect(shipmentTask!.shipmentReference).toMatch(/^SHIP-\d+$/);
  createdTaskIds.add(shipmentTask!.id);

  // The manager is notified that worker assignment is required.
  const managerNotifications = await apiRequest<Array<{ type: string; linkId: string }>>(MANAGER, "/notifications");
  expect(managerNotifications.some((entry) => entry.type === "SHIPMENT_PREPARED" && entry.linkId === shipmentTask!.id)).toBe(true);

  // The reservation card shows the unassigned task and the Assign / reassign
  // control stays available so the manager can assign a worker later.
  const reservationCard = page.locator("article").filter({ hasText: fixture.referenceNumber });
  await expect(reservationCard.getByText(`Shipment ${shipmentTask!.shipmentReference}`)).toBeVisible({ timeout: 10_000 });
  await expect(reservationCard.getByText("assigned to unassigned")).toBeVisible();
  await reservationCard.getByRole("button", { name: "View task" }).first().click();
  await expect(reservationCard.getByText("Assign / reassign")).toBeVisible();

  // An unassigned shipment never appears in a worker's claimable queue.
  const workerTasks = await apiRequest<TaskRecord[]>(WORKER, "/tasks");
  expect(workerTasks.some((entry) => entry.id === shipmentTask!.id)).toBe(false);

  expect(dialogs).toEqual([]);
  expect(errors).toEqual([]);
});

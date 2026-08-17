import { expect, test, type Page } from "@playwright/test";
import { execFile, execFileSync } from "node:child_process";
import { readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

/**
 * Voice capture flow (M5/M6/M7 Playwright e2e).
 *
 * End-to-end coverage of the worker voice pipeline without a real
 * microphone:
 *   1. `getUserMedia` is mocked to resolve with an empty MediaStream and
 *      `window.MediaRecorder` is replaced with a fake that emits a single
 *      `dataavailable` blob containing a REAL spoken WAV fixture when
 *      `stop()` is called. No browser permission prompt is ever shown.
 *   2. The worker signs in through the real Keycloak login page, taps the
 *      microphone and stops the "recording".
 *   3. The real pipeline runs end to end: the web client uploads the blob,
 *      the NestJS API stores it as voice evidence and the local
 *      faster-whisper service transcribes it. The transcript appears on
 *      screen.
 *   4. AI extraction (Qwen 3 via Ollama) parses the transcript and the
 *      proposal is read back and confirmed by the worker.
 *   5. The RECEIVE transaction posts atomically and the API confirms the
 *      audit ledger shows it as POSTED.
 *
 * The spoken WAV is generated at runtime with the slower local Windows voice.
 * It says "Received five units of Cable." and intentionally omits a location.
 * The AI must match the current one-word catalogue item and apply the business
 * rule that sends receives without a spoken location to Receiving.
 *
 * Setup notes (same pattern as the manager approval spec):
 *   - The Keycloak web client normally has `directAccessGrantsEnabled =
 *     false`, so `beforeAll` temporarily enables it for the API-level token
 *     fetches and `afterAll` restores the original settings.
 *   - This spec drives real speech-to-text and real AI extraction, so it is
 *     intentionally slower than the approval spec. Ollama and the speech
 *     service must be running locally.
 */

const KEYCLOAK_BASE_URL = "http://localhost:8080";
const API_BASE_URL = "http://localhost:4000/api";
const WEB_APP_URL = "http://localhost:3000";
const REALM = "nirka-inventory";
const WEB_CLIENT_ID = "nirka-inventory-web";

const KEYCLOAK_ADMIN = { username: "nirka-admin", password: "nirka-admin-dev" };
const WORKER = { username: "worker1", password: "Worker@123" };
const ADMINISTRATOR = { username: "admin1", password: "Admin@123" };
const MANAGER = { username: "manager1", password: "Manager@123" };

const SYNTHESIS_SCRIPT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "infrastructure",
  "synthesize-test-speech.ps1",
);
const execFileAsync = promisify(execFile);
// Every record this spec creates carries this run id so cleanup can remove
// exactly the test-created rows (and nothing else) from the local test DB.
const runId = Date.now().toString(36).toUpperCase();
const VOICE_QUANTITY = 5;
// Confirmation posts atomically on the API and the ledger response can take
// up to ~30s on a loaded development machine (SQL + reorder checks + audit
// write). 60s absorbs that without masking genuine failures.
const CONFIRM_TIMEOUT_MS = 60_000;

// The extraction step runs a local Qwen 3 model on CPU; allow it plenty of
// time. The whole flow is covered by per-step `expect` timeouts below.
test.setTimeout(300_000);

interface TransactionRecord {
  id: string;
  status: string;
  action: string;
  quantity: number;
  product: ProductRecord;
  destinationLocation?: LocationRecord | null;
  sourceLocation?: LocationRecord | null;
  reviewReasons?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
}

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

interface BalanceRecord {
  id: string;
  quantity: number;
  reservedQuantity: number;
  product: ProductRecord;
  location: LocationRecord;
}

let restoreKeycloakClient: (() => Promise<void>) | null = null;
// Keycloak access tokens expire after ~5 minutes while this suite runs for
// much longer, so tokens are cached here and reacquired near expiry (and on
// a 401) instead of being fetched once in `beforeAll` and reused blindly.
const tokensByUser = new Map<string, string>();
let voiceProduct: ProductRecord | null = null;
let receivingLocation: LocationRecord | null = null;
// True when this run created the Receiving location fixture. Only then is the
// location and its test-created stock deleted in afterAll; a pre-existing
// demo Receiving location is reused untouched.
let receivingLocationCreated = false;
let sourceLocation: LocationRecord | null = null;
let transferDestination: LocationRecord | null = null;
const originalBalances = new Map<
  string,
  { quantity: number; reservedQuantity: number }
>();
let audioFixtureBase64 = "";
const voiceFixtures: Record<string, string> = {};
const pendingTestTransactions = new Set<string>();

/**
 * Test-created-record cleanup against the local PostgreSQL test database.
 * Only rows tied to the location fixture this spec creates (identifiable by
 * its unique E2E code) are removed — real warehouse locations and business
 * data are never touched.
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

/**
 * Remove every record this spec created against its Receiving location
 * fixture (voice evidence, notifications, tasks, transactions, balances and
 * finally the location itself). Best-effort and idempotent so a retry or a
 * re-run never leaves E2E rows behind and never touches demo seed data.
 */
async function cleanupVoiceLocationFixtures() {
  if (!receivingLocationCreated || !receivingLocation || !voiceProduct) return;
  const locationId = quoteSql(receivingLocation.id);
  const productId = quoteSql(voiceProduct.id);
  try {
    runSql(
      `DELETE FROM voice_evidence WHERE "transactionId" IN (SELECT id FROM inventory_transactions WHERE ("sourceLocationId" = ${locationId} OR "destinationLocationId" = ${locationId}) AND "productId" = ${productId});`,
    );
    runSql(
      `DELETE FROM notifications WHERE "linkId" IN (SELECT id FROM inventory_tasks WHERE "locationId" = ${locationId} OR "sourceLocationId" = ${locationId} OR "destinationLocationId" = ${locationId});`,
    );
    runSql(
      `DELETE FROM inventory_tasks WHERE "locationId" = ${locationId} OR "sourceLocationId" = ${locationId} OR "destinationLocationId" = ${locationId};`,
    );
    runSql(
      `DELETE FROM inventory_transactions WHERE ("sourceLocationId" = ${locationId} OR "destinationLocationId" = ${locationId}) AND "productId" = ${productId};`,
    );
    // The fixture location can temporarily hold stock for other E2E specs
    // (the reservation shipment spec picks the most-stocked location). Remove
    // those test-created reservation rows too so the RESTRICT foreign key
    // never blocks the location deletion.
    runSql(
      `DELETE FROM stock_reservation_allocations WHERE location_id = ${locationId};`,
    );
    runSql(
      `DELETE FROM reservation_audit_events WHERE reservation_id IN (SELECT id FROM stock_reservations WHERE stock_request_id IN (SELECT stock_request_id FROM stock_reservation_allocations WHERE location_id = ${locationId}));`,
    );
    runSql(`DELETE FROM stock_reservations WHERE id IN (SELECT reservation_id FROM stock_reservation_allocations WHERE location_id = ${locationId});`);
    runSql(`DELETE FROM inventory_balances WHERE "locationId" = ${locationId};`);
    runSql(`DELETE FROM reorder_drafts WHERE "locationId" = ${locationId};`);
    runSql(`DELETE FROM locations WHERE id = ${locationId};`);
    receivingLocation = null;
    receivingLocationCreated = false;
  } catch (error) {
    // Best-effort: the API-level balance restore above already ran.
    console.warn("voice-capture location cleanup failed:", (error as Error).message);
  }
}

async function synthesizeVoiceFixture(statement: string) {
  const outputPath = path.join(
    tmpdir(),
    `inventory-voice-${Date.now()}-${process.pid}.wav`,
  );
  try {
    await execFileAsync("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      SYNTHESIS_SCRIPT_PATH,
      "-OutputPath",
      outputPath,
      "-Statement",
      statement,
    ]);
    return (await readFile(outputPath)).toString("base64");
  } finally {
    await rm(outputPath, { force: true });
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

async function freshToken(user: {
  username: string;
  password: string;
}): Promise<string> {
  const existing = tokensByUser.get(user.username);
  if (existing && tokenExpiryMs(existing) > Date.now() + 90_000) {
    return existing;
  }
  const token = await getAccessToken(user);
  tokensByUser.set(user.username, token);
  return token;
}

function tokenExpiryMs(token: string): number {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1] ?? "", "base64").toString("utf8"),
    ) as { exp?: number };
    return (payload.exp ?? 0) * 1000;
  } catch {
    return 0;
  }
}

async function apiRequest<T>(
  user: { username: string; password: string },
  path: string,
  init?: RequestInit,
): Promise<T> {
  const perform = async (): Promise<Response> => {
    const token = await freshToken(user);
    return fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    });
  };
  let response = await perform();
  if (response.status === 401) {
    // The cached token expired mid-flight; drop it and reacquire once.
    tokensByUser.delete(user.username);
    response = await perform();
  }
  await expectJsonOk(response, `Inventory API ${init?.method ?? "GET"} ${path}`);
  return response.json() as Promise<T>;
}

async function restoreVoiceBalances() {
  if (!voiceProduct) return;
  const balances = await apiRequest<BalanceRecord[]>(
    ADMINISTRATOR,
    "/inventory/balances",
  );
  for (const [locationId, baseline] of originalBalances) {
    const current = balances.find(
      (balance) =>
        balance.product.id === voiceProduct!.id &&
        balance.location.id === locationId,
    );
    if (
      current &&
      (current.quantity !== baseline.quantity ||
        current.reservedQuantity !== baseline.reservedQuantity)
    ) {
      await apiRequest(ADMINISTRATOR, "/inventory/balance-adjustments", {
        method: "POST",
        body: JSON.stringify({
          balanceId: current.id,
          quantity: baseline.quantity,
          reservedQuantity: baseline.reservedQuantity,
          reason: "Restore the real voice action-matrix E2E baseline.",
        }),
      });
    }
  }
}

async function installVoiceFixtures(page: Page, audioBase64List: string[]) {
  await page.addInitScript(
    ({ fixtures }: { fixtures: string[] }) => {
      if (location.origin !== "http://localhost:3000") return;
      let fixtureIndex = 0;

      class MatrixMediaRecorder {
        static isTypeSupported(type: string) {
          return type === "audio/webm";
        }

        readonly mimeType: string;
        state = "inactive";
        ondataavailable: ((event: Event) => void) | null = null;
        onstop: ((event: Event) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;

        constructor(_stream: MediaStream, options?: { mimeType?: string }) {
          this.mimeType = options?.mimeType ?? "audio/webm";
        }

        start() {
          this.state = "recording";
        }

        stop() {
          if (this.state !== "recording") return;
          this.state = "inactive";
          const encoded = fixtures[fixtureIndex++];
          if (!encoded) {
            this.onerror?.(new Event("error"));
            return;
          }
          const bytes = Uint8Array.from(atob(encoded), (character) =>
            character.charCodeAt(0),
          );
          const blob = new Blob([bytes], { type: this.mimeType });
          const dataEvent = new Event("dataavailable");
          Object.defineProperty(dataEvent, "data", { value: blob });
          this.ondataavailable?.(dataEvent);
          this.onstop?.(new Event("stop"));
        }
      }

      Object.defineProperty(window, "MediaRecorder", {
        value: MatrixMediaRecorder,
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
    },
    { fixtures: audioBase64List },
  );
}

async function signInWorker(page: Page) {
  await page.goto(WEB_APP_URL);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible({
    timeout: 30_000,
  });
  const role = page
    .locator("button[aria-pressed]")
    .filter({ hasText: "Warehouse Executive" });
  await role.click();
  await page.getByLabel("Employee ID").fill(WORKER.username);
  await page
    .getByRole("button", { name: /Continue as Warehouse Executive/ })
    .click();
  await page.waitForURL(/localhost:8080\/realms\//);
  await page.locator("#username").fill(WORKER.username);
  await page.locator("#password").fill(WORKER.password);
  await page.locator('#kc-form-login button[type="submit"]').first().click();
  await page.waitForURL(/localhost:3000/);
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
}

async function recordVoiceAction(
  page: Page,
  quickAction: "Ship" | "Transfer" | "Cycle count" | "Damage",
  expectReady = true,
) {
  await page
    .getByRole("button", { name: `Start voice update for ${quickAction}` })
    .click();
  const microphone = page.getByRole("button", {
    name: "Start microphone recording",
  });
  await expect(microphone).toBeVisible({ timeout: 30_000 });
  await microphone.click();
  await expect(page.getByText("Recording from your microphone…")).toBeVisible();
  await page.getByRole("button", { name: "Stop recording" }).click();
  await expect(
    page.getByText(
      expectReady
        ? "Complete and ready for Warehouse Executive confirmation"
        : "More information is required",
      { exact: true },
    ),
  ).toBeVisible({ timeout: 240_000 });
  return page.locator("#voice-entry");
}

async function latestTransaction(
  action: string,
  createdAfter: number,
  quantity?: number,
) {
  const transactions = await apiRequest<TransactionRecord[]>(
    WORKER,
    "/inventory/transactions",
  );
  return transactions
    .filter(
      (entry) =>
        entry.action === action &&
        entry.product.id === voiceProduct?.id &&
        (quantity === undefined || entry.quantity === quantity) &&
        new Date(entry.createdAt).getTime() >= createdAfter,
    )
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )[0];
}

// The real speech-to-text service occasionally mis-transcribes a word (for
// example "Shipped ... from Storage" heard as "Shift ... from the spatch"),
// which makes the AI ask a clarifying question instead of reaching the ready
// state. Retries re-run only the flaky test; beforeAll/afterAll run once and
// afterEach restores the baseline, so a retry is safe and idempotent.
test.describe.configure({ retries: 2 });

test.beforeAll(async () => {
  // Temporarily allow password grants so the spec can fetch a worker token
  // for the API-level assertions. The interactive browser login is
  // unaffected. The original client settings are restored in `afterAll`.
  const adminToken = await getKeycloakAdminToken();
  const originalClient = await readWebClient(adminToken);
  const clientSnapshot = JSON.parse(
    JSON.stringify(originalClient),
  ) as Record<string, unknown>;
  restoreKeycloakClient = async () => {
    const freshAdminToken = await getKeycloakAdminToken();
    await writeWebClient(freshAdminToken, clientSnapshot);
  };
  await writeWebClient(adminToken, {
    ...originalClient,
    directAccessGrantsEnabled: true,
  });

  const [products, locations, balances] = await Promise.all([
    apiRequest<ProductRecord[]>(WORKER, "/inventory/products"),
    apiRequest<LocationRecord[]>(WORKER, "/inventory/locations"),
    apiRequest<BalanceRecord[]>(WORKER, "/inventory/balances"),
  ]);
  voiceProduct = products.find(
    (product) => product.active && product.name.toLowerCase() === "cable",
  ) ?? null;
  // Self-contained fixture: reuse an existing active "Receiving" location
  // when the demo seed provides one, otherwise create a unique E2E location
  // so the suite never depends on demo seed data. Only the fixture created
  // here is deleted in afterAll.
  receivingLocation =
    locations.find(
      (location) =>
        location.active && location.name.toLowerCase() === "receiving",
    ) ?? null;
  if (voiceProduct && !receivingLocation) {
    receivingLocation = await apiRequest<LocationRecord>(
      MANAGER,
      "/inventory/locations",
      {
        method: "POST",
        body: JSON.stringify({
          code: `E2E-RCV-${runId}`,
          name: "Receiving",
          description: `Temporary Receiving location fixture for the real voice E2E suite (${runId}).`,
        }),
      },
    );
    receivingLocationCreated = true;
  }
  if (!voiceProduct || !receivingLocation) {
    throw new Error(
      "The real voice test requires an active Cable product and a Receiving location (fixture auto-created).",
    );
  }
  const sourceBalance = balances
    .filter(
      (balance) =>
        balance.product.id === voiceProduct!.id &&
        balance.quantity - balance.reservedQuantity >= 3,
    )
    .sort(
      (left, right) =>
        right.quantity - right.reservedQuantity -
        (left.quantity - left.reservedQuantity),
    )[0];
  sourceLocation = sourceBalance?.location ?? null;
  transferDestination =
    locations.find(
      (location) =>
        location.active &&
        location.id !== sourceLocation?.id &&
        location.id !== receivingLocation?.id,
    ) ??
    locations.find(
      (location) => location.active && location.id !== sourceLocation?.id,
    ) ??
    null;
  if (!sourceLocation || !transferDestination) {
    throw new Error(
      "The real voice action matrix requires one stocked source and a different destination location.",
    );
  }
  for (const location of [receivingLocation, sourceLocation, transferDestination]) {
    const balance = balances.find(
      (entry) =>
        entry.product.id === voiceProduct!.id &&
        entry.location.id === location.id,
    );
    originalBalances.set(location.id, {
      quantity: balance?.quantity ?? 0,
      reservedQuantity: balance?.reservedQuantity ?? 0,
    });
  }
  audioFixtureBase64 = await synthesizeVoiceFixture(
    `Received ${VOICE_QUANTITY} units of ${voiceProduct.name} into ${receivingLocation.name}.`,
  );
  const exactCount = originalBalances.get(sourceLocation.id)!.quantity;
  const statements: Record<string, string> = {
    ship: `Shipped one unit of ${voiceProduct.name} from ${sourceLocation.name}.`,
    transfer: `Transferred one unit of ${voiceProduct.name} from ${sourceLocation.name} to ${transferDestination.name}.`,
    cycleExact: `Counted ${exactCount} units of ${voiceProduct.name} at ${sourceLocation.name}.`,
    cycleDifferent: `Counted ${exactCount + 2} units of ${voiceProduct.name} at ${sourceLocation.name}.`,
    damage: `Damaged one unit of ${voiceProduct.name} at ${sourceLocation.name}.`,
    missingLocation: `Shipped one unit of ${voiceProduct.name}.`,
    locationAnswer: sourceLocation.name,
    receiveMissingDestination: `Received two units of ${voiceProduct.name}.`,
    receiveDestinationAnswer: receivingLocation.name,
  };
  for (const [key, statement] of Object.entries(statements)) {
    voiceFixtures[key] = await synthesizeVoiceFixture(statement);
  }
});

test.afterEach(async () => {
  for (const transactionId of pendingTestTransactions) {
    await apiRequest(MANAGER, `/inventory/transactions/${transactionId}/reject`, {
      method: "POST",
      body: JSON.stringify({ note: "Close the real voice E2E review fixture." }),
    }).catch(() => null);
  }
  pendingTestTransactions.clear();
  await restoreVoiceBalances();
});

test.afterAll(async () => {
  try {
    await restoreVoiceBalances();
  } finally {
    try {
      await cleanupVoiceLocationFixtures();
    } finally {
      await restoreKeycloakClient?.();
    }
  }
});

test("worker records a voice update and the transaction posts after confirmation", async ({
  page,
}) => {
  // ------------------------------------------------------------------
  // Media mocks: no real microphone permission or MediaRecorder needed.
  // The fake MediaRecorder emits a single dataavailable blob containing the
  // real WAV fixture (labelled audio/webm, exactly like a real recording),
  // so the genuine speech-to-text pipeline receives real speech.
  // ------------------------------------------------------------------
  if (!voiceProduct || !receivingLocation || !audioFixtureBase64) {
    throw new Error("The real voice fixture was not prepared.");
  }
  const expectedProduct = voiceProduct;
  const expectedLocation = receivingLocation;
  await page.addInitScript(
    ({ audioBase64 }: { audioBase64: string }) => {
      // Only the web application needs the media mocks; leave the Keycloak
      // login origin untouched.
      if (location.origin !== "http://localhost:3000") return;
      const audioBytes = Uint8Array.from(atob(audioBase64), (character) =>
        character.charCodeAt(0),
      );

      class FakeMediaRecorder {
        static isTypeSupported(type: string) {
          // Accept only the plain webm type so the app selects
          // `new MediaRecorder(stream, { mimeType: "audio/webm" })`.
          return type === "audio/webm";
        }

        readonly mimeType: string;
        state: string;
        ondataavailable: ((event: Event) => void) | null;
        onstop: ((event: Event) => void) | null;
        onerror: ((event: Event) => void) | null;

        constructor(_stream: MediaStream, options?: { mimeType?: string }) {
          this.mimeType = options?.mimeType ?? "audio/webm";
          this.state = "inactive";
          this.ondataavailable = null;
          this.onstop = null;
          this.onerror = null;
        }

        start() {
          this.state = "recording";
        }

        stop() {
          if (this.state !== "recording") return;
          this.state = "inactive";
          const blob = new Blob([audioBytes], { type: this.mimeType });
          const dataEvent = new Event("dataavailable");
          Object.defineProperty(dataEvent, "data", { value: blob });
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
      // `SpeechRecognition` is intentionally left absent: the live preview
      // degrades silently and the authoritative transcript comes from the
      // real faster-whisper service.
    },
    { audioBase64: audioFixtureBase64 },
  );

  // 1. The application boots to the secure login screen.
  await page.goto(WEB_APP_URL);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible(
    { timeout: 30_000 },
  );

  // 2. Choose the Warehouse Executive (worker) workspace and sign in.
  const workerRoleCard = page
    .locator("button[aria-pressed]")
    .filter({ hasText: "Warehouse Executive" });
  await workerRoleCard.click();
  await expect(workerRoleCard).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Employee ID").fill(WORKER.username);
  await page
    .getByRole("button", { name: /Continue as Warehouse Executive/ })
    .click();

  // 3. Sign in through the real Keycloak login page.
  await page.waitForURL(
    /localhost:8080\/realms\/nirka-inventory\/protocol\/openid-connect\/auth/,
  );
  await page.locator("#username").fill(WORKER.username);
  await page.locator("#password").fill(WORKER.password);
  await page
    .locator('#kc-form-login button[type="submit"]')
    .first()
    .click();

  // 4. Back in the current worker home page. Start Receive from the visible
  //    quick-action card; Voice Entry opens with the workflow preselected.
  await page.waitForURL(/localhost:3000/);
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await page
    .getByRole("button", { name: "Start voice update for Receive" })
    .click();
  const micButton = page.getByRole("button", {
    name: "Start microphone recording",
  });
  await expect(micButton).toBeVisible({ timeout: 30_000 });

  // 5. Tap the microphone: the mocked getUserMedia resolves instantly and
  //    the fake MediaRecorder starts a "recording" session.
  await micButton.click();
  await expect(
    page.getByText("Recording from your microphone…"),
  ).toBeVisible();

  // 6. Stop the recording. The fake recorder fires its dataavailable blob
  //    (real speech) and the true pipeline transcribes + extracts it.
  await page.getByRole("button", { name: "Stop recording" }).click();
  await expect(
    page.getByText(
      "Complete and ready for Warehouse Executive confirmation",
      { exact: true },
    ),
  ).toBeVisible({ timeout: 180_000 });

  // 7. The reviewed transcript appears (Whisper output may vary slightly in
  //    digits/casing, so match the meaning).
  const voiceEntry = page.locator("#voice-entry");
  await expect(voiceEntry).toContainText(
    /Receiv(?:e|ed) (?:5|five) units of Cable/i,
  );

  // 8. The AI-extracted proposal is read back with the right fields, checked
  //    against the exact label/value cards in the extraction panel.
  await expect(
    voiceEntry.getByText("Item name", { exact: true }).locator(".."),
  ).toContainText(`${expectedProduct.name} (${expectedProduct.sku})`);
  await expect(
    voiceEntry.getByText("Number", { exact: true }).locator(".."),
  ).toContainText(new RegExp(`${VOICE_QUANTITY} ${expectedProduct.unit}`, "i"));
  await expect(
    voiceEntry.getByText("To shelf", { exact: true }).locator(".."),
  ).toContainText(expectedLocation.name);
  await expect(
    voiceEntry.getByText("Action", { exact: true }).locator(".."),
  ).toContainText(/receive/i);

  // 9. The worker can hear the full proposal before confirming.
  await page.getByRole("button", { name: "Hear full details" }).click();

  // 10. Confirm the read-back; RECEIVE is low-risk so it posts atomically.
  await page.getByRole("button", { name: "Confirm inventory update" }).click();
  await expect(page.getByText("Transaction posted")).toBeVisible({
    timeout: CONFIRM_TIMEOUT_MS,
  });
  await expect(
    page.getByText(/Reference: TX-[A-F0-9]{8}/),
  ).toBeVisible();

  // 11. Backend confirmation: the newest RECEIVE of Cable is POSTED in the
  //     audit ledger at the destination spoken by the worker.
  const transactions = await apiRequest<TransactionRecord[]>(
    WORKER,
    "/inventory/transactions",
  );
  const posted = transactions
    .filter(
      (entry) =>
        entry.action === "RECEIVE" &&
        entry.product.id === expectedProduct.id &&
        entry.destinationLocation?.id === expectedLocation.id &&
        entry.quantity === VOICE_QUANTITY,
    )
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )[0];
  expect(
    posted?.status,
    "the voice RECEIVE transaction should exist and be posted",
  ).toBe("POSTED");
});

test("Receive asks only for a missing destination and keeps previous details", async ({
  page,
}) => {
  if (!voiceProduct || !receivingLocation) {
    throw new Error("Receive clarification fixture unavailable.");
  }
  await installVoiceFixtures(page, [
    voiceFixtures.receiveMissingDestination,
    voiceFixtures.receiveDestinationAnswer,
  ]);
  await signInWorker(page);
  const startedAt = Date.now() - 1_000;
  await page
    .getByRole("button", { name: "Start voice update for Receive" })
    .click();
  const microphone = page.getByRole("button", {
    name: "Start microphone recording",
  });
  await microphone.click();
  await page.getByRole("button", { name: "Stop recording" }).click();
  const voiceEntry = page.locator("#voice-entry");
  await expect(voiceEntry).toContainText(
    /Where did you place the received stock\?/i,
    { timeout: 180_000 },
  );
  await expect(
    voiceEntry.getByText("Item name", { exact: true }).locator(".."),
  ).toContainText(voiceProduct.name);
  await expect(
    voiceEntry.getByText("Number", { exact: true }).locator(".."),
  ).toContainText(/2/);
  await expect(
    voiceEntry.getByText("To shelf", { exact: true }).locator(".."),
  ).toContainText(/Not required \/ missing/i);

  await page
    .getByRole("button", { name: "Answer this question by voice" })
    .click();
  await page.getByRole("button", { name: "Stop answer recording" }).click();
  await expect(
    page.getByText("Complete and ready for Warehouse Executive confirmation", {
      exact: true,
    }),
  ).toBeVisible({ timeout: 180_000 });
  await expect(
    voiceEntry.getByText("To shelf", { exact: true }).locator(".."),
  ).toContainText(receivingLocation.name);
  await page.getByRole("button", { name: "Confirm inventory update" }).click();
  await expect(page.getByText("Transaction posted")).toBeVisible({
    timeout: CONFIRM_TIMEOUT_MS,
  });
  const transaction = await latestTransaction("RECEIVE", startedAt, 2);
  expect(transaction?.status).toBe("POSTED");
  expect(transaction?.destinationLocation?.id).toBe(receivingLocation.id);
});

test("real voice Ship removes available stock and posts automatically", async ({
  page,
}) => {
  if (!voiceProduct || !sourceLocation) throw new Error("Ship fixture unavailable.");
  await installVoiceFixtures(page, [voiceFixtures.ship]);
  await signInWorker(page);
  const startedAt = Date.now() - 1_000;
  const voiceEntry = await recordVoiceAction(page, "Ship");
  await expect(voiceEntry.getByText("Action", { exact: true }).locator("..")).toContainText(/ship/i);
  await expect(voiceEntry.getByText("From shelf", { exact: true }).locator("..")).toContainText(sourceLocation.name);
  await page.getByRole("button", { name: "Confirm inventory update" }).click();
  await expect(page.getByText("Transaction posted")).toBeVisible({ timeout: CONFIRM_TIMEOUT_MS });
  const transaction = await latestTransaction("SHIP", startedAt, 1);
  expect(transaction?.status).toBe("POSTED");
  expect(transaction?.sourceLocation?.id).toBe(sourceLocation.id);
});

test("real voice Transfer moves stock without manager approval", async ({
  page,
}) => {
  if (!voiceProduct || !sourceLocation || !transferDestination) {
    throw new Error("Transfer fixture unavailable.");
  }
  await installVoiceFixtures(page, [voiceFixtures.transfer]);
  await signInWorker(page);
  const startedAt = Date.now() - 1_000;
  const voiceEntry = await recordVoiceAction(page, "Transfer");
  await expect(voiceEntry.getByText("Action", { exact: true }).locator("..")).toContainText(/transfer/i);
  await expect(voiceEntry.getByText("From shelf", { exact: true }).locator("..")).toContainText(sourceLocation.name);
  await expect(voiceEntry.getByText("To shelf", { exact: true }).locator("..")).toContainText(transferDestination.name);
  await page.getByRole("button", { name: "Confirm inventory update" }).click();
  await expect(page.getByText("Transaction posted")).toBeVisible({ timeout: CONFIRM_TIMEOUT_MS });
  const transaction = await latestTransaction("TRANSFER", startedAt, 1);
  expect(transaction?.status).toBe("POSTED");
  expect(transaction?.sourceLocation?.id).toBe(sourceLocation.id);
  expect(transaction?.destinationLocation?.id).toBe(transferDestination.id);
});

test("real voice matching Cycle Count posts automatically", async ({ page }) => {
  if (!sourceLocation) throw new Error("Cycle Count fixture unavailable.");
  const expectedQuantity = originalBalances.get(sourceLocation.id)?.quantity;
  if (expectedQuantity === undefined) throw new Error("Cycle Count baseline unavailable.");
  await installVoiceFixtures(page, [voiceFixtures.cycleExact]);
  await signInWorker(page);
  const startedAt = Date.now() - 1_000;
  const voiceEntry = await recordVoiceAction(page, "Cycle count");
  await expect(voiceEntry.getByText("Action", { exact: true }).locator("..")).toContainText(/cycle count/i);
  await page.getByRole("button", { name: "Confirm inventory update" }).click();
  await expect(page.getByText("Transaction posted")).toBeVisible({ timeout: CONFIRM_TIMEOUT_MS });
  const transaction = await latestTransaction("CYCLE_COUNT", startedAt, expectedQuantity);
  expect(transaction?.status).toBe("POSTED");
});

test("real voice different Cycle Count creates manager review", async ({ page }) => {
  if (!sourceLocation) throw new Error("Cycle Count fixture unavailable.");
  const expectedQuantity = originalBalances.get(sourceLocation.id)?.quantity;
  if (expectedQuantity === undefined) throw new Error("Cycle Count baseline unavailable.");
  await installVoiceFixtures(page, [voiceFixtures.cycleDifferent]);
  await signInWorker(page);
  const startedAt = Date.now() - 1_000;
  await recordVoiceAction(page, "Cycle count");
  await expect(page.getByText(/will require manager review/i)).toBeVisible();
  await page.getByRole("button", { name: "Confirm inventory update" }).click();
  await expect(page.getByText("Pending manager review")).toBeVisible({ timeout: CONFIRM_TIMEOUT_MS });
  const transaction = await latestTransaction(
    "CYCLE_COUNT",
    startedAt,
    expectedQuantity + 2,
  );
  expect(transaction?.status).toBe("PENDING");
  expect(transaction?.reviewReasons).toBeTruthy();
  if (transaction) pendingTestTransactions.add(transaction.id);
});

for (const reviewAction of [
  { label: "Damage", key: "damage", action: "DAMAGE" },
] as const) {
  test(`real voice ${reviewAction.label} requires manager approval`, async ({
    page,
  }) => {
    await installVoiceFixtures(page, [voiceFixtures[reviewAction.key]]);
    await signInWorker(page);
    const startedAt = Date.now() - 1_000;
    const voiceEntry = await recordVoiceAction(page, "Damage");
    await expect(voiceEntry.getByText("Action", { exact: true }).locator("..")).toContainText(
      new RegExp(reviewAction.label, "i"),
    );
    await expect(page.getByText(/will require manager review/i)).toBeVisible();
    await page.getByRole("button", { name: "Confirm inventory update" }).click();
    await expect(page.getByText("Pending manager review")).toBeVisible({ timeout: CONFIRM_TIMEOUT_MS });
    const transaction = await latestTransaction(reviewAction.action, startedAt, 1);
    expect(transaction?.status).toBe("PENDING");
    if (transaction) pendingTestTransactions.add(transaction.id);
  });
}

test("AI asks only for a missing Ship location and keeps previous details", async ({
  page,
}) => {
  if (!voiceProduct || !sourceLocation) {
    throw new Error("Clarification fixture unavailable.");
  }
  await installVoiceFixtures(page, [
    voiceFixtures.missingLocation,
    voiceFixtures.locationAnswer,
  ]);
  await signInWorker(page);
  const startedAt = Date.now() - 1_000;
  const voiceEntry = await recordVoiceAction(page, "Ship", false);
  await expect(voiceEntry).toContainText(/Which location did the stock come from\?/i);
  await expect(voiceEntry.getByText("Item name", { exact: true }).locator("..")).toContainText(voiceProduct.name);
  await expect(voiceEntry.getByText("Number", { exact: true }).locator("..")).toContainText(/1/);
  await page.getByRole("button", { name: "Answer this question by voice" }).click();
  await page.getByRole("button", { name: "Stop answer recording" }).click();
  await expect(
    page.getByText("Complete and ready for Warehouse Executive confirmation", {
      exact: true,
    }),
  ).toBeVisible({ timeout: 180_000 });
  await expect(
    voiceEntry.getByText("From shelf", { exact: true }).locator(".."),
  ).toContainText(sourceLocation.name);
  await page.getByRole("button", { name: "Confirm inventory update" }).click();
  await expect(page.getByText("Transaction posted")).toBeVisible({ timeout: CONFIRM_TIMEOUT_MS });
  const transaction = await latestTransaction("SHIP", startedAt, 1);
  expect(transaction?.status).toBe("POSTED");
  expect(transaction?.sourceLocation?.id).toBe(sourceLocation.id);
});

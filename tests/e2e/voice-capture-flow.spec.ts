import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
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
 * The fixture `fixtures/warehouse-statement.wav` is a real 22 kHz mono
 * recording that says "Received five units of item four zero two at shelf B
 * from supplier X." — it matches the seeded catalogue exactly (Blue Widget
 * ITEM-402, Shelf B) and is validated by the same phrase the speech
 * verification scripts use.
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

const FIXTURE_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "warehouse-statement.wav",
);

// The extraction step runs a local Qwen 3 model on CPU; allow it plenty of
// time. The whole flow is covered by per-step `expect` timeouts below.
test.setTimeout(300_000);

interface TransactionRecord {
  id: string;
  status: string;
  action: string;
  quantity: number;
  product: { name: string };
  createdAt: string;
}

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
});

test.afterAll(async () => {
  await restoreKeycloakClient?.();
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
  const fixtureBase64 = readFileSync(FIXTURE_PATH).toString("base64");
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
    { audioBase64: fixtureBase64 },
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

  // 4. Back in the worker dashboard. Open the dedicated Voice entry page
  //    (the sidebar navigation is always visible for workers).
  await page.waitForURL(/localhost:3000/);
  await expect(page.locator("#worker-overview")).toBeVisible();
  await page.getByRole("button", { name: "Voice entry", exact: true }).first().click();
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
  await expect(voiceEntry).toContainText(/Received .*item 402.*shelf B/i);

  // 8. The AI-extracted proposal is read back with the right fields, checked
  //    against the exact label/value cards in the extraction panel.
  await expect(
    voiceEntry.getByText("Item name", { exact: true }).locator(".."),
  ).toContainText("Blue Widget (ITEM-402)");
  await expect(
    voiceEntry.getByText("Number", { exact: true }).locator(".."),
  ).toContainText(/5 Units?/i);
  await expect(
    voiceEntry.getByText("To shelf", { exact: true }).locator(".."),
  ).toContainText("Shelf B");
  await expect(
    voiceEntry.getByText("Action", { exact: true }).locator(".."),
  ).toContainText(/receive/i);

  // 9. The worker can hear the full proposal before confirming.
  await page.getByRole("button", { name: "Hear full details" }).click();

  // 10. Confirm the read-back; RECEIVE is low-risk so it posts atomically.
  await page.getByRole("button", { name: "Confirm inventory update" }).click();
  await expect(page.getByText("Transaction posted")).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByText(/Reference: TX-[A-F0-9]{8}/),
  ).toBeVisible();

  // 11. Backend confirmation: the newest RECEIVE of 5 Blue Widgets is POSTED
  //     in the audit ledger.
  const workerToken = await getAccessToken(WORKER);
  const transactions = await apiRequest<TransactionRecord[]>(
    workerToken,
    "/inventory/transactions",
  );
  const posted = transactions
    .filter(
      (entry) =>
        entry.action === "RECEIVE" &&
        entry.product.name === "Blue Widget" &&
        entry.quantity === 5,
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

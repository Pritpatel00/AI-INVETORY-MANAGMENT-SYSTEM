import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the secure inventory application shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Inventory Management \| Voice Management<\/title>/i);
  assert.match(html, /Checking secure session/);
  assert.match(html, /Connecting to Inventory Management identity services/);
  assert.match(html, /lucide-shield-check/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("connects browser recording and controlled AI extraction APIs", async () => {
  const [
    page,
    layout,
    inventoryApp,
    apiClient,
    aiService,
    notificationService,
    offlineQueue,
    serviceWorker,
    manifest,
  ] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(
      new URL(
        "../src/features/inventory/InventoryApp.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../src/features/inventory/api/inventory-api.ts",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL("../services/api/src/ai/ai.service.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../services/api/src/notifications/notifications.service.ts",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../src/features/inventory/offline/offline-queue.ts",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
  ]);

  assert.match(page, /import InventoryApp/);
  assert.match(page, /<InventoryApp \/>/);
  assert.match(layout, /title:\s*"Inventory Management \| Voice Management"/);
  assert.match(layout, /manifest:\s*"\/manifest\.webmanifest"/);
  assert.match(inventoryApp, /navigator\.mediaDevices\.getUserMedia/);
  assert.match(inventoryApp, /new MediaRecorder\(stream/);
  assert.match(inventoryApp, /await transcribeAudio\(recording\)/);
  assert.match(
    inventoryApp,
    /await runExtraction\(result\.text\.trim\(\), result\.evidenceId\)/,
  );
  assert.match(inventoryApp, /await extractInventoryDetails/);
  assert.match(inventoryApp, /Extract inventory details/);
  assert.match(inventoryApp, /Answer this question by voice/);
  assert.match(inventoryApp, /SpeechSynthesisUtterance/);
  assert.match(inventoryApp, /language: "en"/);
  assert.match(inventoryApp, /Clarification answer to/);
  assert.match(inventoryApp, /clarificationQuestions\[0\]/);
  assert.match(inventoryApp, /Raw speech:/);
  assert.match(inventoryApp, /AI understood:/);
  assert.match(inventoryApp, /Confirm inventory update/);
  assert.match(inventoryApp, /Hear full details/);
  assert.match(inventoryApp, /Approve and post/);
  assert.match(inventoryApp, /Request recount/);
  assert.match(inventoryApp, /Reject/);
  assert.match(inventoryApp, /Reorder requests & purchase orders/);
  assert.ok(
    inventoryApp.indexOf('id="purchase-order-drafts"') >
      inventoryApp.indexOf("function ManagerDashboard"),
    "Reorder requests must be rendered inside the Manager dashboard.",
  );
  assert.match(inventoryApp, /scrollIntoView/);
  assert.match(inventoryApp, /Refresh drafts/);
  assert.match(inventoryApp, /removed automatically/);
  assert.doesNotMatch(inventoryApp, /Queue email/);
  assert.doesNotMatch(inventoryApp, /Retry email/);
  assert.match(inventoryApp, /Email sent/);
  assert.match(inventoryApp, /Delivery failed/);
  assert.match(inventoryApp, /navigator\.serviceWorker\.register\("\/sw\.js"\)/);
  assert.match(inventoryApp, /navigator\.onLine/);
  assert.match(inventoryApp, /Offline mode is active/);
  assert.match(inventoryApp, /Update saved safely on this device/);
  assert.match(aiService, /"shelby"/);
  assert.match(aiService, /inferLocationFromClarification/);
  assert.match(inventoryApp, /could not match it confidently/);
  assert.match(inventoryApp, /No inventory stock was changed/);
  assert.match(apiClient, /\/speech\/transcribe/);
  assert.match(apiClient, /\/ai\/extract-inventory/);
  assert.match(apiClient, /createPendingInventoryTransaction/);
  assert.match(apiClient, /confirmInventoryTransaction/);
  assert.match(apiClient, /approveInventoryTransaction/);
  assert.match(apiClient, /requestInventoryRecount/);
  assert.match(apiClient, /refreshReorderDrafts/);
  assert.match(apiClient, /approveReorderDraft/);
  assert.match(apiClient, /queueReorderEmail/);
  assert.match(apiClient, /retryReorderEmail/);
  assert.match(apiClient, /Authorization:\s*`Bearer \$\{accessToken\}`/);
  assert.match(notificationService, /new Queue/);
  assert.match(notificationService, /new Worker/);
  assert.match(notificationService, /nodemailer\.createTransport/);
  assert.match(notificationService, /attempts:\s*3/);
  assert.match(notificationService, /EmailDeliveryStatus\.SENT/);
  assert.match(notificationService, /EmailDeliveryStatus\.FAILED/);
  assert.match(offlineQueue, /indexedDB\.open/);
  assert.match(offlineQueue, /clientRequestId/);
  assert.match(offlineQueue, /synchronizeOfflineInventoryUpdates/);
  assert.match(offlineQueue, /confirmInventoryTransaction/);
  assert.match(serviceWorker, /caches\.open/);
  assert.match(serviceWorker, /request\.mode === "navigate"/);
  assert.match(manifest, /"display": "standalone"/);
  assert.match(manifest, /"start_url": "\/"/);
});

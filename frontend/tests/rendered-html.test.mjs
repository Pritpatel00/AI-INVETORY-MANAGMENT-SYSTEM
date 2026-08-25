import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: entry } = await import(workerUrl.href);

  // vinext's App Router build can export either a bare handler
  // (handler(request) → Response) or a Worker-style object
  // ({ fetch(request, env, ctx) → Response }). Accept both so the test is
  // independent of the hosting target (Cloudflare plugin vs. plain build).
  const handler = typeof entry === "function" ? entry : entry.fetch;

  return handler(
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
    executiveDashboard,
    managerDashboard,
    administratorDashboard,
    apiClient,
    aiService,
    offlineQueue,
    serviceWorker,
    manifest,
    networkStatusHook,
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
        "../src/features/inventory/warehouse-executive/ExecutiveDashboard.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../src/features/inventory/manager/ManagerDashboard.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../src/features/inventory/administrator/AdministratorDashboard.tsx",
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
      new URL("../../backend/api/src/ai/ai.service.ts", import.meta.url),
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
    readFile(
      new URL(
        "../src/features/inventory/hooks/useNetworkStatus.ts",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);

  assert.match(page, /import InventoryApp/);
  assert.match(page, /<InventoryApp \/>/);
  assert.match(layout, /title:\s*"Inventory Management \| Voice Management"/);
  assert.match(layout, /manifest:\s*"\/manifest\.webmanifest"/);
  assert.match(executiveDashboard, /navigator\.mediaDevices\.getUserMedia/);
  assert.match(executiveDashboard, /new MediaRecorder\(stream/);
  assert.match(executiveDashboard, /await transcribeAudio\(recording\)/);
  assert.match(
    executiveDashboard,
    /await runExtraction\(result\.text\.trim\(\), result\.evidenceId\)/,
  );
  assert.match(executiveDashboard, /await extractInventoryDetails/);
  assert.match(executiveDashboard, /AI extraction time/);
  assert.match(executiveDashboard, /performance\.now\(\)/);
  assert.match(executiveDashboard, /Extract inventory details/);
  assert.match(executiveDashboard, /Answer this question by voice/);
  assert.match(executiveDashboard, /SpeechSynthesisUtterance/);
  assert.match(executiveDashboard, /language: "en"/);
  assert.match(executiveDashboard, /Clarification answer to/);
  assert.match(executiveDashboard, /clarificationQuestions\[0\]/);
  assert.match(executiveDashboard, /Raw speech:/);
  assert.match(executiveDashboard, /AI understood:/);
  assert.match(executiveDashboard, /Confirm inventory update/);
  assert.match(executiveDashboard, /Hear full details/);
  assert.match(managerDashboard, /Approve and post/);
  assert.match(managerDashboard, /Request recount/);
  assert.match(managerDashboard, /Reject/);
  assert.match(managerDashboard, /Purchase Items/);
  assert.match(administratorDashboard, /id="admin-system-health"/);
  assert.match(administratorDashboard, /Last checked:/);
  assert.match(administratorDashboard, /refreshHealth/);
  assert.match(administratorDashboard, /healthTone/);
  assert.match(administratorDashboard, /Checking\.\.\./);
  assert.match(administratorDashboard, /Refresh health/);
  assert.match(
    administratorDashboard,
    /balance\.quantity > 0 \|\| balance\.reservedQuantity > 0/,
  );
  assert.match(administratorDashboard, /Stocked items · View/);
  assert.match(
    administratorDashboard,
    /No stock is currently stored in this location\./,
  );
  assert.match(administratorDashboard, /Last checked ·/);
  assert.match(administratorDashboard, /Online/);
  assert.match(administratorDashboard, /Degraded/);
  assert.match(administratorDashboard, /Offline/);
  assert.match(administratorDashboard, /System health data unavailable/);
  assert.doesNotMatch(administratorDashboard, /Notification queue/);
  assert.doesNotMatch(administratorDashboard, /Valkey/);
  assert.ok(
    managerDashboard.indexOf('id="purchase-items"') >
      managerDashboard.indexOf("export function ManagerDashboard"),
    "Purchase Items must be rendered inside the Manager dashboard.",
  );
  assert.match(executiveDashboard, /scrollIntoView/);
  assert.match(managerDashboard, /Refresh stock/);
  assert.match(managerDashboard, /Search item or SKU/);
  assert.match(managerDashboard, /Shortage severity/);
  assert.match(managerDashboard, /Out of stock/);
  assert.match(managerDashboard, /No products currently require purchasing\./);
  assert.match(managerDashboard, /Available quantity/);
  assert.match(managerDashboard, /Safety stock/);
  assert.match(managerDashboard, /Purchase quantity/);
  assert.doesNotMatch(managerDashboard, /Supplier/);
  assert.doesNotMatch(managerDashboard, /Queue email/);
  assert.doesNotMatch(managerDashboard, /Retry email/);
  assert.doesNotMatch(managerDashboard, /Email sent/);
  assert.doesNotMatch(managerDashboard, /Delivery failed/);
  assert.doesNotMatch(managerDashboard, /Send to supplier/);
  assert.doesNotMatch(managerDashboard, /Approve purchase/);
  assert.doesNotMatch(managerDashboard, /Cancel purchase/);
  assert.doesNotMatch(managerDashboard, /Email Pending/);
  assert.match(networkStatusHook, /navigator\.serviceWorker\.register\("\/sw\.js"\)/);
  assert.match(networkStatusHook, /navigator\.onLine/);
  assert.match(inventoryApp, /Offline mode is active/);
  assert.match(executiveDashboard, /Update saved safely on this device/);
  assert.match(aiService, /"shelby"/);
  assert.match(aiService, /inferLocationFromClarification/);
  assert.match(executiveDashboard, /could not match it confidently/);
  assert.match(executiveDashboard, /No inventory stock was changed/);
  assert.match(apiClient, /\/speech\/transcribe/);
  assert.match(apiClient, /\/ai\/extract-inventory/);
  assert.match(apiClient, /createPendingInventoryTransaction/);
  assert.match(apiClient, /confirmInventoryTransaction/);
  assert.match(apiClient, /approveInventoryTransaction/);
  assert.match(apiClient, /requestInventoryRecount/);
  assert.match(apiClient, /refreshReorderDrafts/);
  assert.doesNotMatch(apiClient, /approveReorderDraft/);
  assert.doesNotMatch(apiClient, /cancelReorderDraft/);
  assert.doesNotMatch(apiClient, /queueReorderEmail/);
  assert.doesNotMatch(apiClient, /retryReorderEmail/);
  assert.match(apiClient, /Authorization:\s*`Bearer \$\{token\}`/);
  assert.match(apiClient, /withAuthRetry/);
  assert.match(apiClient, /updateToken\(60\)/);
  assert.match(offlineQueue, /indexedDB\.open/);
  assert.match(offlineQueue, /clientRequestId/);
  assert.match(offlineQueue, /synchronizeOfflineInventoryUpdates/);
  assert.match(offlineQueue, /confirmInventoryTransaction/);
  assert.match(serviceWorker, /caches\.open/);
  assert.match(serviceWorker, /request\.mode === "navigate"/);
  assert.match(manifest, /"display": "standalone"/);
  assert.match(manifest, /"start_url": "\/"/);
});

/**
 * TEMPORARY manual UI audit harness — not part of the automated suite.
 *
 * Drives the real worker/manager/administrator UI in a browser with stubbed
 * API responses (no PostgreSQL/Keycloak/Ollama required) and reports, for every
 * navigation target, what actually rendered. It fails loudly when a page value
 * leads to an empty screen, which is how the unmapped "Active items" / "My
 * history" quick-toolbar entries were found.
 *
 * It contains no credentials and talks only to localhost. Delete after review.
 *
 * Run with the browser-automation skill:
 *   node <skill-dir>/browser.mjs http://localhost:3000 --script ./tests/manual-ui-audit.mjs
 */
const WEB = "http://localhost:3000";

const products = [
  { id: "p1", sku: "BEV-1001", name: "Espresso Beans 1kg", unit: "bag", safetyStock: 40, reorderQuantity: 120, controlled: false },
  { id: "p2", sku: "PKG-2204", name: "Corrugated Box 40x30", unit: "box", safetyStock: 200, reorderQuantity: 500, controlled: false },
  { id: "p3", sku: "CLN-3310", name: "Industrial Degreaser 5L", unit: "can", safetyStock: 25, reorderQuantity: 60, controlled: true },
];
const locations = [
  { id: "l1", code: "A-01", name: "Main Warehouse Aisle 1", active: true },
  { id: "l2", code: "R-01", name: "Receiving Dock", active: true },
];
const balances = [
  { id: "b1", quantity: 12, reservedQuantity: 0, product: products[0], location: locations[0] },
  { id: "b2", quantity: 18, reservedQuantity: 0, product: products[2], location: locations[1] },
];
const transactions = [
  {
    id: "76b1c1f0-1111-4444-8888-aaaaaaaaaaaa",
    action: "CYCLE_COUNT", status: "RECOUNT_REQUESTED", quantity: 60, createdAt: new Date().toISOString(),
    referenceNumber: "COUNT-4412", product: products[1], destinationLocation: locations[1],
    createdBy: { displayName: "Warehouse Executive" }, _count: { evidence: 0 },
  },
  {
    id: "76b1c1f0-2222-4444-8888-bbbbbbbbbbbb",
    action: "RECEIVE", status: "POSTED", quantity: 12, createdAt: new Date().toISOString(),
    referenceNumber: "RECEIPT-4413", product: products[0], destinationLocation: locations[0],
    createdBy: { displayName: "Warehouse Executive" }, _count: { evidence: 0 },
  },
];
const tasks = [
  {
    id: "t1", type: "CYCLE_COUNT", priority: "HIGH", status: "OPEN", title: "Cycle count · Espresso Beans 1kg",
    description: "Blind count of aisle 1 shelf A.", dueAt: new Date(Date.now() + 5 * 3600_000).toISOString(),
    createdAt: new Date().toISOString(), quantity: null, product: products[0], location: locations[0],
    assignedTo: { id: "u-worker", employeeId: "worker1", displayName: "Warehouse Executive" },
  },
];
const userPayload = (role) => ({
  id: "u-" + role.toLowerCase(),
  employeeId: role.toLowerCase() + "1",
  email: `${role.toLowerCase()}1@example.invalid`,
  displayName: role === "ADMINISTRATOR" ? "System Administrator" : role === "MANAGER" ? "Inventory Manager" : "Warehouse Executive",
  role, active: true, mustChangePassword: false, localAuthEnabled: true, authProvider: "local",
});

function payload(pathname) {
  if (pathname.endsWith("/auth/refresh")) {
    return { accessToken: "audit-token", tokenType: "Bearer", expiresIn: 900, user: userPayload(globalThis.__role ?? "WORKER") };
  }
  if (pathname.endsWith("/auth/csrf")) return { csrfToken: "audit-csrf-token-0123456789abcdef" };
  if (pathname.endsWith("/auth/users")) return [];
  if (pathname.endsWith("/auth/user-audit")) return [];
  if (pathname.endsWith("/health/detailed")) return { status: "healthy", checkedAt: new Date().toISOString(), services: [] };
  if (pathname.endsWith("/inventory/products")) return globalThis.__empty ? [] : products;
  if (pathname.endsWith("/inventory/locations")) return locations;
  if (pathname.endsWith("/inventory/balances")) return globalThis.__empty ? [] : balances;
  if (pathname.endsWith("/inventory/transactions")) return transactions;
  if (pathname.includes("/inventory/reorder-drafts")) return [];
  if (pathname.endsWith("/tasks")) return tasks;
  if (pathname.endsWith("/tasks/assignees")) return [{ id: "u-worker", employeeId: "worker1", displayName: "Warehouse Executive", openTaskCount: 1 }];
  if (pathname.includes("/tasks/cycle-count-plans")) return [];
  if (pathname.includes("/discrepancies/summary")) return { total: 0, awaitingReview: 0, criticalOpen: 0, resolvedToday: 0, missingQuantity: 0, extraQuantity: 0, bySeverity: {}, byStatus: {} };
  if (pathname.includes("/discrepancies")) return { items: [], total: 0, page: 1, pageSize: 20, hasMore: false };
  if (pathname.includes("/notifications/unread-count")) return 0;
  if (pathname.includes("/notifications")) return [];
  return [];
}

/** What is actually visible on screen, and what the page heading says. */
async function probe(page) {
  return page.evaluate(() => {
    const visible = (el) => el instanceof HTMLElement && el.offsetParent !== null && el.getBoundingClientRect().height > 0;
    const stage = document.querySelector("#dashboard-content");
    const sections = stage
      ? Array.from(stage.querySelectorAll("[id]")).filter(visible).map((el) => el.id).slice(0, 12)
      : [];
    const text = stage ? (stage.innerText || "").replace(/\s+/g, " ").trim() : "";
    return {
      fullText: text.slice(0, 4000),
      heading: document.querySelector("h1")?.innerText?.trim() ?? null,
      breadcrumb: document.querySelector("nav[aria-label='Breadcrumb']")?.innerText?.replace(/\s+/g, " ") ?? null,
      visibleSections: sections,
      contentChars: text.length,
      contentHead: text.slice(0, 110),
      pageHooks: Array.from(document.querySelectorAll("[data-page]")).map((el) => el.getAttribute("data-page")),
      hasTaskScreen: Boolean(document.querySelector(".worker-task-screen")),
      hasHistoryScreen: Boolean(document.querySelector(".worker-history-screen")),
      hasEmptyLookingStage: Boolean(stage) && text.length < 60,
      activeNav: Array.from(document.querySelectorAll("aside button[aria-current='page']")).map((el) => el.innerText.trim()),
    };
  });
}

function expect(problems, label, condition, detail) {
  if (!condition) problems.push(`${label}: ${detail}`);
}

export default async function run(page) {
  const hits = [];
  const problems = [];
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text().slice(0, 160));
  });
  page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${String(error).slice(0, 160)}`));

  await page.route("**/localhost:4000/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    hits.push(`${request.method()} ${url.pathname}`);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      },
      body: JSON.stringify(payload(url.pathname)),
    });
  });

  globalThis.__role = "WORKER";
  await page.setViewportSize({ width: 1440, height: 940 });
  await page.goto(WEB, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Overview" }).first().waitFor({ timeout: 30000 });

  const report = { worker: {}, manager: {}, administrator: {}, problems, consoleErrors };

  report.worker.overview = await probe(page);

  // The quick toolbar lives on the live overview and every entry must resolve.
  const quickLabels = ["Voice entry", "Task queue", "Active items", "History", "My transactions", "Cycle counts", "Posted today", "Settings", "Overview"];
  report.worker.quickToolbarButtons = await page.locator("#worker-overview-command button").count();
  expect(problems, "quick toolbar", report.worker.quickToolbarButtons === quickLabels.length, `expected ${quickLabels.length} buttons, found ${report.worker.quickToolbarButtons}`);

  const expectations = {
    "Voice entry": /voice|record|microphone/i,
    "Task queue": /task/i,
    "Active items": /BEV-1001/,
    History: /history|pending|completed/i,
    "My transactions": /detailed page/i,
    "Cycle counts": /detailed page/i,
    "Posted today": /detailed page/i,
    Settings: /settings|microphone/i,
    Overview: /jump to any tool in one tap/i,
  };

  // Every target must render its own screen — not merely a matching title.
  const screenChecks = {
    "Voice entry": (r) => r.visibleSections.includes("voice-entry"),
    "Task queue": (r) => r.hasTaskScreen,
    "Active items": (r) => r.pageHooks.includes("Active items"),
    History: (r) => r.hasHistoryScreen,
    "My transactions": (r) => r.visibleSections.includes("worker-metric-details"),
    "Cycle counts": (r) => r.visibleSections.includes("worker-metric-details"),
    "Posted today": (r) => r.visibleSections.includes("worker-metric-details"),
    Settings: (r) => /microphone/i.test(r.fullText),
    Overview: (r) => r.visibleSections.includes("worker-overview-command"),
  };

  for (const label of quickLabels) {
    const button = page.locator("#worker-overview-command button", { hasText: label }).first();
    if (!(await button.count())) {
      expect(problems, `quick:${label}`, false, "button not found in #worker-overview-command");
      continue;
    }
    await button.click();
    await page.waitForTimeout(500);
    const result = await probe(page);
    report.worker[`quick:${label}`] = result;
    expect(problems, `quick:${label}`, !result.hasEmptyLookingStage, `screen rendered blank (chars=${result.contentChars})`);
    expect(problems, `quick:${label}`, expectations[label].test(result.fullText), `unexpected content: ${result.contentHead}`);
    expect(problems, `quick:${label} screen`, screenChecks[label](result), `wrong screen rendered (sections=${result.visibleSections.join(",")} hooks=${result.pageHooks.join(",")} task=${result.hasTaskScreen} history=${result.hasHistoryScreen})`);
    report.worker[`quick:${label}:apiCalls`] = hits.length;
    if (process.env.AUDIT_SHOTS && label === "Voice entry") {
      await page.screenshot({ path: `${process.env.AUDIT_SHOTS}/voice-entry-desktop.png`, fullPage: false });
    }
    await page.locator("aside").getByRole("button", { name: /^Overview/ }).first().click();
    await page.waitForTimeout(350);
  }

  // Sidebar destinations, including the new catalogue entry.
  for (const label of ["Overview", "Task queue", "Active items", "History", "Settings"]) {
    const nav = page.locator("aside").getByRole("button", { name: new RegExp(`^${label}`) }).first();
    if (!(await nav.count())) {
      expect(problems, `sidebar:${label}`, false, "sidebar entry missing");
      continue;
    }
    await nav.click();
    await page.waitForTimeout(500);
    report.worker[`sidebar:${label}`] = await probe(page);
  }

  // Back buttons on the pages that provide one.
  await page.locator("aside").getByRole("button", { name: /^Active items/ }).first().click();
  await page.waitForTimeout(400);
  const activeBack = page.getByRole("button", { name: "Back to Overview" }).first();
  expect(problems, "Active items back button", (await activeBack.count()) > 0, "Back to Overview missing");
  if (await activeBack.count()) {
    await activeBack.click();
    await page.waitForTimeout(450);
    report.worker["active-items-back"] = await probe(page);
    expect(problems, "active-items-back", /jump to any tool in one tap/i.test(report.worker["active-items-back"].fullText), `did not return to overview: ${report.worker["active-items-back"].contentHead}`);
    expect(problems, "active-items-back title", report.worker["active-items-back"].heading === "Overview", `page title should read Overview, got ${report.worker["active-items-back"].heading}`);
  }

  // Pending filter + confirmation dialog on History: opens as a dialog and Esc closes it.
  await page.locator("aside").getByRole("button", { name: /^History/ }).first().click();
  await page.waitForTimeout(450);
  const pendingFilter = page.getByRole("group", { name: /filter transactions/i }).getByRole("button", { name: /pending/i }).first();
  if (await pendingFilter.count()) {
    await pendingFilter.click();
    await page.waitForTimeout(350);
  }
  const deleteButton = page.getByRole("button", { name: /Delete pending/i }).first();
  report.worker.historyDeleteButtons = await deleteButton.count();
  if (await deleteButton.count()) {
    await deleteButton.click();
    await page.waitForTimeout(300);
    const dialog = page.getByRole("dialog");
    report.worker.confirmDialogVisible = await dialog.isVisible();
    expect(problems, "history confirm dialog", report.worker.confirmDialogVisible, "dialog did not open");
    report.worker.confirmDialogFocusInside = await page.evaluate(() => {
      const active = document.activeElement;
      const dialogEl = document.querySelector("[role='dialog']");
      return Boolean(active && dialogEl && (dialogEl === active || dialogEl.contains(active)));
    });
    expect(problems, "history confirm dialog focus", report.worker.confirmDialogFocusInside, "focus did not move into the dialog");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    report.worker.confirmDialogClosedByEscape = !(await dialog.isVisible().catch(() => false));
    expect(problems, "history confirm dialog escape", report.worker.confirmDialogClosedByEscape, "Escape did not close the dialog");
  } else {
    expect(problems, "history pending list", false, "no pending delete button rendered");
  }

  // Keyboard reachability + visible focus ring on the quick toolbar (Tab only).
  await page.locator("aside").getByRole("button", { name: /^Overview/ }).first().click();
  await page.waitForTimeout(400);
  await page.evaluate(() => document.body.focus());
  let focusReport = null;
  for (let step = 0; step < 40 && !focusReport; step += 1) {
    await page.keyboard.press("Tab");
    focusReport = await page.evaluate(() => {
      const el = document.activeElement;
      if (!(el instanceof HTMLElement)) return null;
      if (!el.closest("#worker-overview-command")) return null;
      const style = getComputedStyle(el);
      return {
        label: el.getAttribute("aria-label") ?? (el.innerText || "").slice(0, 28),
        outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
      };
    });
  }
  report.worker.keyboardFocus = focusReport;
  expect(problems, "keyboard focus", Boolean(focusReport), "quick toolbar unreachable with Tab");
  expect(problems, "keyboard focus ring", Boolean(focusReport && /solid 2px/.test(focusReport.outline)), `no visible focus ring: ${JSON.stringify(focusReport)}`);

  // Account menu contents (workspace, sign-in method, connection, sign out).
  await page.getByRole("button", { name: "Account menu" }).first().click();
  await page.waitForTimeout(300);
  const menu = page.locator("[role='menu']").first();
  report.worker.accountMenuVisible = await menu.isVisible();
  expect(problems, "account menu", report.worker.accountMenuVisible, "menu did not open");
  report.worker.accountMenuText = (await menu.innerText().catch(() => "")).replace(/\s+/g, " ").trim();
  for (const [name, pattern] of [
    ["workspace", /workspace/i],
    ["sign-in method", /password|sso|keycloak|sign[ -]?in/i],
    ["connection", /online|offline|connection/i],
    ["sign out", /sign[ -]?out|log out/i],
    ["menu semantics", /workspace/i],
  ]) {
    expect(problems, `account menu:${name}`, pattern.test(report.worker.accountMenuText), `menu is missing ${name}: ${report.worker.accountMenuText}`);
  }
  await page.getByRole("button", { name: "Close account menu" }).first().click().catch(() => {});

  // Floating microphone at phone size: it hides itself on Voice Entry, so the
  // tap must land on that screen rather than leaving the worker on an
  // empty-looking page.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  const floatingMic = page.locator("[aria-label^='Start inventory update by voice']").first();
  report.worker.floatingMicVisible = await floatingMic.isVisible().catch(() => false);
  if (report.worker.floatingMicVisible) {
    await floatingMic.click({ force: true });
    await page.waitForTimeout(700);
    const afterMic = await probe(page);
    report.worker["floating-mic"] = afterMic;
    report.worker.floatingMicStillVisible = await floatingMic.isVisible().catch(() => false);
    expect(problems, "floating mic opens Voice entry", afterMic.visibleSections.includes("voice-entry"), `voice screen not rendered (sections=${afterMic.visibleSections.join(",")})`);
    expect(problems, "floating mic hides itself", report.worker.floatingMicStillVisible === false, "floating mic still visible on the Voice entry screen");
  } else {
    expect(problems, "floating mic", false, "floating voice button not rendered for the worker");
  }

  // Mobile bottom toolbar.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await page.waitForTimeout(500);
  const dock = page.locator("nav[aria-label='Warehouse Executive tools']");
  report.worker.dockVisible = await dock.isVisible();
  const dockExpectations = { Overview: /jump to any tool in one tap/i, Voice: /voice|record|microphone/i, Tasks: /task/i, History: /history|pending/i, Settings: /settings|microphone/i };
  if (report.worker.dockVisible) {
    for (const label of Object.keys(dockExpectations)) {
      const dockButton = dock.getByRole("button", { name: label, exact: true });
      if (!(await dockButton.count())) {
        expect(problems, `dock:${label}`, false, "dock button missing");
        continue;
      }
      await dockButton.click();
      await page.waitForTimeout(450);
      const result = await probe(page);
      report.worker[`dock:${label}`] = result;
      expect(problems, `dock:${label}`, !result.hasEmptyLookingStage, `screen rendered blank (chars=${result.contentChars})`);
      expect(problems, `dock:${label}`, dockExpectations[label].test(result.fullText), `unexpected content: ${result.contentHead}`);
      expect(problems, `dock:${label} screen`, screenChecks[{ Overview: "Overview", Voice: "Voice entry", Tasks: "Task queue", History: "History", Settings: "Settings" }[label]](result), `wrong screen rendered (sections=${result.visibleSections.join(",")})`);
      const expectedTitle = { Overview: "Overview", Voice: "Voice entry", Tasks: "Task queue", History: "History", Settings: "Settings" }[label];
      expect(problems, `dock:${label} title`, result.heading === expectedTitle, `page title should read ${expectedTitle}, got ${result.heading}`);
    }
    // Mobile navigation drawer.
    await page.getByRole("button", { name: "Open navigation" }).first().click().catch(() => {});
    await page.waitForTimeout(400);
    report.worker.mobileNavOpen = await page.locator("aside").first().isVisible();
    await page.getByRole("button", { name: "Close navigation" }).first().click().catch(() => {});
    await page.waitForTimeout(300);
  } else {
    expect(problems, "mobile dock", false, "worker dock not visible at 390px");
  }

  // Mobile rendering of the new catalogue page (table must scroll, not overflow).
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("nav[aria-label='Warehouse Executive tools']").getByRole("button", { name: "Overview", exact: true }).click();
  await page.waitForTimeout(500);
  await page.locator("#worker-overview-command button", { hasText: "Active items" }).first().click();
  await page.waitForTimeout(600);
  report.worker["active-items-mobile"] = await page.evaluate(() => {
    const table = document.querySelector("#dashboard-content table");
    const stage = document.querySelector("#dashboard-content");
    return {
      heading: document.querySelector("h1")?.innerText?.trim() ?? null,
      pageOverflows: document.documentElement.scrollWidth > window.innerWidth + 1,
      tableScrolls: table ? table.parentElement.scrollWidth > table.parentElement.clientWidth : null,
      stageWidth: stage ? Math.round(stage.getBoundingClientRect().width) : null,
    };
  });
  expect(problems, "active-items mobile", report.worker["active-items-mobile"].pageOverflows === false, "page overflows horizontally at 390px");

  const shotsDir = process.env.AUDIT_SHOTS;
  if (shotsDir) {
    await page.screenshot({ path: `${shotsDir}/active-items-mobile.png` });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${shotsDir}/active-items-desktop.png` });
    await page.locator("aside").getByRole("button", { name: /^Overview/ }).first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${shotsDir}/overview-desktop.png` });
    report.shots = shotsDir;
  }

  // Empty catalogue state: reload with a catalogue that has no products.
  await page.setViewportSize({ width: 1440, height: 940 });
  await page.waitForTimeout(400);
  globalThis.__empty = true;
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Overview" }).first().waitFor({ timeout: 30000 });
  await page.locator("aside").getByRole("button", { name: /^Active items/ }).first().click();
  await page.waitForTimeout(700);
  const emptyProbe = await probe(page);
  report.worker["active-items-empty"] = emptyProbe;
  expect(problems, "active-items empty state", /No active items yet/i.test(emptyProbe.fullText), `empty state missing: ${emptyProbe.contentHead}`);
  globalThis.__empty = false;
  await page.locator("aside").getByRole("button", { name: /^Overview/ }).first().click();
  await page.waitForTimeout(400);

  // Error state: the task service fails on load, then the retry fails too.
  const taskUrl = (url) => url.pathname.endsWith("/tasks");
  await page.route(taskUrl, (route) => route.abort());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Overview" }).first().waitFor({ timeout: 30000 });
  await page.locator("aside").getByRole("button", { name: /^Task queue/ }).first().click();
  await page.waitForTimeout(700);
  const refreshButton = page.getByRole("button", { name: /Refresh tasks/i }).first();
  report.worker.errorStateRefreshButton = await refreshButton.count();
  if (await refreshButton.count()) {
    await refreshButton.click();
    await page.waitForTimeout(900);
  }
  const errorProbe = await probe(page);
  report.worker["error-state"] = errorProbe;
  expect(problems, "error state feedback", /unavailable|retry|could not|failed/i.test(errorProbe.fullText), `no error message shown: ${errorProbe.contentHead}`);
  await page.unroute(taskUrl);

  // Sign out returns to the authentication screen.
  await page.setViewportSize({ width: 1440, height: 940 });
  await page.waitForTimeout(300);
  const accountMenu = page.locator("[role='menu']");
  if (!(await accountMenu.first().isVisible().catch(() => false))) {
    await page.getByRole("button", { name: "Account menu" }).first().click();
    await page.waitForTimeout(300);
  }
  const signOut = accountMenu.getByRole("menuitem", { name: /Sign out|Log out/i }).first();
  if (await signOut.count()) {
    await signOut.click();
    await page.getByRole("heading", { name: /Welcome back/i }).first().waitFor({ timeout: 10000 }).catch(() => {});
    report.worker.afterSignOutHeading = (await page.getByRole("heading").first().innerText().catch(() => "")).replace(/\s+/g, " ").trim();
    const bodyText = (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").trim();
    report.worker.afterSignOutText = bodyText.slice(0, 200);
    expect(problems, "sign out", /Welcome back/i.test(report.worker.afterSignOutHeading) || /Welcome back/i.test(bodyText), `unexpected screen after sign out: ${report.worker.afterSignOutHeading}`);
  } else {
    expect(problems, "sign out", false, "Sign out entry missing from the account menu");
  }

  report.apiHits = hits.length;

  globalThis.__role = "MANAGER";
  await page.goto(WEB, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Overview" }).first().waitFor({ timeout: 30000 });
  report.manager.overview = await probe(page);

  globalThis.__role = "ADMINISTRATOR";
  await page.goto(WEB, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  report.administrator.overview = await probe(page);
  expect(problems, "administrator overview", !report.administrator.overview.hasEmptyLookingStage, "administrator screen rendered blank");

  report.problemCount = problems.length;
  return report;
}

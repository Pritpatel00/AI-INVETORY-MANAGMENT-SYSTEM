import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";

const source = async (relativePath) =>
  readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("actual workspace mapping accepts each canonical role and rejects other workspaces", async () => {
  const code = ts.transpileModule(await source("src/features/inventory/auth/local-auth.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const context = { exports: {}, require: () => ({}) };
  vm.runInNewContext(code, context);
  for (const [employeeId, role, allowed] of [
    ["ADMIN1", "ADMINISTRATOR", "administrator"],
    ["MANAGER1", "MANAGER", "manager"],
    ["WORKER1", "WORKER", "worker"],
  ]) {
    for (const workspace of ["administrator", "manager", "worker"]) {
      assert.equal(context.exports.userCanUseWorkspace({ employeeId, role }, workspace), workspace === allowed);
    }
  }
});

test("administrator initialization is only offered after SSO and uses authenticated CSRF request", async () => {
  const [app, api, form] = await Promise.all([
    source("src/features/inventory/InventoryApp.tsx"),
    source("src/features/inventory/api/inventory-api.ts"),
    source("src/features/inventory/authentication/InitializeLocalPassword.tsx"),
  ]);
  assert.match(app, /provider === "keycloak" && user\?\.localPasswordInitializationAvailable/);
  assert.match(api, /request<ApiAuthenticatedUser>\("\/auth\/initialize-admin-password"/);
  assert.match(form, /minLength=\{12\}/);
  assert.match(form, /form\.reset\(\)/);
  assert.doesNotMatch(form, /localStorage|sessionStorage|console\./);
});

test("local auth adapter owns startup refresh and exposes canonical user state", async () => {
  const [adapter, api, app] = await Promise.all([
    source("src/features/inventory/auth/local-auth.ts"),
    source("src/features/inventory/api/inventory-api.ts"),
    source("src/features/inventory/InventoryApp.tsx"),
  ]);
  assert.match(adapter, /refreshLocalSession\(\)/);
  assert.match(adapter, /setUser\(result\.user\)/);
  assert.match(adapter, /setProvider\("local"\)/);
  assert.match(api, /export function loginLocal/);
  assert.match(api, /export function fetchAuthenticatedUser/);
  assert.match(app, /const localAuth = useLocalAuth\(\)/);
  assert.match(app, /if \(!localAuthReady\) return;/);
  assert.match(adapter, /Local refresh is always attempted before Keycloak fallback/);
});

test("login, refresh, logout, and password change use cookie credentials and CSRF", async () => {
  const api = await source("src/features/inventory/api/inventory-api.ts");
  assert.match(api, /credentials: "include"/g);
  assert.match(api, /\/auth\/csrf/);
  assert.match(api, /let csrfToken: string \| null = null/);
  assert.doesNotMatch(api, /document\.cookie/);
  assert.doesNotMatch(api, /csrfTokenFromCookie/);
  assert.match(api, /publicAuthRequest<LocalAuthResponse>\(\s*"\/auth\/refresh"/);
  assert.match(api, /publicAuthRequest<void>\(\s*"\/auth\/logout"/);
  assert.match(api, /request<LocalAuthResponse>\("\/auth\/change-password"/);
  assert.match(api, /x-csrf-token/);
  assert.match(api, /Authorization: `Bearer \$\{accessToken\}`/);
});

test("refresh is single-flight and business requests retry at most once", async () => {
  const api = await source("src/features/inventory/api/inventory-api.ts");
  assert.match(api, /let localRefreshPromise: Promise<LocalAuthResponse> \| null = null/);
  assert.match(api, /if \(!localRefreshPromise\)/);
  assert.match(api, /if \(response\.status === 401\)/);
  assert.match(api, /await refreshAccessToken\(true\)/);
  assert.equal(
    (api.match(/response = await performWithCsrfRecovery\(accessToken\);/g) ?? [])
      .length,
    2,
  );
});

test("CSRF recovery bootstraps once and prevents retry loops", async () => {
  const [api, backend] = await Promise.all([
    source("src/features/inventory/api/inventory-api.ts"),
    readFile(new URL("../../backend/api/src/auth/auth.controller.ts", import.meta.url), "utf8"),
  ]);
  assert.match(api, /if \(response\.status === 403 && csrfRequired && !csrfRetried\)/);
  assert.match(api, /bootstrapCsrfToken\(true\)/);
  assert.match(api, /csrfRetried = true/);
  assert.match(api, /credentials: "include"/g);
  assert.match(backend, /@Get\("csrf"\)/);
  assert.match(backend, /return \{ csrfToken: this\.cookies\.setCsrfCookie\(response\) \}/);
});

test("forced password state is rendered before inventory dashboards", async () => {
  const [app, page] = await Promise.all([
    source("src/features/inventory/InventoryApp.tsx"),
    source("src/features/inventory/authentication/ChangePasswordPage.tsx"),
  ]);
  assert.match(app, /provider === "local" && user\?\.mustChangePassword/);
  assert.match(app, /localAuth\.changePassword/);
  assert.match(page, /currentPassword/);
  assert.match(page, /newPassword/);
  assert.match(page, /minLength=\{12\}/);
});

test("workspace selection cannot override the canonical PostgreSQL role", async () => {
  const [adapter, app] = await Promise.all([
    source("src/features/inventory/auth/local-auth.ts"),
    source("src/features/inventory/InventoryApp.tsx"),
  ]);
  assert.match(adapter, /return workspaceForUser\(user\) === workspace/);
  assert.match(app, /if \(!userCanUseWorkspace\(authenticatedUser, role\)\)/);
  assert.match(app, /fetchAuthenticatedUser\(\)/);
});

test("offline records use canonical user ownership and idempotent legacy migration", async () => {
  const [queue, hook, executive] = await Promise.all([
    source("src/features/inventory/offline/offline-queue.ts"),
    source("src/features/inventory/hooks/useNetworkStatus.ts"),
    source("src/features/inventory/warehouse-executive/ExecutiveDashboard.tsx"),
  ]);
  assert.match(queue, /return `nirka-user:\$\{userId\}`/);
  assert.match(queue, /migrateOfflineInventoryOwnerRecords/);
  assert.match(queue, /databaseVersion = 2/);
  assert.match(hook, /migrateOfflineInventoryOwner\(ownerId\.slice/);
  assert.match(executive, /ownerId: offlineOwnerId/);
  assert.doesNotMatch(executive, /keycloak\.subject/);
});

test("Keycloak remains available only as an explicit compatibility path", async () => {
  const [app, keycloak, page] = await Promise.all([
    source("src/features/inventory/InventoryApp.tsx"),
    source("src/features/inventory/auth/keycloak.ts"),
    source("src/features/inventory/authentication/AuthenticationPage.tsx"),
  ]);
  assert.match(keycloak, /keycloak-js/);
  assert.match(app, /initializeKeycloak/);
  assert.match(app, /keycloak\.login/);
  assert.match(page, /Continue with legacy Keycloak sign-in/);
  assert.doesNotMatch(app, /canUseRole\(/);
});

test("frontend auth code does not define or persist refresh-token values", async () => {
  const [api, adapter] = await Promise.all([
    source("src/features/inventory/api/inventory-api.ts"),
    source("src/features/inventory/auth/local-auth.ts"),
  ]);
  assert.doesNotMatch(api, /refreshToken\s*:/);
  assert.doesNotMatch(adapter, /refreshToken/);
});

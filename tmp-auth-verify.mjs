// TEMPORARY read-only production auth verification.
// Prints ONLY non-secret fields. Never prints passwords or tokens.
const BASE = "https://ai-inventory-managment-system-production-da76.up.railway.app/api";

const ACCOUNTS = [
  { label: "Worker", identifier: "worker1", secret: "Worker@123", expectRole: "WORKER", permissionPath: "/auth/manager-access", permissionExpect: 403 },
  { label: "Manager", identifier: "manager1", secret: "Manager@123", expectRole: "MANAGER", permissionPath: "/auth/manager-access", permissionExpect: 200 },
  { label: "Administrator", identifier: "admin1", secret: "Admin@123", expectRole: "ADMINISTRATOR", permissionPath: "/auth/users", permissionExpect: 200 },
];

async function call(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, init);
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text.slice(0, 300); }
  const setCookie = res.headers.get("set-cookie") ?? "";
  return {
    status: res.status,
    body,
    cookieNames: setCookie
      .split(/,(?=[^;]+=)/)
      .map((c) => c.split("=")[0] && c.trim().split("=")[0])
      .filter(Boolean),
  };
}

const results = [];
for (const acct of ACCOUNTS) {
  const out = { label: acct.label, login: {}, me: {}, permission: {} };

  const login = await call("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier: acct.identifier, password: acct.secret }),
  });

  out.login.status = login.status;
  out.login.ok = login.status === 200;
  out.login.cookieNames = login.cookieNames;
  const lb = login.body && typeof login.body === "object" ? login.body : {};
  out.login.errorMessage = lb.message ?? lb.error ?? null;
  out.login.tokenReturned = typeof lb.accessToken === "string" && lb.accessToken.length > 0;
  out.login.tokenType = lb.tokenType ?? null;
  out.login.expiresIn = lb.expiresIn ?? null;
  out.login.user = lb.user
    ? {
        employeeId: lb.user.employeeId,
        email: lb.user.email,
        displayName: lb.user.displayName,
        role: lb.user.role,
        active: lb.user.active,
        shift: lb.user.shift,
        warehouseZone: lb.user.warehouseZone,
        localAuthEnabled: lb.user.localAuthEnabled,
        mustChangePassword: lb.user.mustChangePassword,
        authProvider: lb.user.authProvider,
      }
    : null;

  const token = lb.accessToken;

  if (token) {
    const me = await call("/auth/me", { headers: { authorization: `Bearer ${token}` } });
    out.me.status = me.status;
    out.me.body = me.body && typeof me.body === "object"
      ? {
          employeeId: me.body.employeeId,
          email: me.body.email,
          displayName: me.body.displayName,
          role: me.body.role,
          active: me.body.active,
          shift: me.body.shift,
          warehouseZone: me.body.warehouseZone,
          mustChangePassword: me.body.mustChangePassword,
          authProvider: me.body.authProvider,
          localPasswordInitializationAvailable: me.body.localPasswordInitializationAvailable,
        }
      : me.body;

    const perm = await call(acct.permissionPath, { headers: { authorization: `Bearer ${token}` } });
    out.permission.path = acct.permissionPath;
    out.permission.expected = acct.permissionExpect;
    out.permission.status = perm.status;
    out.permission.match = perm.status === acct.permissionExpect;
    out.permission.body = perm.body && typeof perm.body === "object"
      ? { message: perm.body.message ?? undefined, allowed: perm.body.allowed, username: perm.body.username, roles: perm.body.roles, isArray: Array.isArray(perm.body), count: Array.isArray(perm.body) ? perm.body.length : undefined, error: perm.body.error }
      : perm.body;
  }

  results.push(out);
}

// Also verify /auth/me without a token (unauthorized baseline).
const noToken = await call("/auth/me");
console.log(JSON.stringify({ results, noTokenMe: { status: noToken.status, body: noToken.body } }, null, 2));

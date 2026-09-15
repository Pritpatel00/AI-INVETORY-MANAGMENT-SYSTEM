import { i as require_react, r as require_jsx_runtime, t as __toESM } from "./ssr.mjs";
import { t as Keycloak } from "../_libs/keycloak-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/InventoryApp-oLDfuAgV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
var mergeClasses = (...classes) => classes.filter((className, index, array) => {
	return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var defaultAttributes = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round",
	strokeLinejoin: "round"
};
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Icon = (0, import_react.forwardRef)(({ color = "currentColor", size = 24, strokeWidth = 2, absoluteStrokeWidth, className = "", children, iconNode, ...rest }, ref) => {
	return (0, import_react.createElement)("svg", {
		ref,
		...defaultAttributes,
		width: size,
		height: size,
		stroke: color,
		strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
		className: mergeClasses("lucide", className),
		...rest
	}, [...iconNode.map(([tag, attrs]) => (0, import_react.createElement)(tag, attrs)), ...Array.isArray(children) ? children : [children]]);
});
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var createLucideIcon = (iconName, iconNode) => {
	const Component = (0, import_react.forwardRef)(({ className, ...props }, ref) => (0, import_react.createElement)(Icon, {
		ref,
		iconNode,
		className: mergeClasses(`lucide-${toKebabCase(iconName)}`, className),
		...props
	}));
	Component.displayName = `${iconName}`;
	return Component;
};
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var LogOut = createLucideIcon("LogOut", [
	["path", {
		d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",
		key: "1uf3rs"
	}],
	["polyline", {
		points: "16 17 21 12 16 7",
		key: "1gabdz"
	}],
	["line", {
		x1: "21",
		x2: "9",
		y1: "12",
		y2: "12",
		key: "1uyos4"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Menu = createLucideIcon("Menu", [
	["line", {
		x1: "4",
		x2: "20",
		y1: "12",
		y2: "12",
		key: "1e0a9i"
	}],
	["line", {
		x1: "4",
		x2: "20",
		y1: "6",
		y2: "6",
		key: "1owob3"
	}],
	["line", {
		x1: "4",
		x2: "20",
		y1: "18",
		y2: "18",
		key: "yk5zj1"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ShieldCheck = createLucideIcon("ShieldCheck", [["path", {
	d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
	key: "oel41y"
}], ["path", {
	d: "m9 12 2 2 4-4",
	key: "dzmm74"
}]]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Wifi = createLucideIcon("Wifi", [
	["path", {
		d: "M12 20h.01",
		key: "zekei9"
	}],
	["path", {
		d: "M2 8.82a15 15 0 0 1 20 0",
		key: "dnpr2z"
	}],
	["path", {
		d: "M5 12.859a10 10 0 0 1 14 0",
		key: "1x1e6c"
	}],
	["path", {
		d: "M8.5 16.429a5 5 0 0 1 7 0",
		key: "1bycff"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var WifiOff = createLucideIcon("WifiOff", [
	["path", {
		d: "M12 20h.01",
		key: "zekei9"
	}],
	["path", {
		d: "M8.5 16.429a5 5 0 0 1 7 0",
		key: "1bycff"
	}],
	["path", {
		d: "M5 12.859a10 10 0 0 1 5.17-2.69",
		key: "1dl1wf"
	}],
	["path", {
		d: "M19 12.859a10 10 0 0 0-2.007-1.523",
		key: "4k23kn"
	}],
	["path", {
		d: "M2 8.82a15 15 0 0 1 4.177-2.643",
		key: "1grhjp"
	}],
	["path", {
		d: "M22 8.82a15 15 0 0 0-11.288-3.764",
		key: "z3jwby"
	}],
	["path", {
		d: "m2 2 20 20",
		key: "1ooewy"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var CloudUpload = createLucideIcon("CloudUpload", [
	["path", {
		d: "M12 13v8",
		key: "1l5pq0"
	}],
	["path", {
		d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",
		key: "1pljnt"
	}],
	["path", {
		d: "m8 17 4-4 4 4",
		key: "1quai1"
	}]
]);
var keycloak = new Keycloak({
	url: process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? "http://localhost:8080",
	realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? "nirka-inventory",
	clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? "nirka-inventory-web"
});
var initialization = null;
function initializeKeycloak() {
	if (!initialization) initialization = keycloak.init({
		onLoad: "check-sso",
		pkceMethod: "S256",
		checkLoginIframe: false
	});
	return initialization;
}
var API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
var accessToken = null;
var authProvider = null;
var tokenRefreshPromise = null;
var localRefreshPromise = null;
var authFailureHandler = null;
var csrfToken = null;
var csrfBootstrapPromise = null;
function setInventoryAccessToken(token, provider) {
	accessToken = token ?? null;
	if (provider) authProvider = provider;
	if (!token) authProvider = null;
}
function setInventoryAuthFailureHandler(handler) {
	authFailureHandler = handler ?? null;
}
function headersWithJson(init, csrf) {
	const headers = new Headers(init?.headers);
	if (init?.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
	if (csrf) headers.set("x-csrf-token", csrf);
	return headers;
}
async function readApiError(response) {
	const payload = await response.json().catch(() => null);
	return Array.isArray(payload?.message) ? payload.message.join(" ") : payload?.message;
}
async function bootstrapCsrfToken(force = false) {
	if (!force && csrfToken) return csrfToken;
	if (csrfBootstrapPromise) return csrfBootstrapPromise;
	csrfBootstrapPromise = fetch(`${API_BASE_URL}/auth/csrf`, {
		method: "GET",
		credentials: "include"
	}).then(async (response) => {
		if (!response.ok) throw new Error(await readApiError(response) || `CSRF bootstrap failed with status ${response.status}.`);
		const payload = await response.json();
		if (typeof payload.csrfToken !== "string" || payload.csrfToken.length < 16) throw new Error("CSRF bootstrap returned an invalid token.");
		csrfToken = payload.csrfToken;
		return payload.csrfToken;
	}).finally(() => {
		csrfBootstrapPromise = null;
	});
	return csrfBootstrapPromise;
}
async function publicAuthRequest(path, init, options = {}) {
	const csrfRequired = options.csrfRequired ?? false;
	let csrfRetried = false;
	const perform = async () => {
		const token = csrfRequired ? await bootstrapCsrfToken() : void 0;
		return fetch(`${API_BASE_URL}${path}`, {
			...init,
			credentials: "include",
			headers: headersWithJson(init, token)
		});
	};
	let response = await perform();
	if (response.status === 403 && csrfRequired && !csrfRetried) {
		csrfRetried = true;
		csrfToken = null;
		await bootstrapCsrfToken(true);
		response = await perform();
	}
	if (!response.ok) throw new Error(await readApiError(response) || `Authentication request failed with status ${response.status}.`);
	return response.status === 204 ? void 0 : response.json();
}
async function refreshLocalAccessToken() {
	if (!localRefreshPromise) localRefreshPromise = publicAuthRequest("/auth/refresh", { method: "POST" }, { csrfRequired: true }).then((result) => {
		setInventoryAccessToken(result.accessToken, "local");
		return result;
	}).finally(() => {
		localRefreshPromise = null;
	});
	return localRefreshPromise;
}
function refreshLocalSession() {
	return refreshLocalAccessToken();
}
/** Refresh the active provider's session. Local refresh is single-flight so
* concurrent startup/API calls cannot rotate the same cookie twice. */
async function refreshAccessToken(force = false) {
	if (!force && accessToken) {
		if (authProvider === "local") return;
		if (authProvider === "keycloak" && !keycloak.isTokenExpired(60)) return;
	}
	if (authProvider === "local") {
		await refreshLocalAccessToken();
		return;
	}
	if (authProvider !== "keycloak" || !keycloak.authenticated || !keycloak.refreshToken) return;
	if (!tokenRefreshPromise) tokenRefreshPromise = keycloak.updateToken(60).then(() => {
		accessToken = keycloak.token ?? null;
	}).finally(() => {
		tokenRefreshPromise = null;
	});
	await tokenRefreshPromise;
	if (!accessToken && keycloak.token) accessToken = keycloak.token;
}
/**
* Run one authenticated fetch, retrying once after a 401 with a freshly
* refreshed access token. All API calls go through this so an expired token
* can never fail a request that the user is still entitled to make.
*/
async function withAuthRetry(url, init, options = {}) {
	await refreshAccessToken();
	const csrfRequired = options.csrfRequired ?? false;
	let csrfRetried = false;
	const perform = async (token) => {
		const currentCsrfToken = csrfRequired ? await bootstrapCsrfToken() : void 0;
		return fetch(url, {
			...init,
			credentials: csrfRequired ? "include" : init?.credentials,
			headers: (() => {
				const headers = new Headers(init?.headers);
				if (token) headers.set("Authorization", `Bearer ${token}`);
				else headers.delete("Authorization");
				if (currentCsrfToken) headers.set("x-csrf-token", currentCsrfToken);
				return headers;
			})()
		});
	};
	const performWithCsrfRecovery = async (token) => {
		let response = await perform(token);
		if (response.status === 403 && csrfRequired && !csrfRetried) {
			csrfRetried = true;
			csrfToken = null;
			await bootstrapCsrfToken(true);
			response = await perform(token);
		}
		return response;
	};
	let response = await performWithCsrfRecovery(accessToken);
	if (response.status === 401) {
		let refreshSucceeded = true;
		try {
			await refreshAccessToken(true);
		} catch {
			refreshSucceeded = false;
		}
		if (!refreshSucceeded || !accessToken) {
			setInventoryAccessToken();
			authFailureHandler?.();
			throw new Error("Your secure session expired. Please sign in again.");
		}
		response = await performWithCsrfRecovery(accessToken);
		if (response.status === 401) {
			setInventoryAccessToken();
			authFailureHandler?.();
			throw new Error("Your secure session expired. Please sign in again.");
		}
	}
	return response;
}
function loginLocal(identifier, password) {
	return publicAuthRequest("/auth/login", {
		method: "POST",
		body: JSON.stringify({
			identifier,
			password
		})
	}).then((result) => {
		setInventoryAccessToken(result.accessToken, "local");
		return result;
	});
}
async function logoutLocal() {
	try {
		await publicAuthRequest("/auth/logout", {
			method: "POST",
			headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : void 0
		}, { csrfRequired: true });
	} finally {
		setInventoryAccessToken();
	}
}
function changeLocalPassword(currentPassword, newPassword) {
	return request("/auth/change-password", {
		method: "POST",
		credentials: "include",
		body: JSON.stringify({
			currentPassword,
			newPassword
		})
	}, { csrfRequired: true }).then((result) => {
		setInventoryAccessToken(result.accessToken, "local");
		return result;
	});
}
function fetchAuthenticatedUser() {
	return request("/auth/me");
}
async function request(path, init, options = {}) {
	const response = await withAuthRetry(`${API_BASE_URL}${path}`, {
		...init,
		headers: headersWithJson(init)
	}, options);
	if (!response.ok) {
		const message = await readApiError(response);
		throw new Error(message || `Inventory API request failed with status ${response.status}.`);
	}
	return response.json();
}
async function fetchInventorySnapshot() {
	const [products, locations, balances, transactions] = await Promise.all([
		request("/inventory/products"),
		request("/inventory/locations"),
		request("/inventory/balances"),
		request("/inventory/transactions")
	]);
	return {
		products,
		locations,
		balances,
		transactions
	};
}
function fetchDetailedSystemHealth() {
	return request("/health/detailed");
}
function fetchSystemUsers() {
	return request("/auth/users");
}
function createSystemUser(input) {
	return request("/auth/users", {
		method: "POST",
		body: JSON.stringify(input)
	});
}
function updateSystemUserStatus(id, active) {
	return request(`/auth/users/${id}/status`, {
		method: "PATCH",
		body: JSON.stringify({ active })
	});
}
function updateSystemUser(id, input) {
	return request(`/auth/users/${id}`, {
		method: "PATCH",
		body: JSON.stringify(input)
	});
}
function resetSystemUserPassword(id, temporaryPassword) {
	return request(`/auth/users/${id}/reset-password`, {
		method: "POST",
		body: JSON.stringify({ temporaryPassword })
	});
}
function createInventoryProduct(input) {
	return request("/inventory/products", {
		method: "POST",
		body: JSON.stringify(input)
	});
}
function updateInventoryProduct(id, input) {
	return request(`/inventory/products/${id}`, {
		method: "PATCH",
		body: JSON.stringify(input)
	});
}
function deleteInventoryProduct(id, administratorOverride = false) {
	return request(administratorOverride ? `/inventory/products/${id}/administrator-override` : `/inventory/products/${id}`, { method: "DELETE" });
}
function createLocation(input) {
	return request("/inventory/locations", {
		method: "POST",
		body: JSON.stringify(input)
	});
}
function updateLocation(id, input) {
	return request(`/inventory/locations/${id}`, {
		method: "PATCH",
		body: JSON.stringify(input)
	});
}
function deleteLocation(id) {
	return request(`/inventory/locations/${id}`, { method: "DELETE" });
}
function adjustInventoryBalance(input) {
	return request("/inventory/balance-adjustments", {
		method: "POST",
		body: JSON.stringify(input)
	});
}
function fetchDiscrepancies(query = {}) {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query)) if (value !== void 0 && value !== null && value !== "") params.set(key, String(value));
	const qs = params.toString();
	return request(`/discrepancies${qs ? `?${qs}` : ""}`);
}
function fetchDiscrepancySummary() {
	return request("/discrepancies/summary");
}
function fetchDiscrepancy(id) {
	return request(`/discrepancies/${id}`);
}
function fetchDiscrepancyAudit(id) {
	return request(`/discrepancies/${id}/audit`);
}
function fetchDiscrepancyReports() {
	return request("/discrepancies/reports");
}
function fetchDiscrepancyEvidence(id) {
	return request(`/discrepancies/${id}/evidence`);
}
/** List photo evidence attached to one transaction (manager, administrator
* or the transaction creator). The response never contains the storage path. */
function fetchTransactionEvidence(transactionId) {
	return request(`/transactions/${transactionId}/evidence`);
}
async function uploadEvidenceRequest(path, file, filename) {
	const form = new FormData();
	form.append("photo", file, filename ?? "evidence.jpg");
	const response = await withAuthRetry(`${API_BASE_URL}${path}`, {
		method: "POST",
		body: form
	});
	if (!response.ok) {
		const payload = await response.json().catch(() => null);
		const message = Array.isArray(payload?.message) ? payload.message.join(" ") : payload?.message;
		throw new Error(message || `Evidence upload failed with status ${response.status}.`);
	}
	return response.json();
}
function uploadDiscrepancyEvidence(id, file, filename) {
	return uploadEvidenceRequest(`/discrepancies/${id}/evidence`, file, filename);
}
function uploadTransactionEvidence(id, file, filename) {
	return uploadEvidenceRequest(`/transactions/${id}/evidence`, file, filename);
}
/** Download an evidence photo as a browser object URL (auth header cannot be
* sent on a plain <img>, so we fetch and revoke later). */
async function fetchEvidenceObjectUrl(evidenceId) {
	const response = await withAuthRetry(`${API_BASE_URL}/evidence/${evidenceId}/file`);
	if (!response.ok) throw new Error(`Evidence download failed with status ${response.status}.`);
	const blob = await response.blob();
	return URL.createObjectURL(blob);
}
/** Export the currently filtered discrepancy list as a CSV file download. */
async function downloadDiscrepancyCsv(query = {}) {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query)) if (value !== void 0 && value !== null && value !== "") params.set(key, String(value));
	const qs = params.toString();
	const response = await withAuthRetry(`${API_BASE_URL}/discrepancies/export.csv${qs ? `?${qs}` : ""}`);
	if (!response.ok) {
		const payload = await response.json().catch(() => null);
		throw new Error(payload?.message ?? `CSV export failed with status ${response.status}.`);
	}
	const csv = await response.text();
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `discrepancies-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
	return csv;
}
function approveDiscrepancy(id, note) {
	return request(`/discrepancies/${id}/approve`, {
		method: "POST",
		body: JSON.stringify({ note })
	});
}
function requestDiscrepancyRecount(id, instructions, assignedWorkerId) {
	return request(`/discrepancies/${id}/request-recount`, {
		method: "POST",
		body: JSON.stringify({
			instructions,
			...assignedWorkerId ? { assignedWorkerId } : {}
		})
	});
}
function rejectDiscrepancy(id, reason) {
	return request(`/discrepancies/${id}/reject`, {
		method: "POST",
		body: JSON.stringify({ reason })
	});
}
function resolveDiscrepancyTransfer(id, input) {
	return request(`/discrepancies/${id}/resolve-transfer`, {
		method: "POST",
		body: JSON.stringify(input)
	});
}
function fetchNotifications() {
	return request("/notifications");
}
function fetchUnreadNotificationCount() {
	return request("/notifications/unread-count");
}
function markNotificationRead(id) {
	return request(`/notifications/${id}/read`, { method: "POST" });
}
function markAllNotificationsRead() {
	return request("/notifications/read-all", { method: "POST" });
}
function fetchInventoryTasks() {
	return request("/tasks");
}
function fetchTaskAssignees() {
	return request("/tasks/assignees");
}
function createInventoryTask(input) {
	return request("/tasks", {
		method: "POST",
		body: JSON.stringify(input)
	});
}
function createCycleCountPlan(input) {
	return request("/tasks/cycle-count-plans", {
		method: "POST",
		body: JSON.stringify(input)
	});
}
function fetchCycleCountPlans() {
	return request("/tasks/cycle-count-plans");
}
function fetchCycleCountPlan(id) {
	return request(`/tasks/cycle-count-plans/${id}`);
}
function deleteInventoryTask(id) {
	return request(`/tasks/${id}`, { method: "DELETE" });
}
function startInventoryTask(id) {
	return request(`/tasks/${id}/start`, { method: "POST" });
}
function completeInventoryTask(id) {
	return request(`/tasks/${id}/complete`, { method: "POST" });
}
function refreshReorderDrafts() {
	return request("/inventory/reorder-drafts/refresh", { method: "POST" });
}
function createPendingInventoryTransaction(extraction, clientRequestId, recountTaskId, taskId) {
	const { fields } = extraction;
	if (!fields.action || !fields.product || fields.quantity === null) throw new Error("The AI proposal is not complete.");
	return request("/inventory/transactions", {
		method: "POST",
		body: JSON.stringify({
			action: fields.action,
			productId: fields.product.id,
			quantity: fields.quantity,
			condition: fields.condition,
			sourceLocationId: fields.sourceLocation?.id,
			destinationLocationId: fields.destinationLocation?.id,
			sourceLocationSource: extraction.sourceLocationSource ?? void 0,
			destinationLocationSource: extraction.destinationLocationSource ?? void 0,
			referenceNumber: fields.referenceNumber ?? void 0,
			notes: fields.notes ?? void 0,
			transcript: extraction.transcript,
			evidenceId: extraction.evidenceId ?? void 0,
			clientRequestId,
			recountTaskId: recountTaskId ?? void 0,
			taskId: taskId ?? void 0
		})
	});
}
function confirmInventoryTransaction(transactionId) {
	return request(`/inventory/transactions/${transactionId}/confirm`, { method: "POST" });
}
function reviewInventoryTransaction(transactionId, decision, note) {
	return request(`/inventory/transactions/${transactionId}/${decision}`, {
		method: "POST",
		body: JSON.stringify({ note: note?.trim() || void 0 })
	});
}
function approveInventoryTransaction(transactionId, note) {
	return reviewInventoryTransaction(transactionId, "approve", note);
}
function rejectInventoryTransaction(transactionId, note) {
	return reviewInventoryTransaction(transactionId, "reject", note);
}
function cancelInventoryTransaction(transactionId, note) {
	return request(`/inventory/transactions/${transactionId}/cancel`, {
		method: "POST",
		body: JSON.stringify({ note: note?.trim() || void 0 })
	});
}
function requestInventoryRecount(transactionId, note) {
	return reviewInventoryTransaction(transactionId, "request-recount", note);
}
async function transcribeAudio(audio, options) {
	const form = new FormData();
	const extension = audio.type.includes("ogg") ? "ogg" : "webm";
	form.append("audio", audio, `warehouse-recording.${extension}`);
	if (options?.language) form.append("language", options.language);
	const response = await withAuthRetry(`${API_BASE_URL}/speech/transcribe`, {
		method: "POST",
		body: form
	});
	if (!response.ok) throw new Error(`Speech transcription failed with status ${response.status}.`);
	return response.json();
}
function extractInventoryDetails(input) {
	return request("/ai/extract-inventory", {
		method: "POST",
		body: JSON.stringify(input)
	});
}
function mapTransactions(transactions, limit = 8, includeDate = false) {
	return transactions.slice(0, limit).map((transaction) => {
		const incoming = transaction.action === "RECEIVE";
		const count = transaction.action === "CYCLE_COUNT";
		const formattedAction = transaction.action.toLowerCase().replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
		return {
			id: `TX-${transaction.id.slice(0, 8).toUpperCase()}`,
			type: formattedAction,
			item: transaction.product.name,
			quantity: count ? String(transaction.quantity) : `${incoming ? "+" : "-"}${transaction.quantity}`,
			time: new Intl.DateTimeFormat("en", includeDate ? {
				day: "2-digit",
				month: "short",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit"
			} : {
				hour: "2-digit",
				minute: "2-digit"
			}).format(new Date(transaction.createdAt)),
			status: transaction.status === "POSTED" ? "Posted" : transaction.status === "REJECTED" ? "Rejected" : transaction.status === "CANCELLED" ? "Cancelled" : transaction.status === "RECOUNT_REQUESTED" ? "Recount requested" : transaction.status === "APPROVED" ? "Approved" : transaction.status === "PENDING" ? "Awaiting review" : "Pending"
		};
	});
}
function mapLowStock(balances) {
	const products = /* @__PURE__ */ new Map();
	for (const balance of balances) {
		const current = products.get(balance.product.id) ?? {
			item: balance.product.name,
			code: balance.product.sku,
			available: 0,
			threshold: balance.product.safetyStock
		};
		current.available += Math.max(0, balance.quantity);
		products.set(balance.product.id, current);
	}
	return Array.from(products.values()).filter((product) => product.available < product.threshold).map((product) => {
		const criticalLevel = Math.max(1, Math.floor(product.threshold / 2));
		return {
			...product,
			status: product.available <= criticalLevel ? "Critical" : "Low"
		};
	});
}
function formatAction(action) {
	if (!action) return "";
	return action.toLowerCase().replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}
function taskTypeLabel(type) {
	return {
		RECOUNT: "Recount",
		CYCLE_COUNT: "Cycle count",
		RECEIVE: "Receive",
		PICK: "Pick",
		SHIP: "Ship",
		TRANSFER: "Transfer",
		STOCK_VERIFY: "Stock verify",
		DAMAGE_INSPECTION: "Damage inspection",
		DAMAGE: "Damage"
	}[type] ?? type.replaceAll("_", " ");
}
function formatTaskDue(dueAt) {
	if (!dueAt) return "";
	const date = new Date(dueAt);
	const now = /* @__PURE__ */ new Date();
	const tomorrow = /* @__PURE__ */ new Date();
	tomorrow.setDate(now.getDate() + 1);
	const sameDay = (a, b) => a.toDateString() === b.toDateString();
	if (sameDay(date, now)) return `Due today · ${new Intl.DateTimeFormat("en", {
		hour: "2-digit",
		minute: "2-digit"
	}).format(date)}`;
	if (sameDay(date, tomorrow)) return `Due tomorrow · ${new Intl.DateTimeFormat("en", {
		hour: "2-digit",
		minute: "2-digit"
	}).format(date)}`;
	return `Due ${new Intl.DateTimeFormat("en", {
		day: "2-digit",
		month: "short"
	}).format(date)}`;
}
/** "2026-08" → "August 2026" for cycle-count period display. */
function formatCountPeriod(periodMonth) {
	if (!periodMonth) return "";
	const [year, month] = periodMonth.split("-").map(Number);
	if (!year || !month || month < 1 || month > 12) return periodMonth;
	return new Intl.DateTimeFormat("en", {
		month: "long",
		year: "numeric",
		timeZone: "UTC"
	}).format(new Date(Date.UTC(year, month - 1, 1)));
}
function defaultDueDate(days) {
	const date = /* @__PURE__ */ new Date();
	date.setDate(date.getDate() + days);
	date.setHours(17, 0, 0, 0);
	return date;
}
function formatDateTimeLocal(date) {
	const pad = (value) => String(value).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function defaultTaskDue() {
	return formatDateTimeLocal(defaultDueDate(0));
}
function formatClock(iso) {
	if (!iso) return "";
	return new Intl.DateTimeFormat("en", {
		hour: "2-digit",
		minute: "2-digit"
	}).format(new Date(iso));
}
function priorityTone(priority) {
	if (priority === "URGENT" || priority === "HIGH") return "bg-[#fff1e3] text-[#c56c08]";
	if (priority === "LOW") return "bg-[#eef2f7] text-[#6c829f]";
	return "bg-[#edf4ff] text-[#155eef]";
}
function taskStatusTone(status) {
	if (status === "COMPLETED") return "bg-[#eaf8f1] text-[#16865b]";
	if (status === "CANCELLED") return "bg-[#eef2f7] text-[#7b8fa9]";
	if (status === "IN_PROGRESS") return "bg-[#f2efff] text-[#6349c1]";
	return "bg-[#edf4ff] text-[#155eef]";
}
function formatRoleLabel(role) {
	if (role === "administrator") return "Administrator";
	if (role === "manager") return "Manager";
	return "Warehouse Executive";
}
function roleLabel(role) {
	return role === "worker" ? "Warehouse Executive" : role === "manager" ? "Inventory Manager" : "System Administrator";
}
function formatClarificationValue(field, result) {
	if (field === "action") return formatAction(result.fields.action);
	if (field === "product" && result.fields.product) return `${result.fields.product.name} (${result.fields.product.sku})`;
	if (field === "quantity" && result.fields.quantity !== null) {
		const unit = result.fields.product?.unit ?? "unit";
		return `${result.fields.quantity} ${unit}${result.fields.quantity === 1 ? "" : "s"}`;
	}
	if (field === "sourceLocation") return result.fields.sourceLocation?.name ?? "";
	if (field === "destinationLocation") return result.fields.destinationLocation?.name ?? "";
	return "";
}
function clarificationRetryHelp(field) {
	if (field === "action") return "Please say Receive, Ship, Transfer, Cycle count, or Damage.";
	if (field === "product") return "Please say the item name or SKU clearly.";
	if (field === "quantity") return "Please say only the number of units.";
	return "Please say the warehouse location clearly.";
}
var pageDescriptions = {
	worker: {
		Overview: "See today’s work, stock activity and anything that needs your attention.",
		"My transactions": "See every inventory transaction included in today’s total.",
		"Cycle counts": "Review every physical count submitted today and its current status.",
		"Posted today": "See the validated inventory updates successfully posted today.",
		"Voice entry": "Record one clear inventory action and review it before stock changes.",
		"Task queue": "Complete the warehouse work assigned to you by a manager.",
		"My history": "Review your submitted, posted and pending inventory updates.",
		Settings: "Check your microphone, speaker and Warehouse Executive access."
	},
	manager: {
		Overview: "Monitor approvals, stock accuracy, low-stock risks and daily priorities.",
		Discrepancies: "Review physical-count differences, approve adjustments, request recounts and export manager reports.",
		Reservations: "Create stock requests and protect available quantity for confirmed demand.",
		Transactions: "Review pending stock changes, then search and export the complete authorized inventory ledger.",
		"Purchase Items": "View only the items below their safety level and the quantity that should be purchased.",
		"Task planning": "Assign clear daily warehouse work to available executives.",
		Catalog: "Maintain product units, safety stock and reorder settings.",
		Locations: "Manage warehouses, receiving areas, zones, shelves and bins used in inventory movements."
	},
	administrator: {
		Overview: "See user access, item availability and the health of essential services.",
		Items: "Search, track and edit every item from one clear workspace.",
		"Audit transactions": "Review the complete read-only inventory ledger, stock adjustments and audit evidence.",
		"User access": "Create accounts, update roles and control active user access.",
		"System health": "Check the live availability of database, identity, AI and supporting services."
	}
};
function pageDescription(role, page) {
	return pageDescriptions[role][page] ?? pageDescriptions[role].Overview;
}
function resolveManagerPage(page) {
	if (page === "Approvals" || page === "Audit history") return "Transactions";
	if (page === "Suppliers") return "Catalog";
	if (page === "Products & rules" || page === "Opening stock" || page === "Audit controls") return "Catalog";
	return page;
}
var STOCK_OUT_ACTIONS = new Set(["SHIP", "TRANSFER"]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var LayoutDashboard = createLucideIcon("LayoutDashboard", [
	["rect", {
		width: "7",
		height: "9",
		x: "3",
		y: "3",
		rx: "1",
		key: "10lvy0"
	}],
	["rect", {
		width: "7",
		height: "5",
		x: "14",
		y: "3",
		rx: "1",
		key: "16une8"
	}],
	["rect", {
		width: "7",
		height: "9",
		x: "14",
		y: "12",
		rx: "1",
		key: "1hutg5"
	}],
	["rect", {
		width: "7",
		height: "5",
		x: "3",
		y: "16",
		rx: "1",
		key: "ldoo1y"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Mic = createLucideIcon("Mic", [
	["path", {
		d: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z",
		key: "131961"
	}],
	["path", {
		d: "M19 10v2a7 7 0 0 1-14 0v-2",
		key: "1vc78b"
	}],
	["line", {
		x1: "12",
		x2: "12",
		y1: "19",
		y2: "22",
		key: "x3vr5v"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ClipboardCheck = createLucideIcon("ClipboardCheck", [
	["rect", {
		width: "8",
		height: "4",
		x: "8",
		y: "2",
		rx: "1",
		ry: "1",
		key: "tgr4d6"
	}],
	["path", {
		d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
		key: "116196"
	}],
	["path", {
		d: "m9 14 2 2 4-4",
		key: "df797q"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Boxes = createLucideIcon("Boxes", [
	["path", {
		d: "M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z",
		key: "lc1i9w"
	}],
	["path", {
		d: "m7 16.5-4.74-2.85",
		key: "1o9zyk"
	}],
	["path", {
		d: "m7 16.5 5-3",
		key: "va8pkn"
	}],
	["path", {
		d: "M7 16.5v5.17",
		key: "jnp8gn"
	}],
	["path", {
		d: "M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z",
		key: "8zsnat"
	}],
	["path", {
		d: "m17 16.5-5-3",
		key: "8arw3v"
	}],
	["path", {
		d: "m17 16.5 4.74-2.85",
		key: "8rfmw"
	}],
	["path", {
		d: "M17 16.5v5.17",
		key: "k6z78m"
	}],
	["path", {
		d: "M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z",
		key: "1xygjf"
	}],
	["path", {
		d: "M12 8 7.26 5.15",
		key: "1vbdud"
	}],
	["path", {
		d: "m12 8 4.74-2.85",
		key: "3rx089"
	}],
	["path", {
		d: "M12 13.5V8",
		key: "1io7kd"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var FileClock = createLucideIcon("FileClock", [
	["path", {
		d: "M16 22h2a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3",
		key: "37hlfg"
	}],
	["path", {
		d: "M14 2v4a2 2 0 0 0 2 2h4",
		key: "tnqrlb"
	}],
	["circle", {
		cx: "8",
		cy: "16",
		r: "6",
		key: "10v15b"
	}],
	["path", {
		d: "M9.5 17.5 8 16.25V14",
		key: "1o80t2"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Settings = createLucideIcon("Settings", [["path", {
	d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
	key: "1qme2f"
}], ["circle", {
	cx: "12",
	cy: "12",
	r: "3",
	key: "1v7zrd"
}]]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ArrowRightLeft = createLucideIcon("ArrowRightLeft", [
	["path", {
		d: "m16 3 4 4-4 4",
		key: "1x1c3m"
	}],
	["path", {
		d: "M20 7H4",
		key: "zbl0bi"
	}],
	["path", {
		d: "m8 21-4-4 4-4",
		key: "h9nckh"
	}],
	["path", {
		d: "M4 17h16",
		key: "g4d7ey"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Truck = createLucideIcon("Truck", [
	["path", {
		d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",
		key: "wrbu53"
	}],
	["path", {
		d: "M15 18H9",
		key: "1lyqi6"
	}],
	["path", {
		d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",
		key: "lysw3i"
	}],
	["circle", {
		cx: "17",
		cy: "18",
		r: "2",
		key: "332jqn"
	}],
	["circle", {
		cx: "7",
		cy: "18",
		r: "2",
		key: "19iecd"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var PackageCheck = createLucideIcon("PackageCheck", [
	["path", {
		d: "m16 16 2 2 4-4",
		key: "gfu2re"
	}],
	["path", {
		d: "M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14",
		key: "e7tb2h"
	}],
	["path", {
		d: "m7.5 4.27 9 5.15",
		key: "1c824w"
	}],
	["polyline", {
		points: "3.29 7 12 12 20.71 7",
		key: "ousv84"
	}],
	["line", {
		x1: "12",
		x2: "12",
		y1: "22",
		y2: "12",
		key: "a4e8g8"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Warehouse = createLucideIcon("Warehouse", [
	["path", {
		d: "M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z",
		key: "gksnxg"
	}],
	["path", {
		d: "M6 18h12",
		key: "9pbo8z"
	}],
	["path", {
		d: "M6 14h12",
		key: "4cwo0f"
	}],
	["rect", {
		width: "12",
		height: "12",
		x: "6",
		y: "10",
		key: "apd30q"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var UsersRound = createLucideIcon("UsersRound", [
	["path", {
		d: "M18 21a8 8 0 0 0-16 0",
		key: "3ypg7q"
	}],
	["circle", {
		cx: "10",
		cy: "8",
		r: "5",
		key: "o932ke"
	}],
	["path", {
		d: "M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3",
		key: "10s06x"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Activity = createLucideIcon("Activity", [["path", {
	d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
	key: "169zse"
}]]);
function currentPageIcon(role, page) {
	return (role === "worker" ? {
		Overview: LayoutDashboard,
		"Voice entry": Mic,
		"Task queue": ClipboardCheck,
		"Active items": Boxes,
		"My history": FileClock,
		Settings
	} : role === "manager" ? {
		Overview: LayoutDashboard,
		Transactions: ArrowRightLeft,
		"Purchase Items": Truck,
		"Task planning": ClipboardCheck,
		Catalog: PackageCheck,
		Locations: Warehouse
	} : {
		Overview: LayoutDashboard,
		Items: Boxes,
		"Audit transactions": FileClock,
		"User access": UsersRound,
		"System health": Activity
	})[page] ?? LayoutDashboard;
}
function HeaderPageIcon({ role, page }) {
	return import_react.createElement(currentPageIcon(role, page), {
		size: 20,
		strokeWidth: 2.1,
		"aria-hidden": true
	});
}
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var X = createLucideIcon("X", [["path", {
	d: "M18 6 6 18",
	key: "1bl5f8"
}], ["path", {
	d: "m6 6 12 12",
	key: "d8bk6v"
}]]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var UserRound = createLucideIcon("UserRound", [["circle", {
	cx: "12",
	cy: "8",
	r: "5",
	key: "1hypcn"
}], ["path", {
	d: "M20 21a8 8 0 0 0-16 0",
	key: "rfgkzh"
}]]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var SearchCheck = createLucideIcon("SearchCheck", [
	["path", {
		d: "m8 11 2 2 4-4",
		key: "1sed1v"
	}],
	["circle", {
		cx: "11",
		cy: "11",
		r: "8",
		key: "4ej97u"
	}],
	["path", {
		d: "m21 21-4.3-4.3",
		key: "1qie3q"
	}]
]);
var import_jsx_runtime = require_jsx_runtime();
function Brand() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "brand-mark grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#2874ff] to-[#1048b8] text-white shadow-[0_10px_30px_rgba(21,94,239,0.28)]",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Warehouse, {
				size: 23,
				strokeWidth: 2.2
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[15px] font-extrabold tracking-[-0.02em] text-[#102a56]",
			children: "Inventory Management"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7690b5]",
			children: "Voice intelligence"
		})] })]
	});
}
function AppSidebar({ role, displayName, activePage, onNavigate, mobileOpen, close, pendingApprovals = 0, pendingWorkerTasks = 0 }) {
	const workerItems = [
		[LayoutDashboard, "Home"],
		[ClipboardCheck, "Task queue"],
		[FileClock, "History"],
		[Settings, "Settings"]
	];
	const managerItems = [
		[LayoutDashboard, "Overview"],
		[ArrowRightLeft, "Transactions"],
		[SearchCheck, "Discrepancies"],
		[Truck, "Purchase Items"],
		[ClipboardCheck, "Task planning"],
		[PackageCheck, "Catalog"],
		[Warehouse, "Locations"]
	];
	const managerBadges = { Transactions: pendingApprovals };
	const workerBadges = { "Task queue": pendingWorkerTasks };
	const navGroups = role === "worker" ? [{
		heading: "Executive tools",
		items: workerItems
	}] : role === "manager" ? [{
		heading: "Management",
		items: managerItems
	}] : [{
		heading: "Administration",
		items: [
			[LayoutDashboard, "Overview"],
			[Boxes, "Items"],
			[FileClock, "Audit transactions"],
			[UsersRound, "User access"],
			[Activity, "System health"]
		]
	}];
	function navigateTo(label) {
		close();
		onNavigate(label);
		window.scrollTo({
			top: 0,
			behavior: "smooth"
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [mobileOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		"aria-label": "Close navigation",
		onClick: close,
		className: "fixed inset-0 z-30 bg-[#0b2343]/40 lg:hidden"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: `sidebar-shell fixed inset-y-0 left-0 z-40 flex w-[254px] flex-col px-5 py-6 transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: close,
					"aria-label": "Close navigation",
					className: "rounded-lg p-2 text-[#7890b0] lg:hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 19 })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sidebar-workspace mt-9 rounded-2xl px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#7892b8]",
					children: "Active workspace"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm font-extrabold text-[#17345f]",
					children: "Central Warehouse"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "sidebar-scroll mt-6 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1",
				children: navGroups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#9aabc1]",
						children: group.heading
					}), group.items.map(([Icon, label]) => {
						const badge = group.heading === "Management" ? managerBadges[label] ?? 0 : group.heading === "Executive tools" ? workerBadges[label] ?? 0 : 0;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => navigateTo(label),
							"aria-current": activePage === label ? "page" : void 0,
							className: `sidebar-nav-item flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${activePage === label ? "sidebar-nav-active text-white" : "sidebar-nav-idle text-[#627998]"}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
									size: 18,
									strokeWidth: 2
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "min-w-0 flex-1 truncate",
									children: label
								}),
								badge > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold leading-none ${activePage === label ? "bg-white/25 text-white" : "bg-[#fff4df] text-[#b36d0c]"}`,
									title: `${badge} transaction${badge === 1 ? "" : "s"} waiting for review`,
									children: badge
								})
							]
						}, label);
					})]
				}, group.heading))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sidebar-profile mt-5 shrink-0 rounded-2xl p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid h-9 w-9 place-items-center rounded-xl bg-[#e8effb] text-[#244a7e]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, { size: 18 })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-extrabold text-[#17345f]",
						children: displayName
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] font-semibold text-[#8295af]",
						children: roleLabel(role)
					})] })]
				})
			})
		]
	})] });
}
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Bell = createLucideIcon("Bell", [["path", {
	d: "M10.268 21a2 2 0 0 0 3.464 0",
	key: "vwvbt9"
}], ["path", {
	d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",
	key: "11g9vi"
}]]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var CheckCheck = createLucideIcon("CheckCheck", [["path", {
	d: "M18 6 7 17l-5-5",
	key: "116fxf"
}], ["path", {
	d: "m22 10-7.5 7.5L13 16",
	key: "ke71qq"
}]]);
var notificationTypeLabel = {
	NEW_DISCREPANCY: "New discrepancy",
	MAJOR_CRITICAL_DISCREPANCY: "Major discrepancy",
	RECOUNT_ASSIGNED: "Recount assigned",
	RECOUNT_COMPLETED: "Recount completed",
	DISCREPANCY_APPROVED: "Discrepancy approved",
	DISCREPANCY_REJECTED: "Discrepancy rejected",
	RESOLVED_AS_TRANSFER: "Resolved as transfer",
	CYCLE_COUNT_PLAN_ASSIGNED: "Month-end cycle count"
};
function NotificationsBell({ role, onNavigate }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [items, setItems] = (0, import_react.useState)([]);
	const [unread, setUnread] = (0, import_react.useState)(0);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	async function refresh() {
		const [list, count] = await Promise.all([fetchNotifications().catch(() => []), fetchUnreadNotificationCount().catch(() => 0)]);
		setItems(list);
		setUnread(count);
	}
	(0, import_react.useEffect)(() => {
		if (!open) return;
		let cancelled = false;
		const timer = window.setTimeout(() => {
			setLoading(true);
			setError("");
			refresh().catch(() => setError("Notifications could not be loaded.")).finally(() => {
				if (!cancelled) setLoading(false);
			});
		}, 0);
		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, [open]);
	(0, import_react.useEffect)(() => {
		fetchUnreadNotificationCount().then(setUnread).catch(() => void 0);
		const timer = window.setInterval(() => {
			fetchUnreadNotificationCount().then(setUnread).catch(() => void 0);
		}, 45e3);
		return () => window.clearInterval(timer);
	}, []);
	async function openNotification(item) {
		if (!item.readAt) {
			await markNotificationRead(item.id).catch(() => void 0);
			setUnread((value) => Math.max(0, value - 1));
			setItems((current) => current.map((candidate) => candidate.id === item.id ? {
				...candidate,
				readAt: (/* @__PURE__ */ new Date()).toISOString()
			} : candidate));
		}
		setOpen(false);
		if (item.linkType === "TASK") onNavigate(role === "worker" ? "Task queue" : "Task planning");
		else onNavigate(role === "worker" ? "My history" : "Discrepancies");
	}
	async function markAllRead() {
		const count = await markAllNotificationsRead().catch(() => ({ updated: 0 }));
		setUnread(0);
		setItems((current) => current.map((item) => ({
			...item,
			readAt: item.readAt ?? (/* @__PURE__ */ new Date()).toISOString()
		})));
		if (count.updated === 0) return;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			"aria-label": `Notifications${unread > 0 ? `, ${unread} unread` : ""}`,
			"aria-expanded": open,
			onClick: () => setOpen((value) => !value),
			className: "relative rounded-xl border border-[#dce5f1] p-2.5 text-[#6f84a3] transition hover:bg-[#f5f8fc] hover:text-[#29466f]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { size: 18 }), unread > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#c04343] px-1 text-[9px] font-black leading-none text-white",
				title: `${unread} unread notification${unread === 1 ? "" : "s"}`,
				children: unread > 99 ? "99+" : unread
			})]
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			"aria-label": "Close notifications",
			onClick: () => setOpen(false),
			className: "fixed inset-0 z-40 cursor-default",
			tabIndex: -1
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-label": "Notifications",
			className: "absolute right-0 top-[calc(100%+10px)] z-50 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-[#d8e5f7] bg-white shadow-[0_20px_55px_rgba(11,35,67,0.25)]",
			style: { animation: "dialog-in .22s ease both" },
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between border-b border-[#e9eef5] bg-[#f8faff] px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs font-extrabold text-[#17345f]",
					children: ["Notifications", unread > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "ml-2 rounded-full bg-[#ffecec] px-2 py-0.5 text-[10px] font-extrabold text-[#c04343]",
						children: [unread, " unread"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [unread > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => void markAllRead(),
						className: "flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-extrabold text-[#155eef] transition hover:bg-[#edf4ff]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCheck, { size: 13 }), " Mark all read"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Close notifications",
						onClick: () => setOpen(false),
						className: "rounded-lg p-1.5 text-[#8295af] transition hover:bg-[#edf1f6]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 15 })
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-h-[55vh] overflow-y-auto",
				children: [
					loading && items.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-4 py-8 text-center text-xs font-semibold text-[#8295af]",
						children: "Loading notifications…"
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-4 py-6 text-center text-xs font-semibold text-[#a73737]",
						children: error
					}),
					!loading && !error && items.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-4 py-10 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, {
								size: 22,
								className: "mx-auto text-[#c9d5e4]"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm font-extrabold text-[#24466f]",
								children: "No notifications"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-[#7b8fa9]",
								children: "Updates about discrepancies and recounts appear here."
							})
						]
					}),
					items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => void openNotification(item),
						className: `block w-full border-b border-[#eef2f7] px-4 py-3 text-left transition last:border-0 hover:bg-[#f8faff] ${item.readAt ? "opacity-75" : "bg-[#f4f9ff]"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate text-xs font-extrabold text-[#29466f]",
								children: notificationTypeLabel[item.type] ?? item.type.replaceAll("_", " ")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "shrink-0 text-[9px] font-bold text-[#9aabc1]",
								children: new Intl.DateTimeFormat("en", {
									day: "2-digit",
									month: "short",
									hour: "2-digit",
									minute: "2-digit"
								}).format(new Date(item.createdAt))
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 line-clamp-2 text-[11px] font-semibold leading-4 text-[#6c829f]",
							children: [
								item.title,
								" — ",
								item.message
							]
						})]
					}, item.id))
				]
			})]
		})] })]
	});
}
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Search = createLucideIcon("Search", [["circle", {
	cx: "11",
	cy: "11",
	r: "8",
	key: "4ej97u"
}], ["path", {
	d: "m21 21-4.3-4.3",
	key: "1qie3q"
}]]);
function InventorySearch({ role, onNavigate }) {
	const [query, setQuery] = (0, import_react.useState)("");
	const [data, setData] = (0, import_react.useState)(null);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(false);
	async function prepareSearch() {
		setOpen(true);
		if (data || loading) return;
		setLoading(true);
		try {
			setData(await fetchInventorySnapshot());
		} catch {
			setData(null);
		} finally {
			setLoading(false);
		}
	}
	const results = (0, import_react.useMemo)(() => {
		const term = query.trim().toLowerCase();
		if (term.length < 2 || !data) return [];
		const productSection = role === "administrator" || role === "manager" ? "admin-warehouse-setup" : "voice-entry";
		const locationSection = role === "administrator" || role === "manager" ? "admin-locations" : "voice-entry";
		const transactionSection = role === "manager" ? "manager-audit-history" : role === "administrator" ? "admin-items" : "worker-history";
		return [
			...data.products.filter((item) => `${item.sku} ${item.name}`.toLowerCase().includes(term)).slice(0, 4).map((item) => ({
				id: `p-${item.id}`,
				title: item.name,
				detail: `${item.sku} · Product`,
				section: productSection,
				icon: PackageCheck
			})),
			...data.locations.filter((item) => `${item.code} ${item.name}`.toLowerCase().includes(term)).slice(0, 3).map((item) => ({
				id: `l-${item.id}`,
				title: item.name,
				detail: `${item.code} · Location`,
				section: locationSection,
				icon: Warehouse
			})),
			...data.transactions.filter((item) => `${item.id} ${item.action} ${item.product.name} ${item.referenceNumber ?? ""}`.toLowerCase().includes(term)).slice(0, 4).map((item) => ({
				id: `t-${item.id}`,
				title: `${item.action.replaceAll("_", " ")} · ${item.product.name}`,
				detail: `TX-${item.id.slice(0, 8).toUpperCase()} · ${item.status}`,
				section: transactionSection,
				icon: FileClock
			}))
		].slice(0, 8);
	}, [
		data,
		query,
		role
	]);
	function selectResult(section) {
		setOpen(false);
		setQuery("");
		onNavigate({
			"admin-warehouse-setup": "Catalog",
			"admin-locations": "Locations",
			"admin-items": "Items",
			"manager-audit-history": "Transactions",
			"voice-entry": "Voice entry",
			"worker-history": "My history"
		}[section] ?? "Overview");
		window.scrollTo({
			top: 0,
			behavior: "smooth"
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative hidden sm:block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 rounded-xl border border-[#dce5f1] bg-[#f8fafc] px-3 transition focus-within:border-[#8db0ea] focus-within:bg-white focus-within:shadow-[0_8px_24px_rgba(21,94,239,0.1)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
					size: 16,
					className: "text-[#8497b0]"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: query,
					onFocus: () => void prepareSearch(),
					onChange: (event) => {
						setQuery(event.target.value);
						setOpen(true);
					},
					onKeyDown: (event) => {
						if (event.key === "Escape") {
							setOpen(false);
							event.currentTarget.blur();
						}
					},
					"aria-label": "Search inventory",
					placeholder: "Search items, locations, TX…",
					className: "h-10 w-44 bg-transparent text-xs font-semibold outline-none xl:w-60"
				}),
				query && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setQuery(""),
					"aria-label": "Clear search",
					className: "text-[#8497b0] hover:text-[#155eef]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14 })
				})
			]
		}), open && query.trim().length >= 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute right-0 top-12 z-50 w-[340px] overflow-hidden rounded-2xl border border-[#dce5f1] bg-white shadow-[0_18px_55px_rgba(16,45,82,0.18)]",
			children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-5 py-6 text-center text-xs font-bold text-[#7b8fa9]",
				children: "Searching inventory\\u2026"
			}) : results.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "p-2",
				children: results.map((result) => {
					const ResultIcon = result.icon;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => selectResult(result.section),
						className: "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#f3f7ff]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#edf4ff] text-[#155eef]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultIcon, { size: 17 })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-xs font-extrabold text-[#17345f]",
								children: result.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-0.5 block truncate text-[10px] font-semibold text-[#8295af]",
								children: result.detail
							})]
						})]
					}, result.id);
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 py-7 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
						size: 21,
						className: "mx-auto text-[#9aabc1]"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs font-extrabold text-[#496482]",
						children: "No matching inventory records"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[10px] text-[#8a9bb3]",
						children: "Try a product name, SKU, location or transaction number."
					})
				]
			})
		})]
	});
}
function LoadingState({ title, description }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-screen place-items-center bg-[#f3f7fc] px-5 text-[#17345f]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-[24px] border border-[#dfe7f2] bg-white px-8 py-7 text-center shadow-[0_20px_55px_rgba(15,45,85,0.1)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto grid h-12 w-12 animate-pulse place-items-center rounded-2xl bg-[#edf4ff] text-[#155eef]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { size: 23 })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm font-extrabold text-[#17345f]",
					children: title ?? "Checking secure session…"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-[#7b8fa9]",
					children: description ?? "Connecting to Inventory Management identity services"
				})
			]
		})
	});
}
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ChevronDown = createLucideIcon("ChevronDown", [["path", {
	d: "m6 9 6 6 6-6",
	key: "qrunsl"
}]]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Sparkles = createLucideIcon("Sparkles", [
	["path", {
		d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",
		key: "4pj2yx"
	}],
	["path", {
		d: "M20 3v4",
		key: "1olli1"
	}],
	["path", {
		d: "M22 5h-4",
		key: "1gvqau"
	}],
	["path", {
		d: "M4 17v2",
		key: "vumght"
	}],
	["path", {
		d: "M5 18H3",
		key: "zchphs"
	}]
]);
function RoleSelector({ role, setRole }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "role-selector grid gap-3 sm:grid-cols-3",
		"aria-label": "Select account role",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setRole("worker"),
				"aria-pressed": role === "worker",
				className: `role-card rounded-2xl border p-4 text-left transition ${role === "worker" ? "role-card-active border-[#155eef] bg-[#edf4ff] text-[#155eef] shadow-[0_8px_20px_rgba(21,94,239,0.1)]" : "role-card-idle border-[#dce5f1] bg-white text-[#617796] hover:border-[#a9c1e8]"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-2 text-sm font-extrabold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Warehouse, { size: 18 }), "Warehouse Executive"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-1 block text-[11px] font-semibold leading-4 opacity-80",
					children: "Count and move stock"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setRole("administrator"),
				"aria-pressed": role === "administrator",
				className: `role-card rounded-2xl border p-4 text-left transition ${role === "administrator" ? "role-card-active border-[#155eef] bg-[#edf4ff] text-[#155eef] shadow-[0_8px_20px_rgba(21,94,239,0.1)]" : "role-card-idle border-[#dce5f1] bg-white text-[#617796] hover:border-[#a9c1e8]"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-2 text-sm font-extrabold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { size: 18 }), "Administrator"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-1 block text-[11px] font-semibold opacity-75",
					children: "Configure access and system controls"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setRole("manager"),
				"aria-pressed": role === "manager",
				className: `role-card rounded-2xl border p-4 text-left transition ${role === "manager" ? "role-card-active border-[#155eef] bg-[#edf4ff] text-[#155eef] shadow-[0_8px_20px_rgba(21,94,239,0.1)]" : "role-card-idle border-[#dce5f1] bg-white text-[#617796] hover:border-[#a9c1e8]"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-2 text-sm font-extrabold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { size: 18 }), "Manager"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-1 block text-[11px] font-semibold leading-4 opacity-80",
					children: "Review and approve"
				})]
			})
		]
	});
}
function AuthenticationPage({ role, setRole, onLogin, onLegacyLogin, authError, isLoading }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "login-stage min-h-screen px-5 py-8 text-[#17345f] md:grid md:place-items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "login-shell mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1120px] overflow-hidden rounded-[30px] border border-white bg-white shadow-[0_30px_80px_rgba(15,45,85,0.14)] md:min-h-[680px] md:grid-cols-[1.05fr_0.95fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "login-visual relative hidden overflow-hidden bg-[#0d3264] p-12 text-white md:flex md:flex-col md:justify-between",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -right-28 -top-24 h-80 w-80 rounded-full border-[55px] border-white/5" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -bottom-32 -left-28 h-96 w-96 rounded-full bg-[#155eef]/25 blur-2xl" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#155eef]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Warehouse, { size: 23 })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-lg font-extrabold",
							children: "Inventory Management"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative max-w-[470px]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#bdd3ff]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 14 }), "AI-enabled warehouse operations"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
								className: "text-[42px] font-extrabold leading-[1.08] tracking-[-0.045em]",
								children: [
									"Inventory updates,",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
									"spoken naturally."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-5 max-w-[430px] text-base leading-7 text-[#c6d6ec]",
								children: "Give warehouse teams a faster way to receive, move, count and report stock\\u2014with confirmation and complete accountability."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative grid grid-cols-3 gap-3",
						children: [
							["Speak", "Natural voice entry"],
							["Confirm", "Executive-controlled"],
							["Audit", "Every action recorded"]
						].map(([title, detail]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl border border-white/10 bg-white/[0.07] p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-extrabold",
								children: title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-[11px] leading-4 text-[#adc3e0]",
								children: detail
							})]
						}, title))
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "flex items-center justify-center p-7 sm:p-12",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-[420px]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-10 md:hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-extrabold uppercase tracking-[0.17em] text-[#155eef]",
							children: "Secure access"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-3 text-[32px] font-extrabold tracking-[-0.04em] text-[#102a56]",
							children: "Welcome back"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-6 text-[#7489a7]",
							children: "Select a workspace, then sign in. Your PostgreSQL account role controls access."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "mt-8 space-y-5",
							onSubmit: (event) => {
								event.preventDefault();
								const formData = new FormData(event.currentTarget);
								onLogin(String(formData.get("employeeId") ?? ""), String(formData.get("password") ?? ""));
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
									className: "mb-2 text-sm font-bold text-[#29466f]",
									children: "Workspace"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleSelector, {
									role,
									setRole
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mb-2 block text-sm font-bold text-[#29466f]",
										children: "Employee ID or email"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3 rounded-xl border border-[#dce5f1] bg-[#fbfcfe] px-4 focus-within:border-[#6f9cff] focus-within:ring-4 focus-within:ring-[#e7efff]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, {
											size: 18,
											className: "text-[#7890b0]"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											"aria-label": "Employee ID or email",
											name: "employeeId",
											autoComplete: "username",
											required: true,
											placeholder: "worker1 or name@example.com",
											className: "h-12 w-full bg-transparent text-sm font-semibold text-[#17345f] outline-none"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mb-2 block text-sm font-bold text-[#29466f]",
										children: "Password"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										"aria-label": "Password",
										name: "password",
										type: "password",
										autoComplete: "current-password",
										required: true,
										className: "h-12 w-full rounded-xl border border-[#dce5f1] bg-[#fbfcfe] px-4 text-sm font-semibold text-[#17345f] outline-none focus:border-[#6f9cff] focus:ring-4 focus:ring-[#e7efff]"
									})]
								}),
								authError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "rounded-xl border border-[#ffd1d1] bg-[#fff2f2] px-4 py-3 text-sm font-semibold text-[#a73737]",
									children: authError
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "submit",
									disabled: isLoading,
									className: "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#155eef] text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(21,94,239,0.26)] transition hover:bg-[#0f4fd4] disabled:cursor-wait disabled:opacity-65",
									children: [isLoading ? "Signing in securely…" : `Sign in to ${formatRoleLabel(role)}`, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
										size: 17,
										className: "-rotate-90"
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "my-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9aacbf]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-[#e7edf5]" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Legacy access" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-[#e7edf5]" })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: isLoading,
							onClick: () => {
								const form = document.querySelector("form");
								onLegacyLogin(String(new FormData(form ?? void 0).get("employeeId") ?? ""));
							},
							className: "h-11 w-full rounded-xl border border-[#cdd9e9] bg-white text-sm font-extrabold text-[#35577f] transition hover:border-[#9db6d9] hover:bg-[#f7faff] disabled:cursor-wait disabled:opacity-65",
							children: "Continue with legacy Keycloak sign-in"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-7 flex items-center justify-center gap-2 rounded-xl bg-[#f4f8fd] px-4 py-3 text-center text-xs font-semibold text-[#6c82a2]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
								size: 16,
								className: "text-[#16865b]"
							}), "Local passwords are securely hashed by the API. Legacy Keycloak sign-in remains available during migration."]
						})
					]
				})
			})]
		})
	});
}
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var LockKeyhole = createLucideIcon("LockKeyhole", [
	["circle", {
		cx: "12",
		cy: "16",
		r: "1",
		key: "1au0dj"
	}],
	["rect", {
		x: "3",
		y: "10",
		width: "18",
		height: "12",
		rx: "2",
		key: "6s8ecr"
	}],
	["path", {
		d: "M7 10V7a5 5 0 0 1 10 0v3",
		key: "1pqi11"
	}]
]);
function ChangePasswordPage({ displayName, onSubmit, authError, isLoading }) {
	const [validationError, setValidationError] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "login-stage min-h-screen px-5 py-8 text-[#17345f] md:grid md:place-items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mx-auto w-full max-w-[520px] rounded-[30px] border border-white bg-white p-7 shadow-[0_30px_80px_rgba(15,45,85,0.14)] sm:p-12",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-8 flex items-center justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid h-12 w-12 place-items-center rounded-2xl bg-[#edf4ff] text-[#155eef]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockKeyhole, { size: 22 })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-extrabold uppercase tracking-[0.17em] text-[#155eef]",
					children: "Password update required"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 text-[30px] font-extrabold tracking-[-0.04em] text-[#102a56]",
					children: "Create your private password"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm leading-6 text-[#7489a7]",
					children: [
						"Welcome, ",
						displayName || "team member",
						". Your temporary password must be replaced before you can open inventory workspaces."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-8 space-y-5",
					onSubmit: (event) => {
						event.preventDefault();
						const formData = new FormData(event.currentTarget);
						const currentPassword = String(formData.get("currentPassword") ?? "");
						const newPassword = String(formData.get("newPassword") ?? "");
						const confirmPassword = String(formData.get("confirmPassword") ?? "");
						if (newPassword.length < 12) {
							setValidationError("Use at least 12 characters for your new password.");
							return;
						}
						if (newPassword !== confirmPassword) {
							setValidationError("The new passwords do not match.");
							return;
						}
						setValidationError("");
						onSubmit(currentPassword, newPassword);
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mb-2 block text-sm font-bold text-[#29466f]",
								children: "Current temporary password"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								"aria-label": "Current temporary password",
								name: "currentPassword",
								type: "password",
								autoComplete: "current-password",
								required: true,
								className: "h-12 w-full rounded-xl border border-[#dce5f1] bg-[#fbfcfe] px-4 text-sm font-semibold text-[#17345f] outline-none focus:border-[#6f9cff] focus:ring-4 focus:ring-[#e7efff]"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mb-2 block text-sm font-bold text-[#29466f]",
								children: "New password"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								"aria-label": "New password",
								name: "newPassword",
								type: "password",
								autoComplete: "new-password",
								minLength: 12,
								required: true,
								className: "h-12 w-full rounded-xl border border-[#dce5f1] bg-[#fbfcfe] px-4 text-sm font-semibold text-[#17345f] outline-none focus:border-[#6f9cff] focus:ring-4 focus:ring-[#e7efff]"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mb-2 block text-sm font-bold text-[#29466f]",
								children: "Confirm new password"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								"aria-label": "Confirm new password",
								name: "confirmPassword",
								type: "password",
								autoComplete: "new-password",
								minLength: 12,
								required: true,
								className: "h-12 w-full rounded-xl border border-[#dce5f1] bg-[#fbfcfe] px-4 text-sm font-semibold text-[#17345f] outline-none focus:border-[#6f9cff] focus:ring-4 focus:ring-[#e7efff]"
							})]
						}),
						(validationError || authError) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-xl border border-[#ffd1d1] bg-[#fff2f2] px-4 py-3 text-sm font-semibold text-[#a73737]",
							children: validationError || authError
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: isLoading,
							className: "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#155eef] text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(21,94,239,0.26)] transition hover:bg-[#0f4fd4] disabled:cursor-wait disabled:opacity-65",
							children: isLoading ? "Updating password…" : "Save password and continue"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-7 flex items-center justify-center gap-2 rounded-xl bg-[#f4f8fd] px-4 py-3 text-center text-xs font-semibold text-[#6c82a2]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
						size: 16,
						className: "text-[#16865b]"
					}), "Passwords are hashed by the API and never stored in the browser."]
				})
			]
		})
	});
}
var roleToWorkspace = {
	WORKER: "worker",
	MANAGER: "manager",
	ADMINISTRATOR: "administrator"
};
function workspaceForUser(user) {
	return roleToWorkspace[user.role];
}
/** Workspace selection controls navigation only; it never grants access. */
function userCanUseWorkspace(user, workspace) {
	return workspaceForUser(user) === workspace;
}
function offlineOwnerForUser(user) {
	return `nirka-user:${user.id}`;
}
function useLocalAuth() {
	const [ready, setReady] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [user, setUser] = (0, import_react.useState)(null);
	const [provider, setProvider] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		let active = true;
		setInventoryAuthFailureHandler(() => {
			if (!active) return;
			setUser(null);
			setProvider(null);
			setError("Your secure session expired. Please sign in again.");
		});
		refreshLocalSession().then((result) => {
			if (!active) return;
			setUser(result.user);
			setProvider("local");
		}).catch(() => void 0).finally(() => {
			if (active) setReady(true);
		});
		return () => {
			active = false;
			setInventoryAuthFailureHandler();
		};
	}, []);
	return {
		ready,
		loading,
		user,
		provider,
		error,
		login: (0, import_react.useCallback)(async (identifier, password) => {
			setLoading(true);
			setError("");
			try {
				const result = await loginLocal(identifier, password);
				setUser(result.user);
				setProvider("local");
				return result.user;
			} catch (cause) {
				setError(cause instanceof Error ? cause.message : "Invalid credentials.");
				throw cause;
			} finally {
				setLoading(false);
			}
		}, []),
		changePassword: (0, import_react.useCallback)(async (currentPassword, newPassword) => {
			setLoading(true);
			setError("");
			try {
				const result = await changeLocalPassword(currentPassword, newPassword);
				setUser(result.user);
				setProvider("local");
				return result.user;
			} catch (cause) {
				setError(cause instanceof Error ? cause.message : "Password change failed.");
				throw cause;
			} finally {
				setLoading(false);
			}
		}, []),
		logout: (0, import_react.useCallback)(async () => {
			setLoading(true);
			try {
				await logoutLocal();
			} finally {
				setUser(null);
				setProvider(null);
				setLoading(false);
			}
		}, []),
		adoptExternalSession: (0, import_react.useCallback)((externalUser) => {
			setUser(externalUser);
			setProvider("keycloak");
			setError("");
		}, []),
		clearSession: (0, import_react.useCallback)(() => {
			setInventoryAccessToken();
			setUser(null);
			setProvider(null);
		}, []),
		clearError: (0, import_react.useCallback)(() => setError(""), [])
	};
}
function useNetworkStatus() {
	const [isOnline, setIsOnline] = (0, import_react.useState)(() => navigator.onLine);
	const [pendingSyncCount, setPendingSyncCount] = (0, import_react.useState)(0);
	const [syncState, setSyncState] = (0, import_react.useState)("idle");
	(0, import_react.useEffect)(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => void 0);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);
	return {
		isOnline,
		pendingSyncCount,
		syncState,
		setPendingSyncCount,
		setSyncState
	};
}
function useOfflineSync(loggedIn, showingWorkerInterface, isOnline, pendingSyncCount, syncState, setPendingSyncCount, setSyncState, ownerId, legacyOwnerIds = []) {
	(0, import_react.useEffect)(() => {
		if (!loggedIn || !showingWorkerInterface || !ownerId) {
			setPendingSyncCount(0);
			setSyncState("idle");
			return;
		}
		let active = true;
		let syncing = false;
		const refreshAndSynchronize = async () => {
			try {
				const { countOfflineInventoryUpdates, migrateOfflineInventoryOwner, synchronizeOfflineInventoryUpdates } = await import("./offline-queue-DNfLoaqn.mjs");
				await migrateOfflineInventoryOwner(ownerId.slice(11), legacyOwnerIds);
				const queued = await countOfflineInventoryUpdates(ownerId);
				if (!active) return;
				setPendingSyncCount(queued);
				if (!navigator.onLine || queued === 0 || syncing) return;
				syncing = true;
				setSyncState("syncing");
				const result = await synchronizeOfflineInventoryUpdates(ownerId);
				if (!active) return;
				setPendingSyncCount(result.remaining);
				setSyncState(result.lastError ? "error" : "complete");
			} catch {
				if (active) setSyncState("error");
			} finally {
				syncing = false;
			}
		};
		const setup = async () => {
			const { offlineQueueChangedEvent } = await import("./offline-queue-DNfLoaqn.mjs");
			const handleQueueChange = () => void refreshAndSynchronize();
			window.addEventListener(offlineQueueChangedEvent, handleQueueChange);
			const timer = window.setInterval(() => {
				if (navigator.onLine) refreshAndSynchronize();
			}, 3e4);
			refreshAndSynchronize();
			return () => {
				active = false;
				window.clearInterval(timer);
				window.removeEventListener(offlineQueueChangedEvent, handleQueueChange);
			};
		};
		const cleanup = setup();
		return () => {
			cleanup.then((fn) => fn());
		};
	}, [
		isOnline,
		loggedIn,
		showingWorkerInterface,
		ownerId,
		legacyOwnerIds.join(","),
		setPendingSyncCount,
		setSyncState
	]);
}
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var TriangleAlert = createLucideIcon("TriangleAlert", [
	["path", {
		d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
		key: "wmoenq"
	}],
	["path", {
		d: "M12 9v4",
		key: "juzpu7"
	}],
	["path", {
		d: "M12 17h.01",
		key: "p32p05"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ArrowDownToLine = createLucideIcon("ArrowDownToLine", [
	["path", {
		d: "M12 17V3",
		key: "1cwfxf"
	}],
	["path", {
		d: "m6 11 6 6 6-6",
		key: "12ii2o"
	}],
	["path", {
		d: "M19 21H5",
		key: "150jfl"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var BellRing = createLucideIcon("BellRing", [
	["path", {
		d: "M10.268 21a2 2 0 0 0 3.464 0",
		key: "vwvbt9"
	}],
	["path", {
		d: "M22 8c0-2.3-.8-4.3-2-6",
		key: "5bb3ad"
	}],
	["path", {
		d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",
		key: "11g9vi"
	}],
	["path", {
		d: "M4 2C2.8 3.7 2 5.7 2 8",
		key: "tap9e0"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Camera = createLucideIcon("Camera", [["path", {
	d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",
	key: "1tc9qg"
}], ["circle", {
	cx: "12",
	cy: "13",
	r: "3",
	key: "1vg3eu"
}]]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var CircleCheck = createLucideIcon("CircleCheck", [["circle", {
	cx: "12",
	cy: "12",
	r: "10",
	key: "1mglay"
}], ["path", {
	d: "m9 12 2 2 4-4",
	key: "dzmm74"
}]]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Clock3 = createLucideIcon("Clock3", [["circle", {
	cx: "12",
	cy: "12",
	r: "10",
	key: "1mglay"
}], ["polyline", {
	points: "12 6 12 12 16.5 12",
	key: "1aq6pp"
}]]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ImagePlus = createLucideIcon("ImagePlus", [
	["path", {
		d: "M16 5h6",
		key: "1vod17"
	}],
	["path", {
		d: "M19 2v6",
		key: "4bpg5p"
	}],
	["path", {
		d: "M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5",
		key: "1ue2ih"
	}],
	["path", {
		d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",
		key: "1xmnt7"
	}],
	["circle", {
		cx: "9",
		cy: "9",
		r: "2",
		key: "af1f0g"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var PackageMinus = createLucideIcon("PackageMinus", [
	["path", {
		d: "M16 16h6",
		key: "100bgy"
	}],
	["path", {
		d: "M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14",
		key: "e7tb2h"
	}],
	["path", {
		d: "m7.5 4.27 9 5.15",
		key: "1c824w"
	}],
	["polyline", {
		points: "3.29 7 12 12 20.71 7",
		key: "ousv84"
	}],
	["line", {
		x1: "12",
		x2: "12",
		y1: "22",
		y2: "12",
		key: "a4e8g8"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var RefreshCcw = createLucideIcon("RefreshCcw", [
	["path", {
		d: "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
		key: "14sxne"
	}],
	["path", {
		d: "M3 3v5h5",
		key: "1xhq8a"
	}],
	["path", {
		d: "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16",
		key: "1hlbsb"
	}],
	["path", {
		d: "M16 16h5v5",
		key: "ccwih5"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Trash2 = createLucideIcon("Trash2", [
	["path", {
		d: "M3 6h18",
		key: "d0wm0j"
	}],
	["path", {
		d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",
		key: "4alrt4"
	}],
	["path", {
		d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",
		key: "v07s0e"
	}],
	["line", {
		x1: "10",
		x2: "10",
		y1: "11",
		y2: "17",
		key: "1uufr5"
	}],
	["line", {
		x1: "14",
		x2: "14",
		y1: "11",
		y2: "17",
		key: "xtxkd"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Volume2 = createLucideIcon("Volume2", [
	["path", {
		d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",
		key: "uqj9uw"
	}],
	["path", {
		d: "M16 9a5 5 0 0 1 0 6",
		key: "1q6k2b"
	}],
	["path", {
		d: "M19.364 18.364a9 9 0 0 0 0-12.728",
		key: "ijwkga"
	}]
]);
var databaseName = "nirka-inventory-offline";
var databaseVersion = 2;
var storeName = "pending-updates";
var offlineQueueChangedEvent = "nirka-offline-queue-changed";
function canonicalOfflineOwnerId(userId) {
	return `nirka-user:${userId}`;
}
/** Pure, idempotent owner migration used by the IndexedDB migration below. */
function migrateOfflineInventoryOwnerRecords(records, canonicalOwnerId, legacyOwnerIds) {
	const legacyOwners = new Set(legacyOwnerIds.filter((ownerId) => ownerId && ownerId !== canonicalOwnerId));
	return records.map((record) => legacyOwners.has(record.ownerId) ? {
		...record,
		ownerId: canonicalOwnerId
	} : record);
}
function openOfflineDatabase() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(databaseName, databaseVersion);
		request.onupgradeneeded = () => {
			const database = request.result;
			const store = database.objectStoreNames.contains(storeName) ? request.transaction?.objectStore(storeName) : database.createObjectStore(storeName, { keyPath: "id" });
			if (store && !store.indexNames.contains("ownerId")) store.createIndex("ownerId", "ownerId", { unique: false });
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error ?? /* @__PURE__ */ new Error("Offline storage could not be opened."));
	});
}
function waitForRequest(request) {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error ?? /* @__PURE__ */ new Error("Offline storage request failed."));
	});
}
function waitForTransaction(transaction) {
	return new Promise((resolve, reject) => {
		transaction.oncomplete = () => resolve();
		transaction.onerror = () => reject(transaction.error ?? /* @__PURE__ */ new Error("Offline storage update failed."));
		transaction.onabort = () => reject(transaction.error ?? /* @__PURE__ */ new Error("Offline storage update stopped."));
	});
}
function announceQueueChange() {
	window.dispatchEvent(new Event(offlineQueueChangedEvent));
}
async function listOfflineInventoryUpdates(ownerId) {
	const database = await openOfflineDatabase();
	try {
		const transaction = database.transaction(storeName, "readonly");
		const completion = waitForTransaction(transaction);
		const records = await waitForRequest(transaction.objectStore(storeName).index("ownerId").getAll(ownerId));
		await completion;
		return records.sort((left, right) => left.queuedAt.localeCompare(right.queuedAt));
	} finally {
		database.close();
	}
}
async function countOfflineInventoryUpdates(ownerId) {
	return (await listOfflineInventoryUpdates(ownerId)).length;
}
/** Move records from the old Keycloak-subject owner to the canonical
* PostgreSQL user owner. Re-running this function is a no-op. */
async function migrateOfflineInventoryOwner(userId, legacyOwnerIds) {
	const canonicalOwnerId = canonicalOfflineOwnerId(userId);
	if (legacyOwnerIds.length === 0) return 0;
	const database = await openOfflineDatabase();
	let migrated = 0;
	try {
		const transaction = database.transaction(storeName, "readwrite");
		const completion = waitForTransaction(transaction);
		const store = transaction.objectStore(storeName);
		const records = await waitForRequest(store.getAll());
		migrateOfflineInventoryOwnerRecords(records, canonicalOwnerId, legacyOwnerIds).forEach((record, index) => {
			if (record.ownerId !== records[index]?.ownerId) {
				migrated += 1;
				store.put(record);
			}
		});
		await completion;
	} finally {
		database.close();
	}
	if (migrated > 0) announceQueueChange();
	return migrated;
}
async function enqueueOfflineInventoryUpdate(input) {
	const database = await openOfflineDatabase();
	const update = {
		id: input.clientRequestId,
		ownerId: input.ownerId,
		clientRequestId: input.clientRequestId,
		extraction: input.extraction,
		queuedAt: (/* @__PURE__ */ new Date()).toISOString(),
		attempts: 0
	};
	try {
		const transaction = database.transaction(storeName, "readwrite");
		const completion = waitForTransaction(transaction);
		transaction.objectStore(storeName).put(update);
		await completion;
	} finally {
		database.close();
	}
	announceQueueChange();
	return update;
}
async function removeOfflineInventoryUpdate(id) {
	const database = await openOfflineDatabase();
	try {
		const transaction = database.transaction(storeName, "readwrite");
		const completion = waitForTransaction(transaction);
		transaction.objectStore(storeName).delete(id);
		await completion;
	} finally {
		database.close();
	}
}
async function recordOfflineSyncFailure(update, error) {
	const database = await openOfflineDatabase();
	const message = error instanceof Error ? error.message.slice(0, 300) : "Synchronization failed.";
	try {
		const transaction = database.transaction(storeName, "readwrite");
		const completion = waitForTransaction(transaction);
		transaction.objectStore(storeName).put({
			...update,
			attempts: update.attempts + 1,
			lastError: message
		});
		await completion;
	} finally {
		database.close();
	}
	return message;
}
async function synchronizeOfflineInventoryUpdates(ownerId) {
	const updates = await listOfflineInventoryUpdates(ownerId);
	let synced = 0;
	let lastError;
	for (const update of updates) try {
		await confirmInventoryTransaction((await createPendingInventoryTransaction(update.extraction, update.clientRequestId)).id);
		await removeOfflineInventoryUpdate(update.id);
		synced += 1;
	} catch (error) {
		lastError = await recordOfflineSyncFailure(update, error);
		break;
	}
	const remaining = await countOfflineInventoryUpdates(ownerId);
	announceQueueChange();
	return {
		synced,
		remaining,
		lastError
	};
}
/**
* Animated counter that counts up to the target value on mount/change.
*/
function AnimatedCounter({ value, duration = 600, decimals = 0 }) {
	const [display, setDisplay] = (0, import_react.useState)(value);
	const prevRef = (0, import_react.useRef)(value);
	const frameRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const start = prevRef.current;
		const end = value;
		if (start === end) return;
		if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			prevRef.current = end;
			const jumpFrame = requestAnimationFrame(() => setDisplay(end));
			return () => cancelAnimationFrame(jumpFrame);
		}
		const startTime = performance.now();
		const animate = (now) => {
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			setDisplay(Math.round(start + (end - start) * eased));
			if (progress < 1) frameRef.current = requestAnimationFrame(animate);
		};
		prevRef.current = end;
		frameRef.current = requestAnimationFrame(animate);
		return () => {
			if (frameRef.current !== null) {
				cancelAnimationFrame(frameRef.current);
				frameRef.current = null;
			}
		};
	}, [value, duration]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: display.toLocaleString(void 0, {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals
	}) });
}
/**
* Animated status indicator with glow.
*/
function StatusPulse({ status, size = 7 }) {
	const color = {
		online: {
			bg: "#20ad76",
			shadow: "rgba(32,173,118,0.5)"
		},
		offline: {
			bg: "#e08a1d",
			shadow: "rgba(224,138,29,0.5)"
		},
		warning: {
			bg: "#d47b08",
			shadow: "rgba(212,123,8,0.5)"
		},
		processing: {
			bg: "#155eef",
			shadow: "rgba(21,94,239,0.5)"
		}
	}[status];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "inline-block rounded-full",
		"aria-hidden": "true",
		style: {
			width: size,
			height: size,
			background: color.bg,
			boxShadow: `0 0 0 0 ${color.shadow}`,
			animation: status === "online" ? "live-pulse 2s infinite" : status === "offline" ? "offline-pulse 1.6s infinite" : status === "processing" ? "processing-pulse 1.2s ease-in-out infinite" : "warning-blink 1.2s ease-in-out infinite"
		}
	});
}
function MetricCard({ label, value, detail, icon: Icon, tone = "blue", onClick, selected = false }) {
	const tones = {
		blue: "bg-[#edf4ff] text-[#155eef]",
		green: "bg-[#eaf8f1] text-[#16865b]",
		amber: "bg-[#fff5df] text-[#d47b08]",
		violet: "bg-[#f2efff] text-[#7257d6]"
	};
	const numericValue = value !== "—" && value !== "" && !isNaN(Number(value.replace(/[^0-9.-]/g, ""))) ? Number(value.replace(/[^0-9.-]/g, "")) : null;
	const content = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "metric-card-glow",
			"aria-hidden": "true"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold text-[#657a99]",
						children: label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-[28px] font-extrabold tracking-[-0.04em] text-[#112c57]",
						children: numericValue !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedCounter, { value: numericValue }, numericValue) : value
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1.5 text-xs font-medium text-[#8b9db7]",
						children: detail
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `metric-icon-orbit grid h-12 w-12 shrink-0 place-items-center rounded-2xl shadow-lg ${tones[tone]}`,
				style: { boxShadow: `0 8px 20px rgba(21,94,239,0.12)` },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					size: 22,
					strokeWidth: 2
				})
			})]
		}),
		onClick && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#155eef] transition-all group-hover:gap-2.5",
			children: "View details →"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "metric-card-track",
			"aria-hidden": "true",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
		})
	] });
	const cardClass = `metric-card-3d metric-tone-${tone} w-full rounded-[22px] bg-white/95 p-6 text-left backdrop-blur group ${selected ? "border-[#78a5ee] ring-4 ring-[#dce9ff]" : "border-[#e3eaf5]"}`;
	return onClick ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		"aria-pressed": selected,
		className: cardClass,
		children: content
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
		className: cardClass,
		children: content
	});
}
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var PackagePlus = createLucideIcon("PackagePlus", [
	["path", {
		d: "M16 16h6",
		key: "100bgy"
	}],
	["path", {
		d: "M19 13v6",
		key: "85cyf1"
	}],
	["path", {
		d: "M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14",
		key: "e7tb2h"
	}],
	["path", {
		d: "m7.5 4.27 9 5.15",
		key: "1c824w"
	}],
	["polyline", {
		points: "3.29 7 12 12 20.71 7",
		key: "ousv84"
	}],
	["line", {
		x1: "12",
		x2: "12",
		y1: "22",
		y2: "12",
		key: "a4e8g8"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ArrowUpDown = createLucideIcon("ArrowUpDown", [
	["path", {
		d: "m21 16-4 4-4-4",
		key: "f6ql7i"
	}],
	["path", {
		d: "M17 20V4",
		key: "1ejh1v"
	}],
	["path", {
		d: "m3 8 4-4 4 4",
		key: "11wl7u"
	}],
	["path", {
		d: "M7 4v16",
		key: "1glfcx"
	}]
]);
/**
* Lightweight 3D warehouse illustration using SVG.
* Reacts gently to mouse movement on desktop.
* Disabled on touch devices to avoid scroll interference.
*/
function WarehouseHero({ variant = "executive", className = "" }) {
	const containerRef = (0, import_react.useRef)(null);
	const [rotateX, setRotateX] = (0, import_react.useState)(0);
	const [rotateY, setRotateY] = (0, import_react.useState)(0);
	const isTouchDevice = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		isTouchDevice.current = "ontouchstart" in window || navigator.maxTouchPoints > 0;
		if (isTouchDevice.current) return;
		const container = containerRef.current;
		if (!container) return;
		const onMouseMove = (e) => {
			const rect = container.getBoundingClientRect();
			const centerX = rect.left + rect.width / 2;
			const centerY = rect.top + rect.height / 2;
			const x = (e.clientY - centerY) / 20;
			const y = (e.clientX - centerX) / 30;
			setRotateX(Math.max(-8, Math.min(8, x)));
			setRotateY(Math.max(-12, Math.min(12, y)));
		};
		const onMouseLeave = () => {
			setRotateX(0);
			setRotateY(0);
		};
		container.addEventListener("mousemove", onMouseMove);
		container.addEventListener("mouseleave", onMouseLeave);
		return () => {
			container.removeEventListener("mousemove", onMouseMove);
			container.removeEventListener("mouseleave", onMouseLeave);
		};
	}, []);
	const colors = {
		shelf: variant === "admin" ? "#c9bfff" : "#9fc2ff",
		shelfLight: variant === "admin" ? "#a996ff" : "#72a8ff",
		box: "#1c7b4c",
		boxLight: "#2ea86a",
		accent: "#f0a13a",
		bg: "rgba(255,255,255,0.06)"
	};
	const boxColor = variant === "admin" ? "#7257d6" : variant === "manager" ? "#155eef" : "#16865b";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: containerRef,
		className: `relative ${className}`,
		style: {
			perspective: "800px",
			transformStyle: "preserve-3d"
		},
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 200 140",
			fill: "none",
			xmlns: "http://www.w3.org/2000/svg",
			className: "w-full h-full",
			style: {
				transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
				transition: "transform 0.2s ease-out",
				filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.08))"
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
					opacity: "0.15",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M20 120 L180 120 L160 90 L40 90 Z",
						fill: "white",
						opacity: "0.3"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
					opacity: "0.94",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "30",
							y: "40",
							width: "4",
							height: "70",
							rx: "1",
							fill: colors.shelf,
							opacity: "0.4"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "30",
							y: "40",
							width: "50",
							height: "4",
							rx: "1",
							fill: colors.shelf,
							opacity: "0.3"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "30",
							y: "60",
							width: "50",
							height: "4",
							rx: "1",
							fill: colors.shelf,
							opacity: "0.3"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "30",
							y: "80",
							width: "50",
							height: "4",
							rx: "1",
							fill: colors.shelf,
							opacity: "0.3"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "76",
							y: "40",
							width: "4",
							height: "70",
							rx: "1",
							fill: colors.shelf,
							opacity: "0.4"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
					opacity: "0.92",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "36",
							y: "44",
							width: "14",
							height: "12",
							rx: "2",
							fill: boxColor,
							opacity: "0.5"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "54",
							y: "44",
							width: "14",
							height: "12",
							rx: "2",
							fill: boxColor,
							opacity: "0.35"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "36",
							y: "64",
							width: "18",
							height: "12",
							rx: "2",
							fill: boxColor,
							opacity: "0.45"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "58",
							y: "64",
							width: "14",
							height: "12",
							rx: "2",
							fill: boxColor,
							opacity: "0.3"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "36",
							y: "84",
							width: "32",
							height: "12",
							rx: "2",
							fill: boxColor,
							opacity: "0.4"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
					opacity: "0.94",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "120",
							y: "30",
							width: "4",
							height: "80",
							rx: "1",
							fill: colors.shelf,
							opacity: "0.4"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "120",
							y: "30",
							width: "50",
							height: "4",
							rx: "1",
							fill: colors.shelf,
							opacity: "0.3"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "120",
							y: "50",
							width: "50",
							height: "4",
							rx: "1",
							fill: colors.shelf,
							opacity: "0.3"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "120",
							y: "70",
							width: "50",
							height: "4",
							rx: "1",
							fill: colors.shelf,
							opacity: "0.3"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "120",
							y: "90",
							width: "50",
							height: "4",
							rx: "1",
							fill: colors.shelf,
							opacity: "0.3"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "166",
							y: "30",
							width: "4",
							height: "80",
							rx: "1",
							fill: colors.shelf,
							opacity: "0.4"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
					opacity: "0.92",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "126",
							y: "34",
							width: "16",
							height: "12",
							rx: "2",
							fill: boxColor,
							opacity: "0.4"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "146",
							y: "34",
							width: "16",
							height: "12",
							rx: "2",
							fill: boxColor,
							opacity: "0.3"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "126",
							y: "54",
							width: "20",
							height: "12",
							rx: "2",
							fill: boxColor,
							opacity: "0.35"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "150",
							y: "54",
							width: "12",
							height: "12",
							rx: "2",
							fill: boxColor,
							opacity: "0.25"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "126",
							y: "74",
							width: "36",
							height: "12",
							rx: "2",
							fill: boxColor,
							opacity: "0.3"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
					opacity: "0.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "90",
						y: "20",
						width: "12",
						height: "10",
						rx: "2",
						fill: boxColor,
						opacity: "0.3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("animateTransform", {
							attributeName: "transform",
							type: "translate",
							values: "0,0; 0,-4; 0,0",
							dur: "4s",
							repeatCount: "indefinite"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "94",
						y: "24",
						width: "4",
						height: "3",
						rx: "1",
						fill: colors.boxLight,
						opacity: "0.3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("animateTransform", {
							attributeName: "transform",
							type: "translate",
							values: "0,0; 0,-4; 0,0",
							dur: "4s",
							repeatCount: "indefinite"
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
					opacity: "0.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M82 70 L82 50 L90 50",
						stroke: colors.accent,
						strokeWidth: "1.5",
						fill: "none",
						strokeLinecap: "round",
						strokeLinejoin: "round",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("animate", {
							attributeName: "opacity",
							values: "0.3;0.8;0.3",
							dur: "3s",
							repeatCount: "indefinite"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M84 48 L90 50 L84 52",
						fill: colors.accent,
						opacity: "0.6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("animate", {
							attributeName: "opacity",
							values: "0.3;0.8;0.3",
							dur: "3s",
							repeatCount: "indefinite"
						})
					})]
				}),
				variant === "executive" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
					opacity: "0.4",
					transform: "translate(88, 105)",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("rect", {
							x: "0",
							y: "0",
							width: "3",
							height: "10",
							rx: "1.5",
							fill: colors.shelfLight,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("animate", {
								attributeName: "height",
								values: "10;18;10",
								dur: "1s",
								repeatCount: "indefinite"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("animate", {
								attributeName: "y",
								values: "0;-4;0",
								dur: "1s",
								repeatCount: "indefinite"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("rect", {
							x: "6",
							y: "-2",
							width: "3",
							height: "14",
							rx: "1.5",
							fill: colors.shelfLight,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("animate", {
								attributeName: "height",
								values: "14;8;14",
								dur: "1.2s",
								repeatCount: "indefinite"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("animate", {
								attributeName: "y",
								values: "-2;2;-2",
								dur: "1.2s",
								repeatCount: "indefinite"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("rect", {
							x: "12",
							y: "1",
							width: "3",
							height: "8",
							rx: "1.5",
							fill: colors.shelfLight,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("animate", {
								attributeName: "height",
								values: "8;16;8",
								dur: "0.9s",
								repeatCount: "indefinite"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("animate", {
								attributeName: "y",
								values: "1;-4;1",
								dur: "0.9s",
								repeatCount: "indefinite"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("rect", {
							x: "18",
							y: "-3",
							width: "3",
							height: "16",
							rx: "1.5",
							fill: colors.shelfLight,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("animate", {
								attributeName: "height",
								values: "16;10;16",
								dur: "1.1s",
								repeatCount: "indefinite"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("animate", {
								attributeName: "y",
								values: "-3;1;-3",
								dur: "1.1s",
								repeatCount: "indefinite"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("rect", {
							x: "24",
							y: "0",
							width: "3",
							height: "10",
							rx: "1.5",
							fill: colors.shelfLight,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("animate", {
								attributeName: "height",
								values: "10;6;10",
								dur: "0.8s",
								repeatCount: "indefinite"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("animate", {
								attributeName: "y",
								values: "0;2;0",
								dur: "0.8s",
								repeatCount: "indefinite"
							})]
						})
					]
				}),
				variant === "admin" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
					opacity: "0.5",
					transform: "translate(150, 20)",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
							cx: "10",
							cy: "5",
							rx: "10",
							ry: "5",
							fill: colors.shelfLight,
							opacity: "0.4"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "0",
							y: "5",
							width: "20",
							height: "8",
							rx: "1",
							fill: colors.shelfLight,
							opacity: "0.3"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
							cx: "10",
							cy: "13",
							rx: "10",
							ry: "5",
							fill: colors.shelfLight,
							opacity: "0.4"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "0",
							y: "-3",
							width: "20",
							height: "8",
							rx: "1",
							fill: colors.shelfLight,
							opacity: "0.25"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
							cx: "10",
							cy: "-3",
							rx: "10",
							ry: "5",
							fill: colors.shelfLight,
							opacity: "0.35"
						})
					]
				}),
				variant === "manager" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
					opacity: "0.4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M170 20 Q180 30 170 40 Q160 50 170 60",
						stroke: colors.shelfLight,
						strokeWidth: "1",
						fill: "none",
						strokeDasharray: "3 3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("animate", {
							attributeName: "stroke-dashoffset",
							values: "0;-30",
							dur: "2s",
							repeatCount: "indefinite"
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
					opacity: "0.3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("circle", {
							cx: "40",
							cy: "25",
							r: "1.5",
							fill: colors.shelfLight,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("animate", {
								attributeName: "cy",
								values: "25;15;25",
								dur: "5s",
								repeatCount: "indefinite"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("animate", {
								attributeName: "opacity",
								values: "0.3;0.7;0.3",
								dur: "5s",
								repeatCount: "indefinite"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("circle", {
							cx: "110",
							cy: "18",
							r: "1",
							fill: colors.boxLight,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("animate", {
								attributeName: "cy",
								values: "18;10;18",
								dur: "4s",
								repeatCount: "indefinite"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("animate", {
								attributeName: "opacity",
								values: "0.2;0.6;0.2",
								dur: "4s",
								repeatCount: "indefinite"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("circle", {
							cx: "160",
							cy: "22",
							r: "1.5",
							fill: colors.boxLight,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("animate", {
								attributeName: "cy",
								values: "22;12;22",
								dur: "6s",
								repeatCount: "indefinite"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("animate", {
								attributeName: "opacity",
								values: "0.2;0.5;0.2",
								dur: "6s",
								repeatCount: "indefinite"
							})]
						})
					]
				})
			]
		})
	});
}
function ExecutiveHome({ workerName, workerGreeting, clockNow, snapshot, todayTransactions, cycleCountsToday, postedToday, workerTasks, onNavigate, onStartVoiceWorkflow, newTaskAlert, setNewTaskAlert }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "hero-3d executive-hero-3d relative overflow-hidden rounded-[26px] border border-[#d9e6f8] p-6 text-white sm:p-7",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[48px] border-white/10" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[#6ea5ff]/30 blur-3xl" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#c4d8ff] backdrop-blur",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 13 }), new Intl.DateTimeFormat("en", {
										weekday: "long",
										day: "numeric",
										month: "long",
										year: "numeric"
									}).format(clockNow)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
									className: "mt-3 text-[24px] font-extrabold tracking-[-0.03em] sm:text-[30px]",
									children: [
										workerGreeting,
										", ",
										workerName
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1.5 max-w-2xl text-sm font-semibold leading-6 text-[#c6d7f6]",
									children: snapshot ? workerTasks.length > 0 || postedToday > 0 ? `${workerTasks.length} open task${workerTasks.length === 1 ? "" : "s"} · ${postedToday} update${postedToday === 1 ? "" : "s"} posted today` : "Your workspace is ready — record voice updates, complete tasks and track your activity." : "Live inventory data is loading from the warehouse service."
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "executive-hero-visual flex flex-col items-stretch gap-3 sm:flex-row sm:items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "warehouse-hero-frame hidden h-32 w-48 shrink-0 lg:block",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WarehouseHero, {
									variant: "executive",
									className: "h-full w-full"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "warehouse-hero-status",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}), " Voice ready"]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, {
											size: 18,
											className: "text-[#a9c6ff]"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#9db9ef]",
											children: "Current time"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-extrabold tabular-nums",
											children: new Intl.DateTimeFormat("en", {
												hour: "2-digit",
												minute: "2-digit",
												hour12: true
											}).format(clockNow)
										})] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardCheck, {
											size: 18,
											className: "text-[#ffd08a]"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#9db9ef]",
											children: "Open tasks"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-sm font-extrabold",
											children: [workerTasks.length, " waiting"]
										})] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
											size: 18,
											className: "text-[#9dffce]"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#9db9ef]",
											children: "Posted today"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-sm font-extrabold",
											children: [postedToday, " updates"]
										})] })]
									})
								]
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "worker-mobile-metrics grid grid-cols-2 gap-3 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
						label: "My transactions",
						value: String(todayTransactions.length),
						detail: "Created today",
						icon: ArrowRightLeft,
						onClick: () => {
							onNavigate("History");
							window.scrollTo({
								top: 0,
								behavior: "smooth"
							});
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
						label: "Cycle counts",
						value: String(cycleCountsToday),
						detail: "Submitted today",
						icon: ClipboardCheck,
						tone: "violet",
						onClick: () => {
							onNavigate("History");
							window.scrollTo({
								top: 0,
								behavior: "smooth"
							});
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
						label: "Open tasks",
						value: String(workerTasks.length),
						detail: workerTasks.some((t) => t.urgent) ? "Recount action required" : "No urgent recounts",
						icon: Clock3,
						tone: "amber",
						onClick: () => {
							onNavigate("Task queue");
							window.scrollTo({
								top: 0,
								behavior: "smooth"
							});
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
						label: "Posted today",
						value: String(postedToday),
						detail: "Validated inventory updates",
						icon: ShieldCheck,
						tone: "green",
						onClick: () => {
							onNavigate("History");
							window.scrollTo({
								top: 0,
								behavior: "smooth"
							});
						}
					})
				]
			}),
			newTaskAlert && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				role: "status",
				"aria-live": "polite",
				className: "flex items-start justify-between gap-4 rounded-[20px] border border-[#b9d0f8] bg-gradient-to-r from-[#edf4ff] to-[#f7faff] p-4 shadow-[0_12px_30px_rgba(21,94,239,0.09)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#155eef] text-white",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellRing, { size: 19 })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-extrabold uppercase tracking-[0.13em] text-[#155eef]",
							children: "New assignment"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm font-extrabold text-[#17345f]",
							children: newTaskAlert
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs font-semibold text-[#7186a3]",
							children: "Open the task queue below to review and start the work."
						})
					] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setNewTaskAlert(""),
					"aria-label": "Dismiss",
					className: "rounded-lg p-2 text-[#6f84a3] transition hover:bg-white",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 17 })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-[24px] border border-[#d8e5f7] bg-white p-5 shadow-[0_18px_45px_rgba(16,42,86,0.1)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#155eef]",
							children: "Quick actions"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-extrabold text-[#102a56]",
							children: "Start a voice update"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold text-[#8294ac]",
							children: "Select the action you performed, then speak the details."
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickActionButton, {
							icon: PackagePlus,
							label: "Receive",
							gradient: "from-[#155eef] to-[#4a7df0]",
							onClick: () => onStartVoiceWorkflow("RECEIVE")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickActionButton, {
							icon: PackageMinus,
							label: "Ship",
							gradient: "from-[#d47b08] to-[#f0a13a]",
							onClick: () => onStartVoiceWorkflow("SHIP")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickActionButton, {
							icon: ArrowUpDown,
							label: "Transfer",
							gradient: "from-[#7257d6] to-[#9678f2]",
							onClick: () => onStartVoiceWorkflow("TRANSFER")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickActionButton, {
							icon: CircleCheck,
							label: "Cycle count",
							gradient: "from-[#0e7490] to-[#38bdf8]",
							onClick: () => onStartVoiceWorkflow("CYCLE_COUNT")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickActionButton, {
							icon: TriangleAlert,
							label: "Damage",
							gradient: "from-[#be185d] to-[#ec4899]",
							onClick: () => onStartVoiceWorkflow("DAMAGE")
						})
					]
				})]
			})
		]
	});
}
function QuickActionButton({ icon: Icon, label, gradient, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		"aria-label": `Start voice update for ${label}`,
		className: "group relative flex min-h-[88px] flex-col items-start justify-between rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-3 text-left transition hover:-translate-y-1 hover:border-[#b9cff0] hover:bg-white hover:shadow-[0_12px_28px_rgba(16,45,82,0.1)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-[0_8px_18px_rgba(21,94,239,0.22)] transition group-hover:scale-110`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 18 })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-2 text-xs font-extrabold text-[#24466f]",
			children: label
		})]
	});
}
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Clock = createLucideIcon("Clock", [["circle", {
	cx: "12",
	cy: "12",
	r: "10",
	key: "1mglay"
}], ["polyline", {
	points: "12 6 12 12 16 14",
	key: "68esgv"
}]]);
function EmptyState({ icon: Icon, title, description, action }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-6 py-10 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				size: 26,
				className: "mx-auto text-[#16865b]"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm font-extrabold text-[#24466f]",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-[#8093ab]",
				children: description
			}),
			action && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: action.onClick,
				className: "mt-4 rounded-xl bg-[#155eef] px-4 py-2.5 text-xs font-extrabold text-white",
				children: action.label
			})
		]
	});
}
function ExecutiveTaskQueue({ workerTasks, taskActionId, lastTaskRefresh, completedAssignedTasks, taskLoadError = false, message, onRefreshTasks, onOpenTask, onStartTask, onCompleteTask, onOpenRecount, onBack }) {
	const actionableTasks = workerTasks.filter((task) => task.automatic || task.urgent);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "worker-task-screen rounded-[24px] border border-[#d8e4f3] bg-white shadow-[0_18px_48px_rgba(16,45,82,0.08)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4 border-b border-[#e6edf6] bg-[#f7faff] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]",
						children: "Task queue"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 text-xl font-extrabold text-[#102a56]",
						children: "Work assigned to you"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs font-semibold text-[#7b8fa9]",
						children: "Only actionable tasks are shown. Pending approvals appear in History."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-2 rounded-full bg-[#eaf8f1] px-3 py-1 text-[10px] font-extrabold text-[#16865b]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 animate-pulse rounded-full bg-[#20ad76]" }),
								"Live",
								lastTaskRefresh ? ` · ${new Intl.DateTimeFormat("en", {
									hour: "2-digit",
									minute: "2-digit"
								}).format(lastTaskRefresh)}` : ""
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "w-fit rounded-full bg-[#f2efff] px-3 py-1 text-xs font-extrabold text-[#6349c1]",
							children: [
								workerTasks.length,
								" open · ",
								completedAssignedTasks,
								" done"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: onBack,
							className: "inline-flex h-9 items-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-3 text-xs font-extrabold text-[#155eef]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
								size: 15,
								className: "rotate-90"
							}), " Home"]
						})
					]
				})]
			}),
			taskLoadError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-3 border-b border-[#f3d9a2] bg-[#fff8e8] px-5 py-3 sm:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-bold leading-5 text-[#916018]",
					children: "The task service is unavailable, so this queue may be incomplete. Completed work is never recreated from history — refresh to confirm the current status."
				}), onRefreshTasks && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onRefreshTasks,
					className: "inline-flex h-9 items-center gap-2 rounded-xl border border-[#e3b968] bg-white px-3 text-xs font-extrabold text-[#916018] transition hover:bg-[#fff3d6]",
					children: "Refresh tasks"
				})]
			}),
			message && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				role: "status",
				className: "border-b border-[#cfe0f8] bg-[#f2f7ff] px-5 py-3 sm:px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-bold leading-5 text-[#28568f]",
					children: message
				})
			}),
			actionableTasks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: ClipboardCheck,
				title: "No tasks assigned",
				description: "Assigned work appears here when a manager creates tasks for you."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "divide-y divide-[#edf1f6]",
				children: actionableTasks.map((task) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
					className: "worker-task-card p-5 transition hover:bg-[#f8faff] sm:p-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "truncate text-sm font-extrabold text-[#17345f]",
											children: task.title
										}),
										task.monthEndCount && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "inline-flex items-center gap-1 rounded-full bg-[#f2efff] px-2.5 py-0.5 text-[10px] font-extrabold text-[#6349c1]",
											children: "Month-End Cycle Count"
										}),
										task.type === "RECOUNT" && task.caseNumber && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1 rounded-full bg-[#f2efff] px-2.5 py-0.5 text-[10px] font-extrabold text-[#6349c1]",
											children: ["Recount required · ", task.caseNumber]
										}),
										task.type === "SHIP" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "inline-flex items-center gap-1 rounded-full bg-[#eaf8f1] px-2.5 py-0.5 text-[10px] font-extrabold text-[#16865b]",
											children: "Ship reserved stock"
										}),
										task.shipmentReference && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "inline-flex items-center gap-1 rounded-full bg-[#eef3fb] px-2.5 py-0.5 text-[10px] font-extrabold text-[#2f5d9c]",
											children: task.shipmentReference
										}),
										task.planNumber && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1 rounded-full bg-[#e9f7ff] px-2.5 py-0.5 text-[10px] font-extrabold text-[#0e7490]",
											children: [
												task.planNumber,
												" · ",
												task.planCompleted ?? 0,
												"/",
												task.planTotal ?? 0,
												" complete"
											]
										}),
										task.urgent && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1 rounded-full bg-[#fff1e3] px-2.5 py-0.5 text-[10px] font-extrabold text-[#c56c08]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 12 }), " Urgent"]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs font-semibold text-[#7186a3]",
									children: task.detail
								}),
								task.planTitle && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-[10px] font-bold text-[#0e7490]",
									children: [
										task.planTitle,
										task.countPeriod ? ` · Count period ${formatCountPeriod(task.countPeriod)}` : "",
										task.blindCount ? " · Blind count: system quantity is hidden" : ""
									]
								}),
								task.monthEndCount && task.priority && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: `mt-1.5 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[9px] font-extrabold ${priorityTone(task.priority)}`,
									children: [task.priority, " priority"]
								}),
								task.caseExpected !== void 0 && task.caseCounted !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-[#e5d9ff] bg-[#faf7ff] px-3 py-2 text-[11px] font-bold text-[#5a4696]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Previous count ", task.caseCounted] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["System expected ", task.caseExpected] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: task.caseDifference !== void 0 && task.caseDifference < 0 ? "text-[#c04343]" : "text-[#0e7490]",
											children: ["Difference ", task.caseDifference !== void 0 && task.caseDifference > 0 ? `+${task.caseDifference}` : task.caseDifference]
										})
									]
								}),
								task.reservationReference && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-[10px] font-bold text-[#2f5d9c]",
									children: ["Order ", task.reservationReference]
								}),
								task.dueAt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 flex items-center gap-1.5 text-[10px] font-bold text-[#b36d0c]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { size: 12 }),
										"Due ",
										new Intl.DateTimeFormat("en", {
											day: "2-digit",
											month: "short",
											hour: "2-digit",
											minute: "2-digit"
										}).format(new Date(task.dueAt))
									]
								}),
								task.note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 rounded-lg bg-[#f4f7fc] px-3 py-2 text-[10px] font-semibold leading-4 text-[#6c829f]",
									children: task.note
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "worker-task-action flex shrink-0 flex-wrap items-center justify-end gap-2",
							children: task.automatic ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								disabled: taskActionId === task.id,
								onClick: () => void onOpenTask(task.id),
								className: "flex items-center gap-2 rounded-xl bg-[#155eef] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(21,94,239,0.22)] disabled:opacity-60",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { size: 15 }), "Start with voice"]
							}), task.type === "SHIP" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [onStartTask && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: taskActionId === task.id,
								onClick: () => void onStartTask(task.id),
								className: "flex items-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-3 py-2.5 text-xs font-extrabold text-[#155eef] disabled:opacity-60",
								children: "Start task"
							}), onCompleteTask && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: taskActionId === task.id,
								onClick: () => void onCompleteTask(task.id),
								className: "flex items-center gap-2 rounded-xl bg-[#16865b] px-3 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(22,134,91,0.2)] disabled:opacity-60",
								children: "Complete task"
							})] })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => void onOpenRecount(task.id),
								className: "flex items-center gap-2 rounded-xl bg-[#d47b08] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(212,123,8,0.22)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { size: 15 }), "Start recount"]
							})
						})]
					})
				}, task.id))
			})
		]
	});
}
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var CloudOff = createLucideIcon("CloudOff", [
	["path", {
		d: "m2 2 20 20",
		key: "1ooewy"
	}],
	["path", {
		d: "M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193",
		key: "yfwify"
	}],
	["path", {
		d: "M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07",
		key: "jlfiyv"
	}]
]);
function ExecutiveHistory({ pendingTransactions, completedTransactions, offlineQueueCount, deletingTransactionId, actionMessage, onDeletePending, onBack }) {
	const [view, setView] = (0, import_react.useState)("PENDING");
	const displayed = view === "PENDING" ? pendingTransactions : completedTransactions;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "worker-history-screen rounded-[24px] border border-[#d8e4f3] bg-white shadow-[0_18px_48px_rgba(16,45,82,0.08)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4 border-b border-[#e6edf6] bg-[#f7faff] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]",
						children: "Transaction history"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 text-xl font-extrabold text-[#102a56]",
						children: "Your inventory updates"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs font-semibold text-[#7b8fa9]",
						children: view === "PENDING" ? "Cycle counts and damage updates waiting for review, plus offline updates waiting to sync." : "Posted, approved, and completed updates."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1 rounded-xl border border-[#d5e1f0] bg-[#f4f8ff] p-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							"aria-pressed": view === "PENDING",
							onClick: () => setView("PENDING"),
							className: `rounded-lg px-3 py-1.5 text-[11px] font-extrabold transition ${view === "PENDING" ? "bg-[#155eef] text-white" : "text-[#496482]"}`,
							children: [
								"Pending (",
								pendingTransactions.length + offlineQueueCount,
								")"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							"aria-pressed": view === "COMPLETED",
							onClick: () => setView("COMPLETED"),
							className: `rounded-lg px-3 py-1.5 text-[11px] font-extrabold transition ${view === "COMPLETED" ? "bg-[#155eef] text-white" : "text-[#496482]"}`,
							children: [
								"Completed (",
								completedTransactions.length,
								")"
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: onBack,
						className: "inline-flex h-9 items-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-3 text-xs font-extrabold text-[#155eef]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
							size: 15,
							className: "rotate-90"
						}), " Home"]
					})]
				})]
			}),
			view === "PENDING" && offlineQueueCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-5 mt-5 flex items-start gap-3 rounded-xl border border-[#f0ce8e] bg-[#fff8ea] px-4 py-3 text-sm font-semibold text-[#875810]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudOff, {
					size: 18,
					className: "mt-0.5 shrink-0"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					offlineQueueCount,
					" update",
					offlineQueueCount === 1 ? " is" : "s are",
					" saved on this device and waiting to synchronize."
				] })]
			}),
			actionMessage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				role: "status",
				"aria-live": "polite",
				className: "mx-5 mt-5 rounded-xl border border-[#bfd3f3] bg-[#f2f7ff] px-4 py-3 text-xs font-bold text-[#28548b]",
				children: actionMessage
			}),
			displayed.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: view === "PENDING" ? Clock : CircleCheck,
				title: view === "PENDING" ? "No pending transactions" : "No completed transactions",
				description: view === "PENDING" ? "All your updates have been processed." : "Completed transactions will appear here."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "divide-y divide-[#edf1f6]",
				children: displayed.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
					className: "p-5 sm:p-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "truncate text-sm font-extrabold text-[#17345f]",
									children: [
										item.type,
										" · ",
										item.item
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${item.status === "Posted" ? "bg-[#eaf8f1] text-[#16865b]" : item.status === "Rejected" ? "bg-[#fff0f0] text-[#b83b3b]" : item.status === "Cancelled" ? "bg-[#eef2f7] text-[#7b8fa9]" : "bg-[#fff5df] text-[#a8670d]"}`,
									children: item.status
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs font-semibold text-[#7186a3]",
								children: [
									item.quantity,
									" · ",
									item.location ?? "—",
									" · ",
									item.time
								]
							})]
						}), view === "PENDING" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							disabled: deletingTransactionId === item.id,
							onClick: () => onDeletePending(item.id),
							className: "worker-delete-pending inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#efb5b5] bg-[#fff7f7] px-4 text-xs font-extrabold text-[#b83f3f] transition hover:bg-[#fff0f0] disabled:cursor-wait disabled:opacity-60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 15 }), deletingTransactionId === item.id ? "Deleting…" : "Delete pending"]
						})]
					})
				}, item.id))
			})
		]
	});
}
function ExecutiveSettings({ workerName, isOnline, pendingSyncCount, syncState, microphoneStatus, speakerStatus, onCheckMicrophone, onTestSpeaker, onSignOut, onBack }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-[24px] border border-[#dce6f3] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.055)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-4 border-b border-[#e6edf6] bg-[#f7faff] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]",
					children: "Settings"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 text-xl font-extrabold text-[#102a56]",
					children: "Warehouse Executive settings"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs font-semibold text-[#7b8fa9]",
					children: "Your profile, device tests and application information."
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: onBack,
				className: "inline-flex h-9 items-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-3 text-xs font-extrabold text-[#155eef]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
					size: 15,
					className: "rotate-90"
				}), " Home"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "p-5 sm:p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e8effb] text-[#244a7e]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, { size: 20 })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-extrabold text-[#17345f]",
									children: workerName
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-semibold text-[#8295af]",
									children: "Warehouse Executive"
								})] })]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isOnline ? "bg-[#eaf8f1] text-[#16865b]" : "bg-[#fff4df] text-[#b36d0c]"}`,
									children: isOnline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wifi, { size: 20 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WifiOff, { size: 20 })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-extrabold text-[#17345f]",
									children: isOnline ? "Online" : "Offline"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-semibold text-[#8295af]",
									children: isOnline ? pendingSyncCount > 0 ? `${pendingSyncCount} update${pendingSyncCount === 1 ? "" : "s"} waiting` : syncState === "syncing" ? "Synchronizing…" : "Connected" : `${pendingSyncCount} saved update${pendingSyncCount === 1 ? "" : "s"}`
								})] })]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f2efff] text-[#6349c1]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PackageCheck, { size: 20 })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-extrabold text-[#17345f]",
									children: "Application version"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-semibold text-[#8295af]",
									children: "Nirka Inventory v0.1.0"
								})] })]
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 grid gap-5 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#edf4ff] text-[#155eef]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { size: 20 })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-extrabold text-[#17345f]",
									children: "Microphone"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-[10px] font-semibold leading-4 text-[#7186a3]",
									children: microphoneStatus
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: onCheckMicrophone,
									className: "mt-3 h-10 rounded-xl bg-[#155eef] px-4 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(21,94,239,0.22)]",
									children: "Check microphone"
								})
							] })]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eaf8f1] text-[#16865b]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { size: 20 })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-extrabold text-[#17345f]",
									children: "Speaker"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-[10px] font-semibold leading-4 text-[#7186a3]",
									children: speakerStatus || "Test spoken guidance on this device."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: onTestSpeaker,
									className: "mt-3 h-10 rounded-xl bg-[#16865b] px-4 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(22,134,91,0.22)]",
									children: "Test speaker"
								})
							] })]
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 rounded-2xl border border-[#efb5b5] bg-[#fff6f6] p-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fce4e4] text-[#b83f3f]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { size: 20 })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-extrabold text-[#17345f]",
								children: "Sign out"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-semibold text-[#7186a3]",
								children: "End your session and return to the sign-in screen."
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: onSignOut,
							className: "h-10 rounded-xl bg-[#b83f3f] px-4 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(184,63,63,0.22)]",
							children: "Sign out"
						})]
					})
				})
			]
		})]
	});
}
var preferredGuidanceVoices = [
	"Microsoft Neerja Online (Natural)",
	"Microsoft Sonia Online (Natural)",
	"Microsoft Aria Online (Natural)",
	"Google UK English Female",
	"Microsoft Zira"
];
function createGuidanceUtterance(text) {
	const utterance = new SpeechSynthesisUtterance(text);
	const voices = window.speechSynthesis?.getVoices() ?? [];
	const preferredVoice = preferredGuidanceVoices.map((name) => voices.find((voice) => voice.name.includes(name))).find(Boolean) ?? voices.find((voice) => voice.lang.toLowerCase() === "en-in") ?? voices.find((voice) => voice.lang.toLowerCase() === "en-gb") ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));
	if (preferredVoice) utterance.voice = preferredVoice;
	utterance.lang = preferredVoice?.lang ?? "en-IN";
	utterance.rate = .82;
	utterance.pitch = .96;
	utterance.volume = 1;
	return utterance;
}
function ExecutiveDashboard({ page, onNavigate, isOnline, pendingSyncCount, syncState, onSignOut, onPendingTaskCountChange, displayName, offlineOwnerId }) {
	const [voiceState, setVoiceState] = (0, import_react.useState)("idle");
	const [message, setMessage] = (0, import_react.useState)("");
	const [snapshot, setSnapshot] = (0, import_react.useState)(null);
	const [assignedTasks, setAssignedTasks] = (0, import_react.useState)([]);
	const [taskActionId, setTaskActionId] = (0, import_react.useState)(null);
	const [cancellingTransactionId, setCancellingTransactionId] = (0, import_react.useState)(null);
	const [activeVoiceTask, setActiveVoiceTask] = (0, import_react.useState)(null);
	const [newTaskAlert, setNewTaskAlert] = (0, import_react.useState)("");
	const [microphoneStatus, setMicrophoneStatus] = (0, import_react.useState)("Not checked");
	const [speakerStatus, setSpeakerStatus] = (0, import_react.useState)("");
	const [lastTaskRefresh, setLastTaskRefresh] = (0, import_react.useState)(null);
	const [taskLoadError, setTaskLoadError] = (0, import_react.useState)(false);
	const [clockNow, setClockNow] = (0, import_react.useState)(() => /* @__PURE__ */ new Date());
	const [historyRange, setHistoryRange] = (0, import_react.useState)("WEEK");
	const [historyView, setHistoryView] = (0, import_react.useState)("PENDING");
	const [voiceOrigin, setVoiceOrigin] = (0, import_react.useState)("home");
	const [selectedWorkflow, setSelectedWorkflow] = (0, import_react.useState)(null);
	const [transcript, setTranscript] = (0, import_react.useState)("");
	const [liveTranscript, setLiveTranscript] = (0, import_react.useState)("");
	const [liveTranscriptSupported, setLiveTranscriptSupported] = (0, import_react.useState)(false);
	const [transcription, setTranscription] = (0, import_react.useState)(null);
	const [extraction, setExtraction] = (0, import_react.useState)(null);
	const [extractionDurationMs, setExtractionDurationMs] = (0, import_react.useState)(null);
	const [clarificationState, setClarificationState] = (0, import_react.useState)("idle");
	const [clarificationHistory, setClarificationHistory] = (0, import_react.useState)([]);
	const [submissionState, setSubmissionState] = (0, import_react.useState)("idle");
	const [submittedTransaction, setSubmittedTransaction] = (0, import_react.useState)(null);
	const [confirmationOutcome, setConfirmationOutcome] = (0, import_react.useState)(null);
	const [evidencePreview, setEvidencePreview] = (0, import_react.useState)(null);
	const [evidenceFile, setEvidenceFile] = (0, import_react.useState)(null);
	const [evidenceUploading, setEvidenceUploading] = (0, import_react.useState)(false);
	const [evidenceMessage, setEvidenceMessage] = (0, import_react.useState)("");
	const [evidenceAttached, setEvidenceAttached] = (0, import_react.useState)(false);
	const recorderRef = (0, import_react.useRef)(null);
	const streamRef = (0, import_react.useRef)(null);
	const chunksRef = (0, import_react.useRef)([]);
	const liveRecognitionRef = (0, import_react.useRef)(null);
	const liveRecognitionActiveRef = (0, import_react.useRef)(false);
	const liveFinalRef = (0, import_react.useRef)("");
	const clientRequestIdRef = (0, import_react.useRef)(null);
	const activeClarificationQuestion = extraction?.clarificationQuestions[0] ?? "";
	function buildTaskExtractionContext() {
		if (!activeVoiceTask) return void 0;
		const mappedAction = activeVoiceTask.type === "RECOUNT" || activeVoiceTask.type === "STOCK_VERIFY" ? "CYCLE_COUNT" : activeVoiceTask.type === "PICK" ? "SHIP" : [
			"RECEIVE",
			"SHIP",
			"TRANSFER",
			"CYCLE_COUNT",
			"DAMAGE"
		].includes(activeVoiceTask.type) ? activeVoiceTask.type : activeVoiceTask.type === "DAMAGE_INSPECTION" ? "DAMAGE" : void 0;
		if (!mappedAction) return void 0;
		return {
			action: mappedAction,
			productSku: activeVoiceTask.product?.sku,
			productName: activeVoiceTask.product?.name,
			sourceLocationCode: mappedAction === "RECEIVE" ? void 0 : activeVoiceTask.sourceLocation?.code ?? activeVoiceTask.location?.code,
			destinationLocationCode: mappedAction === "RECEIVE" ? activeVoiceTask.destinationLocation?.code ?? activeVoiceTask.location?.code : activeVoiceTask.destinationLocation?.code
		};
	}
	(0, import_react.useEffect)(() => {
		let active = true;
		let knownTaskIds = /* @__PURE__ */ new Set();
		Promise.all([fetchInventorySnapshot(), fetchInventoryTasks()]).then(([inventory, tasks]) => {
			if (!active) return;
			knownTaskIds = new Set(tasks.map((task) => task.id));
			setSnapshot(inventory);
			setAssignedTasks(tasks);
			setLastTaskRefresh(/* @__PURE__ */ new Date());
			setTaskLoadError(false);
		}).catch(() => {
			setSnapshot(null);
			setTaskLoadError(true);
		});
		const refreshTasks = async () => {
			if (!active || document.visibilityState === "hidden") return;
			try {
				const [tasks, inventory] = await Promise.all([fetchInventoryTasks(), fetchInventorySnapshot()]);
				if (!active) return;
				const newTasks = tasks.filter((task) => task.status === "OPEN" && !knownTaskIds.has(task.id));
				if (newTasks.length === 1) setNewTaskAlert(`New task assigned: ${newTasks[0].title}`);
				else if (newTasks.length > 1) setNewTaskAlert(`${newTasks.length} new tasks were assigned to you.`);
				knownTaskIds = new Set(tasks.map((task) => task.id));
				setAssignedTasks(tasks);
				setSnapshot(inventory);
				setLastTaskRefresh(/* @__PURE__ */ new Date());
				setTaskLoadError(false);
			} catch {
				setTaskLoadError(true);
			}
		};
		const refreshTimer = window.setInterval(() => void refreshTasks(), 5e3);
		const refreshOnFocus = () => void refreshTasks();
		window.addEventListener("focus", refreshOnFocus);
		return () => {
			active = false;
			window.clearInterval(refreshTimer);
			window.removeEventListener("focus", refreshOnFocus);
			stopLiveTranscription();
			streamRef.current?.getTracks().forEach((track) => track.stop());
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const timer = window.setInterval(() => setClockNow(/* @__PURE__ */ new Date()), 3e4);
		return () => window.clearInterval(timer);
	}, []);
	(0, import_react.useEffect)(() => {
		if (submissionState !== "complete") return;
		const redirectTimer = window.setTimeout(() => {
			onNavigate(voiceOrigin === "task-queue" ? "Task queue" : "Home");
			window.scrollTo({
				top: 0,
				behavior: "smooth"
			});
		}, 2500);
		return () => window.clearTimeout(redirectTimer);
	}, [
		submissionState,
		voiceOrigin,
		onNavigate
	]);
	/** Re-fetch tasks and the inventory snapshot from the refresh/error banner. */
	async function refreshWorkerQueue() {
		try {
			const [tasks, inventory] = await Promise.all([fetchInventoryTasks(), fetchInventorySnapshot()]);
			setAssignedTasks(tasks);
			setSnapshot(inventory);
			setLastTaskRefresh(/* @__PURE__ */ new Date());
			setTaskLoadError(false);
			setMessage("Task queue refreshed.");
		} catch {
			setTaskLoadError(true);
			setMessage("The task service is unavailable. Check the API and try again — completed work is never recreated from history.");
		}
	}
	const workerName = displayName || "Warehouse Executive";
	const workerGreeting = (() => {
		const hour = clockNow.getHours();
		if (hour < 12) return "Good morning";
		if (hour < 17) return "Good afternoon";
		return "Good evening";
	})();
	const voiceCopy = (0, import_react.useMemo)(() => {
		if (voiceState === "recording") return {
			title: "Listening…",
			detail: "Simply say what you did, the number, the item name and the shelf."
		};
		if (voiceState === "transcribing") return {
			title: "Creating transcript…",
			detail: "Whisper is processing the recording locally."
		};
		if (voiceState === "review") return {
			title: "Transcript ready",
			detail: "Review or correct the spoken text before continuing."
		};
		if (voiceState === "extracting") return {
			title: "Understanding your update…",
			detail: "AI is checking the item name and shelf name."
		};
		if (voiceState === "extracted") return {
			title: "Inventory details ready",
			detail: "Review the AI suggestion before any transaction is created."
		};
		if (activeVoiceTask?.type === "TRANSFER") return {
			title: "Ready — confirm the assigned transfer",
			detail: "The product, quantity, pick-from location and transfer-to location are already filled from the manager task."
		};
		if (activeVoiceTask && [
			"RECEIVE",
			"CYCLE_COUNT",
			"STOCK_VERIFY",
			"RECOUNT"
		].includes(activeVoiceTask.type)) return {
			title: "Ready — say only the actual number",
			detail: "The task already provides the action, item and location. You do not need to repeat them."
		};
		return {
			title: selectedWorkflow ? "Ready — speak one short sentence" : "Ready for a voice update",
			detail: selectedWorkflow ? {
				RECEIVE: "Say: “I received 50 Boxes.”",
				SHIP: "Say: “I shipped 5 Boxes from Storage.”",
				TRANSFER: "Say: “I moved 10 Boxes from Storage to Dispatch.”",
				CYCLE_COUNT: "Say: “I counted 50 Boxes.”",
				DAMAGE: "Say: “I damaged 2 Boxes in Storage.”"
			}[selectedWorkflow] : "Try: “I received 50 Boxes.”"
		};
	}, [
		voiceState,
		selectedWorkflow,
		activeVoiceTask
	]);
	function chooseWorkflow(workflow) {
		resetVoice();
		setSelectedWorkflow(workflow);
		setMessage("Ready. Tap the microphone and say one short sentence using the sample above.");
		document.getElementById("voice-entry")?.scrollIntoView({
			behavior: "smooth",
			block: "start"
		});
	}
	function startWorkflowFromHome(workflow) {
		resetVoice();
		setVoiceOrigin("home");
		setSelectedWorkflow(workflow);
		setMessage("Ready. Tap the microphone and say one short sentence using the selected action.");
		onNavigate("Voice entry");
		window.setTimeout(() => {
			document.getElementById("voice-entry")?.scrollIntoView({
				behavior: "smooth",
				block: "start"
			});
		}, 50);
	}
	function startLiveTranscription() {
		stopLiveTranscription();
		const SpeechRecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
		if (!SpeechRecognitionCtor) {
			setLiveTranscriptSupported(false);
			return;
		}
		const recognition = new SpeechRecognitionCtor();
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.lang = "en-US";
		recognition.maxAlternatives = 1;
		liveFinalRef.current = "";
		recognition.onresult = (event) => {
			let interimText = "";
			for (let index = event.resultIndex; index < event.results.length; index += 1) {
				const result = event.results[index];
				const spoken = result[0]?.transcript ?? "";
				if (result.isFinal) liveFinalRef.current = `${liveFinalRef.current} ${spoken}`.trim();
				else interimText += spoken;
			}
			setLiveTranscript(`${liveFinalRef.current}${interimText ? ` ${interimText}` : ""}`.trim());
		};
		recognition.onerror = (event) => {
			if ([
				"not-allowed",
				"service-not-allowed",
				"language-not-supported",
				"network"
			].includes(event.error)) {
				liveRecognitionActiveRef.current = false;
				setLiveTranscriptSupported(false);
			}
		};
		recognition.onend = () => {
			if (!liveRecognitionActiveRef.current) return;
			try {
				recognition.start();
			} catch {
				liveRecognitionActiveRef.current = false;
				setLiveTranscriptSupported(false);
			}
		};
		liveRecognitionRef.current = recognition;
		liveRecognitionActiveRef.current = true;
		setLiveTranscriptSupported(true);
		try {
			recognition.start();
		} catch {
			liveRecognitionActiveRef.current = false;
			setLiveTranscriptSupported(false);
		}
	}
	function stopLiveTranscription() {
		liveRecognitionActiveRef.current = false;
		const recognition = liveRecognitionRef.current;
		liveRecognitionRef.current = null;
		if (!recognition) return;
		try {
			recognition.onend = null;
			recognition.stop();
		} catch {}
	}
	async function startRecording() {
		setMessage("");
		setTranscript("");
		setLiveTranscript("");
		setLiveTranscriptSupported(false);
		setTranscription(null);
		setExtraction(null);
		setClarificationState("idle");
		setClarificationHistory([]);
		setSubmissionState("idle");
		setSubmittedTransaction(null);
		setConfirmationOutcome(null);
		clientRequestIdRef.current = null;
		if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
			setMessage("This browser does not support microphone recording.");
			return;
		}
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: {
				echoCancellation: true,
				noiseSuppression: true,
				autoGainControl: true
			} });
			const mimeType = [
				"audio/webm;codecs=opus",
				"audio/webm",
				"audio/ogg;codecs=opus"
			].find((type) => MediaRecorder.isTypeSupported(type));
			const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
			chunksRef.current = [];
			streamRef.current = stream;
			recorderRef.current = recorder;
			recorder.ondataavailable = (event) => {
				if (event.data.size > 0) chunksRef.current.push(event.data);
			};
			recorder.onstop = () => void processRecording(recorder.mimeType);
			recorder.start(250);
			setVoiceState("recording");
			setLiveTranscript("");
			startLiveTranscription();
		} catch {
			setMessage("Microphone access was not available. Check the browser permission and try again.");
		}
	}
	function stopRecording() {
		stopLiveTranscription();
		if (recorderRef.current?.state === "recording") {
			recorderRef.current.stop();
			setVoiceState("transcribing");
		}
	}
	async function processRecording(mimeType) {
		const recording = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
		streamRef.current?.getTracks().forEach((track) => track.stop());
		streamRef.current = null;
		recorderRef.current = null;
		setLiveTranscript("");
		try {
			const result = await transcribeAudio(recording);
			setTranscription(result);
			setTranscript(result.text);
			if (!result.text) {
				setVoiceState("review");
				setMessage("No clear speech was detected. Record again in a quieter area.");
				return;
			}
			await runExtraction(result.text.trim(), result.evidenceId);
		} catch {
			setVoiceState("idle");
			setMessage("Transcription was not available. Check the speech service and try again.");
		}
	}
	function resetVoice() {
		streamRef.current?.getTracks().forEach((track) => track.stop());
		recorderRef.current = null;
		streamRef.current = null;
		chunksRef.current = [];
		stopLiveTranscription();
		setLiveTranscript("");
		setLiveTranscriptSupported(false);
		setVoiceState("idle");
		setVoiceOrigin("home");
		setTranscript("");
		setTranscription(null);
		setExtraction(null);
		setExtractionDurationMs(null);
		setClarificationState("idle");
		setClarificationHistory([]);
		setSubmissionState("idle");
		setSubmittedTransaction(null);
		setConfirmationOutcome(null);
		setEvidencePreview(null);
		setEvidenceFile(null);
		setEvidenceMessage("");
		setEvidenceAttached(false);
		clientRequestIdRef.current = null;
		setMessage("");
		window.speechSynthesis?.cancel();
	}
	function prepareEvidencePhoto(file) {
		if (!file) return;
		if (![
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/webp"
		].includes(file.type)) {
			setEvidenceMessage("Only JPEG, PNG and WebP images are accepted.");
			return;
		}
		if (file.size > 8 * 1024 * 1024) {
			setEvidenceMessage("The photo must be 8 MB or smaller.");
			return;
		}
		setEvidenceMessage("");
		setEvidenceAttached(false);
		setEvidenceFile(file);
		const reader = new FileReader();
		reader.onload = () => setEvidencePreview(String(reader.result));
		reader.readAsDataURL(file);
	}
	async function uploadEvidencePhoto() {
		if (!submittedTransaction || !evidenceFile) return;
		setEvidenceUploading(true);
		setEvidenceMessage("");
		try {
			await uploadTransactionEvidence(submittedTransaction.id, evidenceFile, evidenceFile.name);
			setEvidencePreview(null);
			setEvidenceFile(null);
			setEvidenceMessage("Photo evidence attached to the update. The manager will see it during review.");
			setEvidenceAttached(true);
		} catch (error) {
			setEvidenceMessage(error instanceof Error ? error.message : "The photo could not be uploaded.");
		} finally {
			setEvidenceUploading(false);
		}
	}
	function speakClarificationQuestion(question = activeClarificationQuestion) {
		if (!question || !("speechSynthesis" in window)) return;
		window.speechSynthesis.cancel();
		const spokenQuestion = question === "Which inventory action did you perform?" || question === "What did you do?" ? `${question} Please say receive, ship, transfer, cycle count, or damage.` : question;
		window.speechSynthesis.speak(createGuidanceUtterance(spokenQuestion));
	}
	function parseQuantityOnlyTaskAnswer(value) {
		const match = value.trim().replace(/^[\s"'“”]+|[\s"'“”]+$/g, "").replace(/[.,?!]+$/g, "").trim().match(/^(\d{1,6})(?:\s+(?:units?|pieces?|boxes?|rolls?|pairs?|packs?|cartons?))?$/i);
		if (!match) return null;
		const quantity = Number(match[1]);
		return Number.isSafeInteger(quantity) ? quantity : null;
	}
	function applyActiveTaskContext(result, spokenTranscript = result.transcript) {
		if (!activeVoiceTask) return result;
		const taskAction = activeVoiceTask.type === "RECEIVE" ? "RECEIVE" : ["PICK", "SHIP"].includes(activeVoiceTask.type) ? "SHIP" : activeVoiceTask.type === "TRANSFER" ? "TRANSFER" : ["DAMAGE", "DAMAGE_INSPECTION"].includes(activeVoiceTask.type) ? "DAMAGE" : "CYCLE_COUNT";
		const product = activeVoiceTask.product ?? result.fields.product;
		const spokenTaskQuantity = parseQuantityOnlyTaskAnswer(spokenTranscript);
		const quantity = result.fields.quantity ?? ([
			"CYCLE_COUNT",
			"RECOUNT",
			"STOCK_VERIFY"
		].includes(activeVoiceTask.type) ? spokenTaskQuantity : activeVoiceTask.quantity ?? null);
		const sourceLocation = taskAction === "RECEIVE" ? result.fields.sourceLocation : activeVoiceTask.sourceLocation ?? activeVoiceTask.location ?? result.fields.sourceLocation;
		const destinationLocation = taskAction === "RECEIVE" ? activeVoiceTask.location ?? result.fields.destinationLocation : activeVoiceTask.destinationLocation ?? result.fields.destinationLocation;
		const trustedFields = new Set(["action"]);
		if (activeVoiceTask.product) trustedFields.add("product");
		if (spokenTaskQuantity !== null) trustedFields.add("quantity");
		if (![
			"SHIP",
			"CYCLE_COUNT",
			"RECOUNT",
			"STOCK_VERIFY"
		].includes(activeVoiceTask.type) && activeVoiceTask.quantity !== null && activeVoiceTask.quantity !== void 0) trustedFields.add("quantity");
		if (activeVoiceTask.sourceLocation) trustedFields.add("sourceLocation");
		if (activeVoiceTask.destinationLocation) trustedFields.add("destinationLocation");
		if (activeVoiceTask.location) trustedFields.add(taskAction === "RECEIVE" ? "destinationLocation" : "sourceLocation");
		const missingFields = [];
		if (!product) missingFields.push("product");
		if (quantity === null) missingFields.push("quantity");
		if (taskAction === "RECEIVE") {
			if (!destinationLocation) missingFields.push("destinationLocation");
		} else if (taskAction === "TRANSFER") {
			if (!sourceLocation) missingFields.push("sourceLocation");
			if (!destinationLocation) missingFields.push("destinationLocation");
		} else if (!sourceLocation) missingFields.push("sourceLocation");
		const lowConfidenceFields = result.lowConfidenceFields.filter((field) => !trustedFields.has(field) && !missingFields.includes(field));
		const fieldsNeedingClarification = [...new Set([...missingFields, ...lowConfidenceFields])];
		const questions = {
			action: "What did you do?",
			product: "Which item?",
			quantity: "How many?",
			sourceLocation: "Where did it come from?",
			destinationLocation: "Where should it go?"
		};
		const fieldConfidence = {
			...result.fieldConfidence,
			action: 1,
			product: activeVoiceTask.product ? 1 : result.fieldConfidence.product,
			quantity: result.fields.quantity !== null && result.fields.quantity !== void 0 ? result.fieldConfidence.quantity : spokenTaskQuantity !== null ? 1 : activeVoiceTask.quantity !== null && activeVoiceTask.quantity !== void 0 ? 1 : result.fieldConfidence.quantity,
			sourceLocation: (activeVoiceTask.sourceLocation || activeVoiceTask.location) && taskAction !== "RECEIVE" ? 1 : result.fieldConfidence.sourceLocation,
			destinationLocation: (activeVoiceTask.destinationLocation || activeVoiceTask.location) && (taskAction === "RECEIVE" || taskAction === "TRANSFER") ? 1 : result.fieldConfidence.destinationLocation
		};
		const requiredConfidence = [
			fieldConfidence.action,
			fieldConfidence.product,
			fieldConfidence.quantity,
			...taskAction === "TRANSFER" ? [fieldConfidence.sourceLocation, fieldConfidence.destinationLocation] : taskAction === "RECEIVE" ? [fieldConfidence.destinationLocation] : [fieldConfidence.sourceLocation]
		];
		return {
			...result,
			readyForConfirmation: fieldsNeedingClarification.length === 0,
			requiresManagerReview: taskAction === "DAMAGE" ? true : taskAction === "CYCLE_COUNT" ? (() => {
				if (!product || !sourceLocation) return true;
				const balance = snapshot?.balances.find((b) => b.product.id === product.id && b.location.id === sourceLocation.id);
				return balance ? balance.quantity !== quantity : true;
			})() : false,
			confidence: Number((requiredConfidence.reduce((sum, value) => sum + value, 0) / requiredConfidence.length).toFixed(3)),
			missingFields,
			lowConfidenceFields,
			clarificationQuestions: fieldsNeedingClarification.map((field) => questions[field]),
			fields: {
				...result.fields,
				action: taskAction,
				product,
				quantity,
				sourceLocation,
				destinationLocation
			},
			fieldConfidence
		};
	}
	function applySelectedWorkflowContext(result) {
		if (!selectedWorkflow || activeVoiceTask) return result;
		const selectedAction = selectedWorkflow === "RECEIVE" ? "RECEIVE" : selectedWorkflow === "TRANSFER" ? "TRANSFER" : selectedWorkflow === "CYCLE_COUNT" ? "CYCLE_COUNT" : selectedWorkflow === "SHIP" ? "SHIP" : "DAMAGE";
		const missingFields = result.missingFields.filter((field) => field !== "action");
		const lowConfidenceFields = result.lowConfidenceFields.filter((field) => field !== "action");
		const unresolved = [...new Set([...missingFields, ...lowConfidenceFields])];
		const questions = {
			product: "Which item?",
			quantity: "How many?",
			sourceLocation: "Where did it come from?",
			destinationLocation: "Where should it go?"
		};
		return {
			...result,
			readyForConfirmation: unresolved.length === 0,
			requiresManagerReview: selectedAction === "DAMAGE" ? true : selectedAction === "CYCLE_COUNT" ? (() => {
				if (!result.fields.product || !result.fields.sourceLocation) return true;
				const balance = snapshot?.balances.find((b) => b.product.id === result.fields.product?.id && b.location.id === result.fields.sourceLocation?.id);
				return balance ? balance.quantity !== result.fields.quantity : true;
			})() : false,
			missingFields,
			lowConfidenceFields,
			clarificationQuestions: unresolved.map((field) => questions[field]),
			fields: {
				...result.fields,
				action: selectedAction
			},
			fieldConfidence: {
				...result.fieldConfidence,
				action: 1
			}
		};
	}
	async function runExtraction(reviewedTranscript, evidenceId = transcription?.evidenceId) {
		setVoiceState("extracting");
		setExtractionDurationMs(null);
		setMessage("");
		const extractionStartedAt = performance.now();
		try {
			const extractedResult = await extractInventoryDetails({
				transcript: selectedWorkflow ? `Selected workflow: ${{
					RECEIVE: "RECEIVE",
					SHIP: "SHIP",
					TRANSFER: "TRANSFER",
					CYCLE_COUNT: "CYCLE COUNT",
					DAMAGE: "DAMAGE"
				}[selectedWorkflow]}. Worker statement: ${reviewedTranscript}` : reviewedTranscript,
				evidenceId,
				context: buildTaskExtractionContext()
			});
			setExtractionDurationMs(performance.now() - extractionStartedAt);
			const result = applyActiveTaskContext(applySelectedWorkflowContext(extractedResult), reviewedTranscript);
			setExtraction(result);
			setVoiceState("extracted");
			if (!result.readyForConfirmation) speakClarificationQuestion(result.clarificationQuestions[0]);
			setMessage(result.readyForConfirmation ? "Details are complete and ready for Warehouse Executive confirmation. No inventory stock was changed." : "The AI needs more information before this can be confirmed.");
		} catch {
			setExtractionDurationMs(null);
			setVoiceState("review");
			setMessage("AI extraction was not available. Check Ollama and try again.");
		}
	}
	async function saveTranscript() {
		if (!transcript.trim()) {
			setMessage("Enter or record a transcript before continuing.");
			return;
		}
		await runExtraction(transcript.trim());
	}
	function speakProposal() {
		if (!extraction?.readyForConfirmation) return;
		const fields = extraction.fields;
		const location = fields.sourceLocation?.name ?? fields.destinationLocation?.name ?? "";
		const statement = [
			`Action: ${formatAction(fields.action)}.`,
			fields.product ? `Item: ${fields.product.name}.` : "",
			fields.quantity === null ? "" : `Quantity: ${fields.quantity} ${fields.product?.unit ?? "units"}.`,
			location ? `Location: ${location}.` : "",
			`Condition: ${fields.condition.toLowerCase()}.`,
			"Please confirm this inventory update."
		].filter(Boolean).join(" ");
		window.speechSynthesis?.cancel();
		window.speechSynthesis?.speak(createGuidanceUtterance(statement));
	}
	async function confirmProposal() {
		if (!extraction?.readyForConfirmation) return;
		if (insufficientStockNotice) {
			setMessage(`Insufficient available stock. Requested ${insufficientStockNotice.requested}; available ${insufficientStockNotice.available}. Correct the quantity before confirming.`);
			return;
		}
		setMessage("");
		try {
			let transaction = submittedTransaction;
			if (!transaction) {
				setSubmissionState("creating");
				clientRequestIdRef.current ??= `voice-${crypto.randomUUID()}`;
				const recountTaskId = activeVoiceTask?.type === "RECOUNT" && activeVoiceTask.source === "ASSIGNED" ? activeVoiceTask.id : void 0;
				const assignedTaskId = activeVoiceTask?.source === "ASSIGNED" && activeVoiceTask.type !== "RECOUNT" ? activeVoiceTask.id : void 0;
				transaction = await createPendingInventoryTransaction(extraction, clientRequestIdRef.current, recountTaskId, assignedTaskId);
				setSubmittedTransaction(transaction);
			}
			setSubmissionState("confirming");
			const result = await confirmInventoryTransaction(transaction.id);
			setSubmittedTransaction(result.transaction);
			setConfirmationOutcome(result.outcome);
			setSubmissionState("complete");
			setSnapshot(await fetchInventorySnapshot());
			let taskCompletionMessage = "";
			if (activeVoiceTask) if (activeVoiceTask.source === "ASSIGNED") try {
				setAssignedTasks(await fetchInventoryTasks());
				taskCompletionMessage = ` Task “${activeVoiceTask.title}” is now complete.`;
				setActiveVoiceTask(null);
			} catch {
				taskCompletionMessage = " The inventory update was saved, but the task queue could not be refreshed. Reload the page to confirm the task is complete.";
			}
			else {
				taskCompletionMessage = " The requested recount was submitted and will remain visible until the manager reviews it.";
				setActiveVoiceTask(null);
			}
			setMessage(`${result.outcome === "POSTED" ? "Warehouse Executive confirmation complete. The validated stock movement was posted." : "Warehouse Executive confirmation complete. No stock changed; this transaction is waiting for manager review."}${taskCompletionMessage}`);
		} catch (error) {
			if (!navigator.onLine || error instanceof TypeError) try {
				clientRequestIdRef.current ??= `voice-${crypto.randomUUID()}`;
				if (!offlineOwnerId) throw new Error("A canonical user identity is required for offline storage.");
				await enqueueOfflineInventoryUpdate({
					ownerId: offlineOwnerId,
					clientRequestId: clientRequestIdRef.current,
					extraction
				});
				setSubmissionState("complete");
				setConfirmationOutcome(null);
				setMessage("Update saved safely on this device. No stock changed. It will synchronize automatically when the connection returns.");
				return;
			} catch {
				setSubmissionState("idle");
				setMessage("The connection is offline and this device could not save the update. Keep this page open and try again.");
				return;
			}
			setSubmissionState("idle");
			setMessage(`The transaction could not be confirmed. ${error instanceof Error && error.message ? error.message : "The transaction could not be confirmed."} Review the details and try again.`);
		}
	}
	async function startClarificationRecording() {
		if (!activeClarificationQuestion) return;
		setMessage("");
		window.speechSynthesis?.cancel();
		if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
			setMessage("This browser does not support microphone recording.");
			return;
		}
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: {
				echoCancellation: true,
				noiseSuppression: true,
				autoGainControl: true
			} });
			const mimeType = [
				"audio/webm;codecs=opus",
				"audio/webm",
				"audio/ogg;codecs=opus"
			].find((type) => MediaRecorder.isTypeSupported(type));
			const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
			chunksRef.current = [];
			streamRef.current = stream;
			recorderRef.current = recorder;
			recorder.ondataavailable = (event) => {
				if (event.data.size > 0) chunksRef.current.push(event.data);
			};
			recorder.onstop = () => void processClarificationRecording(recorder.mimeType);
			recorder.start(250);
			setClarificationState("recording");
			setLiveTranscript("");
			startLiveTranscription();
		} catch {
			setMessage("Microphone access was not available. Check the browser permission and try again.");
		}
	}
	function stopClarificationRecording() {
		stopLiveTranscription();
		if (recorderRef.current?.state === "recording") {
			recorderRef.current.stop();
			setClarificationState("transcribing");
		}
	}
	async function processClarificationRecording(mimeType) {
		const recording = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
		streamRef.current?.getTracks().forEach((track) => track.stop());
		streamRef.current = null;
		recorderRef.current = null;
		setLiveTranscript("");
		const question = activeClarificationQuestion;
		try {
			const spokenAnswer = (await transcribeAudio(recording, { language: "en" })).text.trim();
			if (!spokenAnswer) {
				setClarificationState("idle");
				setMessage("No clear answer was detected. Please answer again.");
				return;
			}
			setClarificationState("processing");
			setExtractionDurationMs(null);
			const extractionStartedAt = performance.now();
			const targetField = extraction?.missingFields[0] ?? extraction?.lowConfidenceFields[0] ?? "";
			const refinedResult = await extractInventoryDetails({
				transcript: `${extraction?.transcript ?? transcript}\nClarification answer to "${question}": ${spokenAnswer}.`,
				evidenceId: transcription?.evidenceId,
				context: buildTaskExtractionContext()
			});
			setExtractionDurationMs(performance.now() - extractionStartedAt);
			const refined = applyActiveTaskContext(applySelectedWorkflowContext(refinedResult), spokenAnswer);
			const unresolvedFields = new Set([...refined.missingFields, ...refined.lowConfidenceFields]);
			const interpretedAnswer = formatClarificationValue(targetField, refined);
			if (!targetField || unresolvedFields.has(targetField) || !interpretedAnswer) {
				setClarificationState("idle");
				setMessage(`I heard “${spokenAnswer}”, but could not match it confidently. ${clarificationRetryHelp(targetField)}`);
				speakClarificationQuestion(question);
				return;
			}
			setClarificationHistory((history) => [...history, {
				question,
				rawAnswer: spokenAnswer,
				interpretedAnswer
			}]);
			setExtraction(refined);
			setClarificationState("idle");
			if (refined.readyForConfirmation) setMessage("All required details are complete and ready for Warehouse Executive confirmation. No inventory stock was changed.");
			else {
				setMessage("Your answer was saved. Please answer only the next missing detail.");
				speakClarificationQuestion(refined.clarificationQuestions[0]);
			}
		} catch {
			setClarificationState("idle");
			setMessage("The clarification answer could not be processed. Please try again.");
		}
	}
	const weekStart = /* @__PURE__ */ new Date();
	weekStart.setDate(weekStart.getDate() - 7);
	const weekFilteredTransactions = snapshot ? snapshot.transactions.filter((transaction) => historyRange === "ALL" || new Date(transaction.createdAt) >= weekStart) : [];
	const allWorkerTransactions = snapshot ? mapTransactions(weekFilteredTransactions, historyRange === "ALL" ? 200 : 100, historyRange === "ALL") : [];
	const pendingHistoryStatuses = ["Pending", "Recount requested"];
	const managerReviewHistoryTypes = ["Cycle count", "Damage"];
	const displayedTransactions = allWorkerTransactions.filter((transaction) => historyView === "PENDING" ? pendingHistoryStatuses.includes(transaction.status) && managerReviewHistoryTypes.includes(transaction.type) : !pendingHistoryStatuses.includes(transaction.status));
	const weekPostedCount = weekFilteredTransactions.filter((transaction) => transaction.status === "POSTED").length;
	const weekPendingCount = weekFilteredTransactions.filter((transaction) => ["PENDING", "RECOUNT_REQUESTED"].includes(transaction.status)).length;
	const completedAssignedTasks = assignedTasks.filter((task) => task.status === "COMPLETED");
	const historySubtitle = snapshot ? historyRange === "WEEK" ? `${weekFilteredTransactions.length} update${weekFilteredTransactions.length === 1 ? "" : "s"} in the last 7 days · ${weekPostedCount} posted · ${weekPendingCount} waiting for review` : "Live data from the inventory database" : "Preview data until the inventory API is available";
	const todayKey = (/* @__PURE__ */ new Date()).toDateString();
	const todayTransactions = snapshot ? snapshot.transactions.filter((transaction) => new Date(transaction.createdAt).toDateString() === todayKey) : [];
	const openLinkedRecountTaskIds = new Set(assignedTasks.filter((task) => task.type === "RECOUNT" && (task.status === "OPEN" || task.status === "IN_PROGRESS") && task.sourceTransactionId).map((task) => task.sourceTransactionId));
	const transactionTasks = snapshot && !taskLoadError ? snapshot.transactions.filter((transaction) => transaction.status === "RECOUNT_REQUESTED" && openLinkedRecountTaskIds.has(transaction.id)).map((transaction) => {
		return {
			id: assignedTasks.find((task) => task.sourceTransactionId === transaction.id)?.id ?? transaction.id,
			title: `Recount ${transaction.product.name}`,
			detail: `${transaction.sourceLocation?.name ?? transaction.destinationLocation?.name ?? "Location not provided"} · ${transaction.quantity} ${transaction.product.unit}`,
			note: transaction.reviewNotes ?? "A manager requested a new physical count.",
			urgent: true,
			type: "RECOUNT",
			dueAt: null
		};
	}) : [];
	const automaticTasks = assignedTasks.filter((task) => ["OPEN", "IN_PROGRESS"].includes(task.status)).map((task) => {
		const linkedCase = task.discrepancies?.[0] ?? null;
		const shipment = task.type === "SHIP" && task.reservationId ? {
			shipmentReference: task.shipmentReference ?? void 0,
			reservationReference: task.reservation?.request?.referenceNumber ?? void 0
		} : {};
		return {
			id: task.id,
			title: task.title,
			type: task.type,
			dueAt: task.dueAt ?? null,
			detail: task.type === "TRANSFER" ? `${task.quantity ?? 0} ${task.product?.unit ?? "unit"} · ${task.sourceLocation?.name ?? "Source missing"} → ${task.destinationLocation?.name ?? "Destination missing"}${task.product ? ` · ${task.product.name}` : ""}` : task.type === "SHIP" && task.reservationId ? `${task.quantity ?? 0} ${task.product?.unit ?? "unit"} · ${task.sourceLocation?.name ?? "Location not provided"}${task.product ? ` · ${task.product.name}` : ""}${task.reservation?.request?.referenceNumber ? ` · Order ${task.reservation.request.referenceNumber}` : ""}` : `${task.location?.name ?? "Location not provided"}${task.product ? ` · ${task.product.name}` : ""}`,
			note: task.description ?? "Assigned inventory work.",
			urgent: task.priority === "HIGH" || task.priority === "URGENT",
			status: task.status,
			automatic: true,
			...shipment,
			caseNumber: linkedCase?.caseNumber ?? void 0,
			caseExpected: linkedCase?.expectedQuantity ?? void 0,
			caseCounted: linkedCase?.countedQuantity ?? void 0,
			caseDifference: linkedCase?.differenceQuantity ?? void 0,
			priority: task.priority,
			planNumber: task.cycleCountPlan?.planNumber,
			planTitle: task.cycleCountPlan?.title,
			planCompleted: task.cycleCountPlan?.tasks?.filter((entry) => entry.status === "COMPLETED").length,
			planTotal: task.cycleCountPlan?.tasks?.length,
			blindCount: task.cycleCountPlan?.blindCount,
			countPeriod: task.cycleCountPlan?.periodMonth,
			monthEndCount: task.type === "CYCLE_COUNT" && Boolean(task.cycleCountPlan)
		};
	});
	const workerTasks = [...automaticTasks, ...transactionTasks.filter((candidate) => !automaticTasks.some((task) => task.title === candidate.title)).map((task) => ({
		...task,
		status: "WAITING",
		automatic: false
	}))];
	(0, import_react.useEffect)(() => {
		onPendingTaskCountChange?.(workerTasks.length);
	}, [onPendingTaskCountChange, workerTasks.length]);
	function taskWorkflow(type) {
		if (type === "RECEIVE") return "RECEIVE";
		if (type === "PICK" || type === "SHIP") return "SHIP";
		if (type === "TRANSFER") return "TRANSFER";
		return "CYCLE_COUNT";
	}
	async function startAssignedTask(taskId) {
		setTaskActionId(taskId);
		try {
			await startInventoryTask(taskId);
			setAssignedTasks(await fetchInventoryTasks());
			setMessage("Task started. Complete it after the physical work is done.");
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "The task could not be started.");
		} finally {
			setTaskActionId(null);
		}
	}
	async function completeAssignedTask(taskId) {
		setTaskActionId(taskId);
		try {
			await completeInventoryTask(taskId);
			const [tasks, inventory] = await Promise.all([fetchInventoryTasks(), fetchInventorySnapshot()]);
			setAssignedTasks(tasks);
			setSnapshot(inventory);
			setMessage("Shipment task completed. Stock was posted and the reservation was updated.");
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "The shipment could not be completed.");
		} finally {
			setTaskActionId(null);
		}
	}
	async function openTaskInVoice(taskId) {
		const task = assignedTasks.find((candidate) => candidate.id === taskId);
		if (!task) return;
		setTaskActionId(taskId);
		try {
			if (task.status === "OPEN") await startInventoryTask(taskId);
			const refreshedTasks = await fetchInventoryTasks();
			setAssignedTasks(refreshedTasks);
			const refreshedTask = refreshedTasks.find((candidate) => candidate.id === taskId) ?? task;
			if (refreshedTask.status === "COMPLETED" || refreshedTask.status === "CANCELLED") {
				setMessage("This task has already been completed. Refresh the page to see your updated queue.");
				return;
			}
			setActiveVoiceTask({
				id: refreshedTask.id,
				title: refreshedTask.title,
				type: refreshedTask.type,
				description: refreshedTask.description,
				product: refreshedTask.product,
				location: refreshedTask.location,
				quantity: refreshedTask.quantity,
				sourceLocation: refreshedTask.sourceLocation,
				destinationLocation: refreshedTask.destinationLocation,
				shipmentReference: refreshedTask.shipmentReference,
				reservationReference: refreshedTask.reservation?.request?.referenceNumber,
				source: "ASSIGNED"
			});
			resetVoice();
			setVoiceOrigin("task-queue");
			setSelectedWorkflow(taskWorkflow(task.type));
			setMessage(task.type === "TRANSFER" ? `Transfer task loaded. Confirm the assigned move from ${refreshedTask.sourceLocation?.name ?? "the source"} to ${refreshedTask.destinationLocation?.name ?? "the destination"} by voice.` : `Task loaded. Speak the actual quantity and any condition or reference required for “${task.title}”.`);
			onNavigate("Voice entry");
			window.scrollTo({
				top: 0,
				behavior: "smooth"
			});
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Task status could not be updated.");
		} finally {
			setTaskActionId(null);
		}
	}
	function openRecountInVoice(taskId) {
		const task = assignedTasks.find((candidate) => candidate.id === taskId);
		if (!task || !["OPEN", "IN_PROGRESS"].includes(task.status)) {
			setMessage("The recount task could not be loaded. Refresh the page and try again.");
			return;
		}
		openTaskInVoice(task.id);
	}
	const cycleCountsToday = todayTransactions.filter((transaction) => transaction.action === "CYCLE_COUNT").length;
	const postedToday = todayTransactions.filter((transaction) => transaction.status === "POSTED").length;
	const cycleCountTransactions = todayTransactions.filter((transaction) => transaction.action === "CYCLE_COUNT");
	const postedTransactions = todayTransactions.filter((transaction) => transaction.status === "POSTED");
	const metricPageTransactions = page === "My transactions" ? todayTransactions : page === "Cycle counts" ? cycleCountTransactions : page === "Posted today" ? postedTransactions : [];
	const metricPageTitle = page === "My transactions" ? "Transactions created today" : page === "Cycle counts" ? "Cycle counts submitted today" : "Validated transactions posted today";
	async function handleCancelTransaction(transaction) {
		if (!window.confirm(`Cancel TX-${transaction.id.slice(0, 8).toUpperCase()} (${transaction.action} ${transaction.quantity} ${transaction.product.name})? No stock has changed yet, and the record will be marked as cancelled.`)) return;
		setCancellingTransactionId(transaction.id);
		setMessage("");
		try {
			await cancelInventoryTransaction(transaction.id);
			setSnapshot(await fetchInventorySnapshot());
			setMessage(`TX-${transaction.id.slice(0, 8).toUpperCase()} was cancelled. No stock was changed.`);
		} catch {
			setMessage("The transaction could not be cancelled. Refresh and try again.");
		} finally {
			setCancellingTransactionId(null);
		}
	}
	const insufficientStockNotice = extraction ? (() => {
		const { action, product, quantity, sourceLocation } = extraction.fields;
		if (!action || !product || quantity === null || !sourceLocation) return null;
		if (!STOCK_OUT_ACTIONS.has(action)) return null;
		const balance = snapshot?.balances.find((candidate) => candidate.product.id === product.id && candidate.location.id === sourceLocation.id);
		const available = balance ? Math.max(0, balance.quantity - balance.reservedQuantity) : 0;
		if (available >= quantity) return null;
		return {
			requested: quantity,
			available
		};
	})() : null;
	function formatLocationWithSource(location, source) {
		if (!location) return "Not required / missing";
		if (source === "RECEIVING_DEFAULT") return `${location.name} — selected automatically`;
		if (source === "WORKER_ZONE") return `${location.name} — your assigned zone`;
		return location.name;
	}
	const extractedDetails = extraction ? [
		["Action", extraction.fields.action?.replaceAll("_", " ") ?? "Not identified"],
		["Item name", extraction.fields.product ? `${extraction.fields.product.name} (${extraction.fields.product.sku})` : "Not identified"],
		["Number", extraction.fields.quantity === null ? "Not identified" : `${extraction.fields.quantity} ${extraction.fields.product?.unit ?? "units"}`],
		["From shelf", formatLocationWithSource(extraction.fields.sourceLocation, extraction.sourceLocationSource)],
		["To shelf", formatLocationWithSource(extraction.fields.destinationLocation, extraction.destinationLocationSource)],
		["Item condition", extraction.fields.condition],
		["Order or reference", extraction.fields.referenceNumber ?? "Not provided"]
	] : [];
	const activeTaskExample = activeVoiceTask ? (() => {
		const item = activeVoiceTask.product?.name ?? "the item";
		const place = activeVoiceTask.location?.name ?? "the shelf";
		if (activeVoiceTask.type === "RECEIVE") return "I received [number].";
		if (activeVoiceTask.type === "SHIP") {
			const order = activeVoiceTask.reservationReference ? ` for Order ${activeVoiceTask.reservationReference}` : "";
			return `I shipped [number] ${item} from ${activeVoiceTask.sourceLocation?.name ?? place}${order}.`;
		}
		if (activeVoiceTask.type === "PICK") return `I shipped [number] ${item} from ${place}.`;
		if (activeVoiceTask.type === "TRANSFER") return `I transferred ${activeVoiceTask.quantity ?? "[number]"} ${item} from ${activeVoiceTask.sourceLocation?.name ?? "the source"} to ${activeVoiceTask.destinationLocation?.name ?? "the destination"}.`;
		if (["DAMAGE", "DAMAGE_INSPECTION"].includes(activeVoiceTask.type)) return `I found [number] damaged ${item} on ${place}.`;
		return "I counted [number].";
	})() : "";
	async function checkMicrophoneAccess() {
		if (!navigator.mediaDevices?.getUserMedia) {
			setMicrophoneStatus("Microphone is not supported in this browser");
			return;
		}
		setMicrophoneStatus("Checking…");
		try {
			(await navigator.mediaDevices.getUserMedia({ audio: true })).getTracks().forEach((track) => track.stop());
			setMicrophoneStatus("Microphone is ready");
		} catch {
			setMicrophoneStatus("Permission is blocked — allow microphone access in the browser");
		}
	}
	function testSpeaker() {
		if (!("speechSynthesis" in window)) {
			setSpeakerStatus("Speaker test is not supported in this browser");
			return;
		}
		window.speechSynthesis.cancel();
		window.speechSynthesis.speak(createGuidanceUtterance("Inventory Management voice guidance is working. What did you do?"));
		setSpeakerStatus("Test message played");
	}
	if (page === "Home" || page === "Overview") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExecutiveHome, {
		workerName,
		workerGreeting,
		clockNow,
		snapshot,
		todayTransactions,
		cycleCountsToday,
		postedToday,
		workerTasks,
		onNavigate,
		onStartVoiceWorkflow: startWorkflowFromHome,
		newTaskAlert,
		setNewTaskAlert
	});
	if (page === "Task queue") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExecutiveTaskQueue, {
		workerTasks,
		taskActionId,
		lastTaskRefresh,
		completedAssignedTasks: completedAssignedTasks.length,
		taskLoadError,
		message,
		onRefreshTasks: () => void refreshWorkerQueue(),
		onOpenTask: openTaskInVoice,
		onStartTask: (taskId) => void startAssignedTask(taskId),
		onCompleteTask: (taskId) => void completeAssignedTask(taskId),
		onOpenRecount: openRecountInVoice,
		onBack: () => {
			onNavigate("Home");
			window.scrollTo({
				top: 0,
				behavior: "smooth"
			});
		}
	});
	if (page === "History") {
		const reviewActions = ["Cycle count", "Damage"];
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExecutiveHistory, {
			pendingTransactions: allWorkerTransactions.filter((transaction) => ["Pending", "Recount requested"].includes(transaction.status) && reviewActions.includes(transaction.type)),
			completedTransactions: allWorkerTransactions.filter((transaction) => !["Pending", "Recount requested"].includes(transaction.status) || !reviewActions.includes(transaction.type)),
			offlineQueueCount: pendingSyncCount ?? 0,
			deletingTransactionId: cancellingTransactionId,
			actionMessage: message,
			onDeletePending: (transactionId) => {
				const transaction = snapshot?.transactions.find((candidate) => `TX-${candidate.id.slice(0, 8).toUpperCase()}` === transactionId);
				if (transaction) {
					handleCancelTransaction(transaction);
					return;
				}
				setMessage("The pending transaction could not be found. Refresh the page and try again.");
			},
			onBack: () => {
				onNavigate("Home");
				window.scrollTo({
					top: 0,
					behavior: "smooth"
				});
			}
		});
	}
	if (page === "Settings") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExecutiveSettings, {
		workerName,
		isOnline: isOnline ?? true,
		pendingSyncCount: pendingSyncCount ?? 0,
		syncState: syncState ?? "idle",
		microphoneStatus,
		speakerStatus,
		onCheckMicrophone: () => void checkMicrophoneAccess(),
		onTestSpeaker: testSpeaker,
		onSignOut: () => onSignOut?.(),
		onBack: () => {
			onNavigate("Home");
			window.scrollTo({
				top: 0,
				behavior: "smooth"
			});
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "dashboard-content page-dashboard worker-dashboard",
		"data-active-page": page,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				id: "worker-overview",
				className: "space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						id: "worker-overview-hero",
						className: "hero-3d relative overflow-hidden rounded-[26px] border border-[#d9e6f8] p-6 text-white sm:p-7",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[48px] border-white/10" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[#6ea5ff]/30 blur-3xl" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute right-1/3 top-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#c4d8ff] backdrop-blur",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 13 }), new Intl.DateTimeFormat("en", {
												weekday: "long",
												day: "numeric",
												month: "long",
												year: "numeric"
											}).format(clockNow)]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
											className: "mt-3 text-[24px] font-extrabold tracking-[-0.03em] sm:text-[30px]",
											children: [
												workerGreeting,
												", ",
												workerName
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1.5 max-w-2xl text-sm font-semibold leading-6 text-[#c6d7f6]",
											children: snapshot ? workerTasks.length > 0 || postedToday > 0 ? `${workerTasks.length} open task${workerTasks.length === 1 ? "" : "s"} and ${postedToday} update${postedToday === 1 ? "" : "s"} posted today — pick a tool below to continue.` : "Your workspace is ready — record voice updates, complete tasks and track your activity from the toolbar below." : "Live inventory data is loading from the warehouse service."
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-2.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, {
												size: 18,
												className: "text-[#a9c6ff]"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#9db9ef]",
												children: "Live clock"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-extrabold tabular-nums",
												children: new Intl.DateTimeFormat("en", {
													hour: "2-digit",
													minute: "2-digit",
													hour12: true
												}).format(clockNow)
											})] })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardCheck, {
												size: 18,
												className: "text-[#ffd08a]"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#9db9ef]",
												children: "Open tasks"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-sm font-extrabold",
												children: [workerTasks.length, " waiting"]
											})] })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
												size: 18,
												className: "text-[#9dffce]"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#9db9ef]",
												children: "Posted today"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-sm font-extrabold",
												children: [postedToday, " updates"]
											})] })]
										})
									]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
								label: "My transactions",
								value: String(todayTransactions.length),
								detail: "Created today",
								icon: ArrowRightLeft,
								onClick: () => {
									onNavigate("My transactions");
									window.scrollTo({
										top: 0,
										behavior: "smooth"
									});
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
								label: "Cycle counts",
								value: String(cycleCountsToday),
								detail: "Submitted today",
								icon: ClipboardCheck,
								tone: "violet",
								onClick: () => {
									onNavigate("Cycle counts");
									window.scrollTo({
										top: 0,
										behavior: "smooth"
									});
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
								label: "Open tasks",
								value: String(workerTasks.length),
								detail: workerTasks.some((task) => task.urgent) ? "Recount action required" : "No urgent recounts",
								icon: Clock3,
								tone: "amber",
								onClick: () => {
									onNavigate("Task queue");
									window.scrollTo({
										top: 0,
										behavior: "smooth"
									});
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
								label: "Posted today",
								value: String(postedToday),
								detail: "Validated inventory updates",
								icon: ShieldCheck,
								tone: "green",
								onClick: () => {
									onNavigate("Posted today");
									window.scrollTo({
										top: 0,
										behavior: "smooth"
									});
								}
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						id: "worker-overview-command",
						className: "rounded-[24px] border border-[#d8e5f7] bg-white p-5 shadow-[0_18px_45px_rgba(16,42,86,0.1)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#155eef]",
									children: "Quick toolbar"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-lg font-extrabold text-[#102a56]",
									children: "Jump to any tool in one tap"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-semibold text-[#8294ac]",
									children: "Your most-used warehouse tools, right here — no menus required."
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-8",
							children: [
								[
									"Voice entry",
									"Voice entry",
									Mic,
									"from-[#155eef] to-[#4a7df0]",
									void 0
								],
								[
									"Task queue",
									"Task queue",
									ClipboardCheck,
									"from-[#7257d6] to-[#9678f2]",
									workerTasks.length
								],
								[
									"Active items",
									"Active items",
									Boxes,
									"from-[#16865b] to-[#2fa97c]",
									snapshot?.products.length ?? 0
								],
								[
									"My history",
									"My history",
									FileClock,
									"from-[#be185d] to-[#ec4899]",
									void 0
								],
								[
									"My transactions",
									"My transactions",
									ArrowRightLeft,
									"from-[#d47b08] to-[#f0a13a]",
									todayTransactions.length
								],
								[
									"Cycle counts",
									"Cycle counts",
									CircleCheck,
									"from-[#0e7490] to-[#38bdf8]",
									cycleCountsToday
								],
								[
									"Posted today",
									"Posted today",
									ShieldCheck,
									"from-[#16865b] to-[#22aa78]",
									postedToday
								],
								[
									"Settings",
									"Settings",
									Settings,
									"from-[#455b78] to-[#6e86a5]",
									void 0
								],
								[
									"Overview",
									"Home",
									LayoutDashboard,
									"from-[#4338ca] to-[#6366f1]",
									void 0
								]
							].map(([page, label, ToolIcon, tone, count]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									onNavigate(page);
									window.scrollTo({
										top: 0,
										behavior: "smooth"
									});
								},
								className: "group relative flex min-h-[88px] flex-col items-start justify-between rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-3 text-left transition hover:-translate-y-1 hover:border-[#b9cff0] hover:bg-white hover:shadow-[0_12px_28px_rgba(16,45,82,0.1)]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-[0_8px_18px_rgba(21,94,239,0.22)] transition group-hover:scale-110`,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolIcon, { size: 18 })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-2 text-xs font-extrabold text-[#24466f]",
										children: label
									}),
									count !== void 0 && count > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "absolute right-2.5 top-2.5 rounded-full bg-[#fff4df] px-2 py-0.5 text-[9px] font-extrabold text-[#b36d0c]",
										children: count
									})
								]
							}, page))
						})]
					})
				]
			}),
			[
				"My transactions",
				"Cycle counts",
				"Posted today"
			].includes(page) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "worker-metric-details",
				className: "overflow-hidden rounded-[24px] border border-[#d8e4f3] bg-white shadow-[0_18px_48px_rgba(16,45,82,0.08)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-4 border-b border-[#e6edf6] bg-[#f7faff] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]",
							children: "Detailed page"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-1 text-xl font-extrabold text-[#102a56]",
							children: metricPageTitle
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs font-semibold text-[#7b8fa9]",
							children: "Every record below is included in the number shown on the Overview card."
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							onNavigate("Overview");
							window.scrollTo({
								top: 0,
								behavior: "smooth"
							});
						},
						className: "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-4 text-xs font-extrabold text-[#155eef]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
							size: 16,
							className: "rotate-90"
						}), " Back to Overview"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "min-w-full text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-[#e5ebf4] text-[10px] uppercase tracking-wider text-[#8295af]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3",
									children: "Transaction"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3",
									children: "Action"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3",
									children: "Item"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3",
									children: "Quantity"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3",
									children: "Location"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3",
									children: "Time"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3",
									children: "Status"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3",
									children: "Cancel"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [metricPageTransactions.map((transaction) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-[#eef2f7] last:border-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "whitespace-nowrap px-5 py-4 font-extrabold text-[#155eef]",
									children: ["TX-", transaction.id.slice(0, 8).toUpperCase()]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap px-5 py-4 font-bold text-[#496482]",
									children: formatAction(transaction.action)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap px-5 py-4 font-extrabold text-[#24466f]",
									children: transaction.product.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "whitespace-nowrap px-5 py-4 font-bold text-[#29466f]",
									children: [
										transaction.quantity,
										" ",
										transaction.product.unit
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap px-5 py-4 text-[#6c829f]",
									children: transaction.sourceLocation?.name ?? transaction.destinationLocation?.name ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap px-5 py-4 text-[#6c829f]",
									children: new Intl.DateTimeFormat("en", {
										hour: "2-digit",
										minute: "2-digit"
									}).format(new Date(transaction.createdAt))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap px-5 py-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `rounded-full px-3 py-1 text-[10px] font-extrabold ${transaction.status === "POSTED" ? "bg-[#eaf8f1] text-[#16865b]" : transaction.status === "REJECTED" ? "bg-[#fff0f0] text-[#b83b3b]" : transaction.status === "CANCELLED" ? "bg-[#eef2f7] text-[#7b8fa9]" : "bg-[#fff5df] text-[#a8670d]"}`,
										children: transaction.status.replaceAll("_", " ")
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap px-5 py-4",
									children: "PENDING" === transaction.status || "RECOUNT_REQUESTED" === transaction.status ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: cancellingTransactionId === transaction.id,
										onClick: () => void handleCancelTransaction(transaction),
										className: "rounded-lg border border-[#efb5b5] px-3 py-1.5 text-[11px] font-extrabold text-[#b83f3f] transition hover:bg-[#fff2f2] disabled:opacity-50",
										children: cancellingTransactionId === transaction.id ? "Cancelling…" : "Cancel"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[#d3dbe6]",
										children: "—"
									})
								})
							]
						}, transaction.id)), metricPageTransactions.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 8,
							className: "px-6 py-12 text-center text-sm font-semibold text-[#7b8fa9]",
							children: "No matching records were found for today."
						}) })] })]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					id: "voice-entry",
					className: "scroll-mt-24 overflow-hidden rounded-[24px] border border-[#dfe8f4] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.065)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border-b border-[#e8edf5] px-6 py-5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]",
										children: "Voice transaction"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "mt-1 text-xl font-extrabold tracking-[-0.03em] text-[#102a56]",
										children: voiceCopy.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-sm text-[#778ba8]",
										children: voiceCopy.detail
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${voiceState === "recording" ? "animate-pulse bg-[#ffe8e8] text-[#d94343]" : "bg-[#edf4ff] text-[#155eef]"}`,
									children: voiceState === "extracted" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { size: 23 }) : voiceState === "extracting" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 23 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { size: 23 })
								})]
							})
						}),
						activeVoiceTask && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mx-6 mt-5 rounded-[20px] border border-[#b9d0f8] bg-gradient-to-r from-[#edf4ff] to-[#f8fbff] p-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]",
											children: "Active assigned task"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "mt-1 text-base font-extrabold text-[#17345f]",
											children: activeVoiceTask.title
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs font-semibold leading-5 text-[#617796]",
											children: activeVoiceTask.description ?? "Complete this task using the verified voice workflow."
										})
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "w-fit rounded-full bg-[#155eef] px-3 py-1 text-[10px] font-extrabold text-white",
										children: "In progress"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
									children: [
										["What to do", activeVoiceTask.type.replaceAll("_", " ")],
										["Item name", activeVoiceTask.product?.name ?? "Say the item name"],
										...activeVoiceTask.type === "TRANSFER" ? [["Pick from", activeVoiceTask.sourceLocation?.name ?? "Source not provided"], ["Transfer to", activeVoiceTask.destinationLocation?.name ?? "Destination not provided"]] : [[activeVoiceTask.type === "SHIP" ? "Ship from" : "Shelf or area", activeVoiceTask.sourceLocation?.name ?? activeVoiceTask.location?.name ?? "Say the shelf or area"]],
										["Quantity", activeVoiceTask.quantity ?? "Say the number you counted or moved"],
										...activeVoiceTask.type === "SHIP" && activeVoiceTask.shipmentReference ? [["Shipment reference", activeVoiceTask.shipmentReference]] : [],
										...activeVoiceTask.type === "SHIP" && activeVoiceTask.reservationReference ? [["Order reference", activeVoiceTask.reservationReference]] : []
									].map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl border border-white bg-white/80 px-3 py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[9px] font-extrabold uppercase tracking-wider text-[#8295af]",
											children: label
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs font-extrabold text-[#29466f]",
											children: value
										})]
									}, label))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 flex items-start gap-3 rounded-xl bg-[#102f60] px-4 py-3 text-white",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, {
										size: 18,
										className: "mt-0.5 shrink-0 text-[#8eb8ff]"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-extrabold",
											children: "Task details are already filled and protected"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1 text-sm font-extrabold leading-6 text-white",
											children: [
												"“",
												activeTaskExample,
												"”"
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-[11px] leading-5 text-[#c5d7ee]",
											children: activeVoiceTask.type === "TRANSFER" ? "Say the shown sentence to confirm the assigned product, quantity and route. Inventory changes only after your confirmation and validation." : activeVoiceTask.type === "SHIP" ? "Say or confirm the physical action, for example “Shipped [number] [item] from [shelf] for [order]”. The assigned product, shelf, shipment and order references are already filled in." : "Replace [number] with the real number. For Receive and Cycle Count, you do not need to repeat the item or location."
										})
									] })]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-6",
							children: [
								voiceState === "idle" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid place-items-center rounded-[22px] border border-dashed border-[#b9c9df] bg-[#f8fbff] px-5 py-10 text-center",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => void startRecording(),
											className: "grid h-20 w-20 place-items-center rounded-full bg-[#155eef] text-white shadow-[0_16px_34px_rgba(21,94,239,0.28)] transition hover:scale-105",
											"aria-label": "Start microphone recording",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { size: 30 })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-5 text-sm font-extrabold text-[#24466f]",
											children: "Tap to start speaking"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs text-[#8194ae]",
											children: "Your browser will request microphone permission."
										}),
										message && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-4 rounded-xl bg-[#fff5df] px-4 py-3 text-sm font-semibold text-[#916018]",
											children: message
										})
									]
								}),
								voiceState === "recording" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid min-h-[225px] place-items-center rounded-[22px] bg-[#fff7f7] p-5 text-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "w-full max-w-lg",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mx-auto flex h-20 w-20 items-center justify-center gap-1 rounded-full bg-[#d94343] text-white shadow-[0_15px_35px_rgba(217,67,67,0.24)]",
												children: [
													14,
													28,
													40,
													24,
													16
												].map((height, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "w-1 animate-pulse rounded-full bg-white",
													style: { height }
												}, index))
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-5 text-sm font-extrabold text-[#7d2c2c]",
												children: "Recording from your microphone…"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-xs text-[#a45a5a]",
												children: "Speak clearly, then stop the recording."
											}),
											(liveTranscriptSupported || liveTranscript) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-5 rounded-2xl border border-[#f3c6c6] bg-white p-4 text-left shadow-[0_8px_22px_rgba(201,63,63,0.08)]",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between gap-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#a45a5a]",
														children: "Live transcript"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "inline-flex items-center gap-1.5 rounded-full bg-[#d94343] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 animate-pulse rounded-full bg-white" }), "Live"]
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "mt-2 min-h-[3.5rem] text-sm font-semibold leading-6 text-[#5b2b2b]",
													children: [liveTranscript || "Listening for speech…", liveTranscript && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ml-0.5 inline-block h-4 w-[2px] animate-pulse rounded-full bg-[#d94343] align-middle" })]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: stopRecording,
												className: "mt-5 rounded-xl bg-[#c93f3f] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(201,63,63,0.2)]",
												children: "Stop recording"
											})
										]
									})
								}),
								voiceState === "transcribing" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid min-h-[225px] place-items-center rounded-[22px] bg-[#f6f9ff] text-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mx-auto grid h-20 w-20 animate-pulse place-items-center rounded-full bg-[#155eef] text-white shadow-[0_15px_35px_rgba(21,94,239,0.22)]",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 28 })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-5 text-sm font-extrabold text-[#24466f]",
											children: "Whisper is transcribing…"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs text-[#8194ae]",
											children: "The first recording may take longer while the model loads."
										})
									] })
								}),
								voiceState === "extracting" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid min-h-[225px] place-items-center rounded-[22px] bg-[#f7f5ff] text-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mx-auto grid h-20 w-20 animate-pulse place-items-center rounded-full bg-[#7257d6] text-white shadow-[0_15px_35px_rgba(114,87,214,0.22)]",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 28 })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-5 text-sm font-extrabold text-[#3f3470]",
											children: "Qwen is extracting inventory details…"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs text-[#8379aa]",
											children: "Products and locations are checked against approved database records."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => {
												resetVoice();
												onNavigate(voiceOrigin === "task-queue" ? "Task queue" : "Home");
												window.scrollTo({
													top: 0,
													behavior: "smooth"
												});
											},
											className: "mt-5 rounded-xl border border-[#c9b8f0] bg-white px-5 py-3 text-sm font-extrabold text-[#5a46b0] shadow-[0_8px_20px_rgba(114,87,214,0.1)] transition hover:bg-[#f5f0ff]",
											children: "Cancel extraction"
										})
									] })
								}),
								(voiceState === "review" || voiceState === "extracted") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-2xl border border-[#dfe7f2] bg-[#f8fafc] p-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8396b0]",
											children: "Transcript"
										}), voiceState === "review" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
											"aria-label": "Editable voice transcript",
											value: transcript,
											onChange: (event) => setTranscript(event.target.value),
											rows: 4,
											className: "mt-2 w-full resize-y rounded-xl border border-[#d8e2ef] bg-white px-3 py-2 text-sm font-semibold leading-6 text-[#29466f] outline-none focus:border-[#6f9cff] focus:ring-4 focus:ring-[#e7efff]"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-2 text-sm font-semibold leading-6 text-[#29466f]",
											children: [
												"“",
												transcript,
												"”"
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4",
										children: [
											["Language", transcription?.language?.toUpperCase() ?? "—"],
											["Language confidence", transcription ? `${Math.round(transcription.languageProbability * 100)}%` : "—"],
											["Audio duration", transcription ? `${transcription.duration.toFixed(1)} sec` : "—"],
											["AI extraction time", extractionDurationMs !== null ? `${(extractionDurationMs / 1e3).toFixed(2)} sec` : "—"]
										].map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-xl border border-[#e3eaf3] px-4 py-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a9bb3]",
												children: label
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-sm font-extrabold text-[#203f69]",
												children: value
											})]
										}, label))
									}),
									voiceState === "extracted" && extraction && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: `rounded-2xl border p-4 ${extraction.readyForConfirmation ? "border-[#bde5d4] bg-[#f1fbf6]" : "border-[#f1d69a] bg-[#fff9ec]"}`,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: `text-[10px] font-extrabold uppercase tracking-[0.14em] ${extraction.readyForConfirmation ? "text-[#16865b]" : "text-[#b36d0c]"}`,
														children: "AI extraction"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "mt-1 text-sm font-extrabold text-[#203f69]",
														children: extraction.readyForConfirmation ? "Complete and ready for Warehouse Executive confirmation" : "More information is required"
													})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "w-fit rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#536b8b]",
														children: [Math.round(extraction.confidence * 100), "% confidence"]
													})]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mt-4 grid gap-3 sm:grid-cols-2",
												children: extractedDetails.map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "rounded-xl border border-[#e3eaf3] bg-white px-4 py-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a9bb3]",
														children: label
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "mt-1 text-sm font-extrabold capitalize text-[#203f69]",
														children: value
													})]
												}, label))
											}),
											insufficientStockNotice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-4 flex items-start gap-3 rounded-xl border border-[#f3c0c0] bg-[#fff1f1] px-4 py-3 text-sm font-semibold text-[#a12f2f]",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
													size: 18,
													className: "mt-0.5 shrink-0"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-extrabold",
													children: "Insufficient available stock"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "mt-1 text-xs font-semibold leading-5 text-[#b04848]",
													children: [
														"This update requests ",
														insufficientStockNotice.requested,
														" units, but only ",
														insufficientStockNotice.available,
														" are currently available at ",
														extraction.fields.sourceLocation?.name ?? "the selected shelf",
														". The warehouse service will not confirm the transaction until the quantity is corrected."
													]
												})] })]
											}),
											extraction.requiresManagerReview && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-4 flex items-start gap-3 rounded-xl bg-[#fff5df] px-4 py-3 text-sm font-semibold text-[#916018]",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
													size: 18,
													className: "mt-0.5 shrink-0"
												}), "This action will require manager review after Warehouse Executive confirmation."]
											}),
											extraction.clarificationQuestions.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-4 rounded-xl border border-[#f1d69a] bg-[#fffaf0] px-4 py-3",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-xs font-extrabold text-[#8b5a13]",
															children: "Please clarify only this detail:"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "mt-2 text-sm font-extrabold text-[#765522]",
															children: ["• ", activeClarificationQuestion]
														})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
															type: "button",
															onClick: () => speakClarificationQuestion(),
															className: "flex w-fit items-center gap-2 rounded-lg border border-[#e5c77f] bg-white px-3 py-2 text-xs font-extrabold text-[#8b5a13]",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { size: 15 }), "Hear question"]
														})]
													}),
													clarificationHistory.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "mt-4 space-y-2 border-t border-[#efdcae] pt-3",
														children: clarificationHistory.map((entry, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "text-xs",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																	className: "font-semibold text-[#8d734b]",
																	children: entry.question
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																	className: "mt-1 font-semibold text-[#8d734b]",
																	children: [
																		"Raw speech: “",
																		entry.rawAnswer,
																		"”"
																	]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																	className: "mt-0.5 font-extrabold text-[#16865b]",
																	children: ["AI understood: ", entry.interpretedAnswer]
																})
															]
														}, `${entry.question}-${index}`))
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "mt-4",
														children: [
															clarificationState === "idle" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
																type: "button",
																onClick: () => void startClarificationRecording(),
																className: "flex w-full items-center justify-center gap-2 rounded-xl bg-[#155eef] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(21,94,239,0.2)] sm:w-auto",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { size: 17 }), "Answer this question by voice"]
															}),
															clarificationState === "recording" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
																type: "button",
																onClick: stopClarificationRecording,
																className: "flex w-full animate-pulse items-center justify-center gap-2 rounded-xl bg-[#c93f3f] px-5 py-3 text-sm font-extrabold text-white sm:w-auto",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { size: 17 }), "Stop answer recording"]
															}), (liveTranscriptSupported || liveTranscript) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "mt-3 rounded-xl border border-[#f3c6c6] bg-white px-3 py-2.5 text-left",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																	className: "text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#a45a5a]",
																	children: "Live answer"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																	className: "mt-1 text-sm font-semibold leading-6 text-[#5b2b2b]",
																	children: liveTranscript || "Listening for your answer…"
																})]
															})] }),
															clarificationState === "transcribing" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "flex items-center gap-2 text-sm font-extrabold text-[#765522]",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
																	size: 17,
																	className: "animate-pulse"
																}), "Converting your answer to text…"]
															}),
															clarificationState === "processing" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "flex items-center gap-2 text-sm font-extrabold text-[#765522]",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
																	size: 17,
																	className: "animate-pulse"
																}), "Adding your answer to the existing details…"]
															})
														]
													})
												]
											})
										]
									}),
									voiceState === "review" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: resetVoice,
											className: "rounded-xl border border-[#d8e1ee] px-5 py-3 text-sm font-extrabold text-[#536b8b] hover:bg-[#f7f9fc]",
											children: "Record again"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => void saveTranscript(),
											className: "flex items-center justify-center gap-2 rounded-xl bg-[#7257d6] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(114,87,214,0.2)]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 17 }), "Extract inventory details"]
										})]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-5",
										children: [
											submissionState === "complete" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: `mb-4 rounded-xl border px-4 py-3 ${confirmationOutcome === "POSTED" ? "border-[#bde5d4] bg-[#f1fbf6] text-[#176f4e]" : "border-[#f1d69a] bg-[#fff9ec] text-[#916018]"}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm font-extrabold",
													children: confirmationOutcome === "POSTED" ? "Transaction posted" : "Pending manager review"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "mt-1 text-xs font-semibold",
													children: ["Reference: TX-", submittedTransaction?.id.slice(0, 8).toUpperCase()]
												})]
											}),
											submissionState === "complete" && submittedTransaction && ["DAMAGE", "RECEIVE"].includes(submittedTransaction.action) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mb-4 rounded-xl border border-[#d5e1f0] bg-[#f8fbff] px-4 py-4",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#0e7490]",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 13 }),
															" Photo evidence",
															evidenceAttached && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "rounded-full bg-[#eaf8f1] px-2 py-0.5 text-[9px] normal-case text-[#16865b]",
																children: "attached"
															})
														]
													}),
													!evidencePreview ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "mt-2 flex flex-wrap items-center gap-2",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
																className: "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#b9d0f8] bg-white px-3 py-2 text-[11px] font-extrabold text-[#155eef] transition hover:bg-[#eaf2ff]",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { size: 13 }),
																	"Choose file",
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
																		type: "file",
																		accept: "image/jpeg,image/png,image/webp",
																		className: "sr-only",
																		onChange: (event) => prepareEvidencePhoto(event.target.files?.[0])
																	})
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
																className: "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#b9d0f8] bg-white px-3 py-2 text-[11px] font-extrabold text-[#155eef] transition hover:bg-[#eaf2ff]",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 13 }),
																	"Camera",
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
																		type: "file",
																		accept: "image/*",
																		capture: "environment",
																		className: "sr-only",
																		onChange: (event) => prepareEvidencePhoto(event.target.files?.[0])
																	})
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-[10px] font-semibold text-[#8295af]",
																children: [
																	"Add a photo of the ",
																	submittedTransaction.action === "RECEIVE" ? "received goods" : "affected stock",
																	" for the manager review."
																]
															})
														]
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "mt-2 rounded-xl border border-[#d5e1f0] bg-white p-3",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
															src: evidencePreview,
															alt: "Evidence photo preview",
															className: "mx-auto max-h-40 rounded-lg object-contain"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "mt-2 flex items-center justify-between gap-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "truncate text-[11px] font-bold text-[#49617f]",
																children: evidenceFile?.name
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center gap-2",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
																	type: "button",
																	onClick: () => {
																		setEvidencePreview(null);
																		setEvidenceFile(null);
																		setEvidenceMessage("");
																	},
																	className: "flex items-center gap-1 rounded-lg border border-[#efb5b5] bg-[#fff6f6] px-2.5 py-1.5 text-[10px] font-extrabold text-[#b83f3f]",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 12 }), " Remove"]
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																	type: "button",
																	onClick: () => void uploadEvidencePhoto(),
																	disabled: evidenceUploading,
																	className: "rounded-lg bg-[#155eef] px-3 py-1.5 text-[10px] font-extrabold text-white disabled:opacity-60",
																	children: evidenceUploading ? "Uploading…" : "Upload photo"
																})]
															})]
														})]
													}),
													evidenceMessage && !evidencePreview && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: `mt-2 text-[11px] font-semibold ${evidenceAttached ? "text-[#16865b]" : "text-[#a73737]"}`,
														children: evidenceMessage
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-end",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: resetVoice,
														className: "rounded-xl border border-[#d8e1ee] px-5 py-3 text-sm font-extrabold text-[#536b8b] hover:bg-[#f7f9fc]",
														children: "Start another update"
													}),
													submissionState !== "complete" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
														type: "button",
														onClick: () => {
															setExtraction(null);
															setClarificationState("idle");
															setClarificationHistory([]);
															setSubmissionState("idle");
															setSubmittedTransaction(null);
															setConfirmationOutcome(null);
															clientRequestIdRef.current = null;
															setVoiceState("review");
															setMessage("");
															window.speechSynthesis?.cancel();
														},
														className: "flex items-center justify-center gap-2 rounded-xl border border-[#b8cae2] px-5 py-3 text-sm font-extrabold text-[#24466f]",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCcw, { size: 16 }), "Correct details"]
													}),
													extraction?.readyForConfirmation && submissionState !== "complete" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
														type: "button",
														onClick: speakProposal,
														className: "flex items-center justify-center gap-2 rounded-xl border border-[#8db0ea] bg-[#f5f8ff] px-5 py-3 text-sm font-extrabold text-[#155eef]",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { size: 16 }), "Hear full details"]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
														type: "button",
														onClick: () => void confirmProposal(),
														disabled: submissionState === "creating" || submissionState === "confirming",
														className: "flex items-center justify-center gap-2 rounded-xl bg-[#16865b] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(22,134,91,0.22)] disabled:cursor-wait disabled:opacity-65",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { size: 17 }), submissionState === "creating" ? "Creating pending transaction…" : submissionState === "confirming" ? "Confirming safely…" : "Confirm inventory update"]
													})] })
												]
											})
										]
									}),
									message && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: `mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${voiceState === "extracted" && extraction?.readyForConfirmation ? "bg-[#eaf8f1] text-[#176f4e]" : "bg-[#fff5df] text-[#916018]"}`,
										children: message
									})
								] })
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-[24px] border border-[#e0e8f3] bg-white p-6 shadow-[0_14px_42px_rgba(16,45,82,0.055)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#7288a7]",
								children: "Quick actions"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-1 text-lg font-extrabold text-[#102a56]",
								children: "Choose what you did"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Boxes, {
								size: 21,
								className: "text-[#155eef]"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-5 grid grid-cols-2 gap-3",
							children: [
								[
									ArrowDownToLine,
									"Receive stock",
									"New stock came in",
									"bg-[#eaf8f1] text-[#16865b]"
								],
								[
									PackageMinus,
									"Ship stock",
									"Stock was dispatched",
									"bg-[#edf4ff] text-[#155eef]"
								],
								[
									ArrowRightLeft,
									"Move stock",
									"Moved to another shelf",
									"bg-[#f2efff] text-[#7257d6]"
								],
								[
									ClipboardCheck,
									"Count stock",
									"Counted what is on the shelf",
									"bg-[#fff5df] text-[#d47b08]"
								],
								[
									TriangleAlert,
									"Damage stock",
									"Report unusable stock",
									"bg-[#fff0f5] text-[#be185d]"
								]
							].map(([Icon, title, detail, tone], index) => {
								const workflow = [
									"RECEIVE",
									"SHIP",
									"TRANSFER",
									"CYCLE_COUNT",
									"DAMAGE"
								][index];
								const active = selectedWorkflow === workflow;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									"aria-pressed": active,
									onClick: () => chooseWorkflow(workflow),
									className: `rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${active ? "border-[#155eef] bg-[#f4f8ff] shadow-[0_8px_22px_rgba(21,94,239,0.12)]" : "border-[#e4eaf3] hover:border-[#b9cae2]"}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: `grid h-9 w-9 place-items-center rounded-xl ${tone}`,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 18 })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-3 text-sm font-extrabold text-[#203f69]",
											children: String(title)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-[11px] leading-4 text-[#8294ac]",
											children: String(detail)
										})
									]
								}, String(title));
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-5 rounded-2xl bg-[#0f376d] p-5 text-white",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
									size: 21,
									className: "mt-0.5 shrink-0 text-[#8eb8ff]"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-extrabold",
									children: "Warehouse Executive confirmation required"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs leading-5 text-[#bcd0e9]",
									children: "AI prepares the transaction. Inventory changes only after you confirm and business rules pass."
								})] })]
							})
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "worker-settings",
				className: "rounded-[24px] border border-[#dce6f3] bg-white p-5 shadow-[0_14px_42px_rgba(16,45,82,0.055)] sm:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 border-b border-[#e8eef6] pb-5 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#155eef]",
								children: "Warehouse Executive settings"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-1 text-xl font-extrabold text-[#102a56]",
								children: "Device and access checks"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-[#7489a6]",
								children: "Make sure voice tools are ready before starting warehouse work."
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								onNavigate("Overview");
								window.scrollTo({
									top: 0,
									behavior: "smooth"
								});
							},
							className: "inline-flex h-10 items-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-4 text-xs font-extrabold text-[#155eef]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
								size: 15,
								className: "rotate-90"
							}), " Back to Home"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 grid gap-4 md:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "rounded-[20px] border border-[#dfe8f4] bg-[#f8fbff] p-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-11 w-11 place-items-center rounded-2xl bg-[#e9f1ff] text-[#155eef]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { size: 21 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "mt-4 font-extrabold text-[#17345f]",
									children: "Microphone access"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 min-h-10 text-xs font-semibold leading-5 text-[#7186a3]",
									children: microphoneStatus
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => void checkMicrophoneAccess(),
									className: "mt-4 h-10 rounded-xl bg-[#155eef] px-4 text-xs font-extrabold text-white",
									children: "Check microphone"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "rounded-[20px] border border-[#dfe8f4] bg-[#f8fbff] p-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-11 w-11 place-items-center rounded-2xl bg-[#eaf8f1] text-[#16865b]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { size: 21 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "mt-4 font-extrabold text-[#17345f]",
									children: "Speaker guidance"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 min-h-10 text-xs font-semibold leading-5 text-[#7186a3]",
									children: speakerStatus || "Test spoken clarification guidance on this device."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: testSpeaker,
									className: "mt-4 h-10 rounded-xl bg-[#16865b] px-4 text-xs font-extrabold text-white",
									children: "Test speaker"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex flex-col gap-4 rounded-[20px] border border-[#dfe8f4] bg-white p-5 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-11 w-11 place-items-center rounded-2xl bg-[#f2efff] text-[#7257d6]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { size: 21 })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-extrabold text-[#17345f]",
								children: "Secure role access"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs font-semibold text-[#7186a3]",
								children: "Warehouse Executive · Central Warehouse · Role permissions active"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								onNavigate("Voice entry");
								window.scrollTo({
									top: 0,
									behavior: "smooth"
								});
							},
							className: "h-10 rounded-xl border border-[#b9cff0] bg-[#edf4ff] px-4 text-xs font-extrabold text-[#155eef]",
							children: "Open Voice Entry"
						})]
					})
				]
			}),
			newTaskAlert && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				role: "status",
				"aria-live": "polite",
				className: "mt-6 flex items-start justify-between gap-4 rounded-[20px] border border-[#b9d0f8] bg-gradient-to-r from-[#edf4ff] to-[#f7faff] p-4 shadow-[0_12px_30px_rgba(21,94,239,0.09)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#155eef] text-white",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellRing, { size: 19 })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-extrabold uppercase tracking-[0.13em] text-[#155eef]",
							children: "New assignment"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm font-extrabold text-[#17345f]",
							children: newTaskAlert
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs font-semibold text-[#7186a3]",
							children: "Open the task queue below to review and start the work."
						})
					] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setNewTaskAlert(""),
					"aria-label": "Dismiss new task alert",
					className: "rounded-lg p-2 text-[#6f84a3] transition hover:bg-white",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 17 })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "worker-task-queue",
				className: "mt-6 scroll-mt-24 rounded-[24px] border border-[#e0e8f3] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.05)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 border-b border-[#e9eef5] px-6 py-5 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#7257d6]",
								children: "My assigned work"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-1 text-lg font-extrabold text-[#102a56]",
								children: "Task queue"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-[#8294ac]",
								children: "Only assigned work and manager-requested recounts that you still need to perform."
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-2 rounded-full bg-[#eaf8f1] px-3 py-1 text-[10px] font-extrabold text-[#16865b]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 animate-pulse rounded-full bg-[#20ad76]" }),
										"Live updates",
										lastTaskRefresh ? ` · ${new Intl.DateTimeFormat("en", {
											hour: "2-digit",
											minute: "2-digit",
											second: "2-digit"
										}).format(lastTaskRefresh)}` : ""
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "w-fit rounded-full bg-[#f2efff] px-3 py-1 text-xs font-extrabold text-[#6349c1]",
									children: [
										workerTasks.length,
										" open · ",
										completedAssignedTasks.length,
										" done"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => {
										onNavigate("Overview");
										window.scrollTo({
											top: 0,
											behavior: "smooth"
										});
									},
									className: "inline-flex h-9 items-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-3 text-xs font-extrabold text-[#155eef]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
										size: 15,
										className: "rotate-90"
									}), " Back to Overview"]
								})
							]
						})]
					}),
					workerTasks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-3 px-6 py-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
							size: 21,
							className: "mt-0.5 shrink-0 text-[#16865b]"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-extrabold text-[#24466f]",
							children: "No open Warehouse Executive tasks"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs leading-5 text-[#8294ac]",
							children: "New recount requests and pending adjustments will appear here automatically."
						})] })]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "divide-y divide-[#edf1f6]",
						children: workerTasks.map((task) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: `grid h-10 w-10 shrink-0 place-items-center rounded-xl ${task.urgent ? "bg-[#fff1e3] text-[#c56c08]" : "bg-[#edf4ff] text-[#155eef]"}`,
										children: task.urgent ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCcw, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, { size: 18 })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-wrap items-center gap-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm font-extrabold text-[#24466f]",
													children: task.title
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "rounded-full bg-[#f2efff] px-2.5 py-1 text-[10px] font-extrabold text-[#6349c1]",
													children: taskTypeLabel(task.type)
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: `rounded-full px-2.5 py-1 text-[10px] font-extrabold ${task.urgent ? "bg-[#fff1e3] text-[#a45d0b]" : "bg-[#edf4ff] text-[#155eef]"}`,
													children: task.status === "IN_PROGRESS" ? "In progress" : task.urgent ? "Action required" : "Waiting for manager"
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs font-semibold text-[#6f84a1]",
											children: task.detail
										}),
										task.dueAt && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs font-extrabold text-[#d47b08]",
											children: formatTaskDue(task.dueAt)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs text-[#8a9bb1]",
											children: task.note
										})
									] })]
								}),
								task.automatic ? task.status === "OPEN" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									disabled: taskActionId === task.id,
									type: "button",
									onClick: () => void openTaskInVoice(task.id),
									className: "flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#155eef] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-60",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { size: 15 }), " Start with voice"]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									disabled: taskActionId === task.id,
									type: "button",
									onClick: () => void openTaskInVoice(task.id),
									className: "flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#16865b] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-60",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { size: 15 }), " Complete with voice"]
								}) : task.urgent ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => openRecountInVoice(task.id),
									className: "flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#d47b08] px-4 py-2.5 text-xs font-extrabold text-white",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { size: 15 }), " Start recount with voice"]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "shrink-0 rounded-xl border border-[#e3e9f2] bg-[#f7f9fc] px-4 py-2.5 text-[10px] font-extrabold text-[#7b8fa9]",
									children: "Manager review pending"
								}),
								task.type === "SHIP" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex shrink-0 flex-wrap items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										disabled: taskActionId === task.id,
										type: "button",
										onClick: () => void startAssignedTask(task.id),
										className: "rounded-xl border border-[#c9d8ee] bg-white px-3 py-2.5 text-xs font-extrabold text-[#155eef] disabled:opacity-60",
										children: "Start task"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										disabled: taskActionId === task.id,
										type: "button",
										onClick: () => void completeAssignedTask(task.id),
										className: "rounded-xl bg-[#16865b] px-3 py-2.5 text-xs font-extrabold text-white disabled:opacity-60",
										children: "Complete task"
									})]
								})
							]
						}, task.id))
					}),
					completedAssignedTasks.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-t border-[#edf1f6] bg-[#fafbfd] px-6 py-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#8597af]",
							children: "Recently completed by you"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3",
							children: completedAssignedTasks.slice(0, 6).map((task) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 rounded-xl border border-[#e3e9f2] bg-white px-3 py-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
									size: 16,
									className: "shrink-0 text-[#16865b]"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-xs font-extrabold text-[#29466f]",
										children: task.title
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-semibold text-[#8a9bb1]",
										children: taskTypeLabel(task.type)
									})]
								})]
							}, task.id))
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "worker-history",
				className: "mt-6 scroll-mt-24 rounded-[24px] border border-[#e0e8f3] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.05)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-4 border-b border-[#e9eef5] px-6 py-5 sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-extrabold text-[#102a56]",
						children: historyRange === "WEEK" ? "This week's activity" : "My complete transaction history"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-[#8294ac]",
						children: historySubtitle
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center rounded-xl border border-[#dce5f1] bg-[#f6f9fd] p-1",
								role: "group",
								"aria-label": "History time range",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-pressed": historyRange === "WEEK",
									onClick: () => setHistoryRange("WEEK"),
									className: `rounded-lg px-4 py-2 text-xs font-extrabold transition ${historyRange === "WEEK" ? "bg-white text-[#155eef] shadow-sm" : "text-[#7186a3] hover:text-[#29466f]"}`,
									children: "Last 7 days"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-pressed": historyRange === "ALL",
									onClick: () => setHistoryRange("ALL"),
									className: `rounded-lg px-4 py-2 text-xs font-extrabold transition ${historyRange === "ALL" ? "bg-white text-[#155eef] shadow-sm" : "text-[#7186a3] hover:text-[#29466f]"}`,
									children: "All time"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": historyView === "PENDING",
								onClick: () => setHistoryView("PENDING"),
								className: `rounded-xl px-4 py-2 text-xs font-extrabold ${historyView === "PENDING" ? "bg-[#fff1db] text-[#a46009] shadow-[0_8px_20px_rgba(164,96,9,0.12)]" : "border border-[#dce5f1] bg-white text-[#7186a3]"}`,
								children: "Pending"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": historyView === "COMPLETED",
								onClick: () => setHistoryView("COMPLETED"),
								className: `rounded-xl px-4 py-2 text-xs font-extrabold ${historyView === "COMPLETED" ? "bg-[#eaf8f1] text-[#16865b] shadow-[0_8px_20px_rgba(22,134,91,0.12)]" : "border border-[#dce5f1] bg-white text-[#7186a3]"}`,
								children: "Completed"
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "min-w-full text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "bg-[#f8fafc] text-[10px] uppercase tracking-[0.12em] text-[#8597af]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
								"Transaction",
								"Type",
								"Item",
								"Quantity",
								"Time",
								"Status"
							].map((heading) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "whitespace-nowrap px-6 py-3 font-extrabold",
								children: heading
							}, heading)) })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
							className: "divide-y divide-[#edf1f6] text-sm",
							children: [displayedTransactions.map((transaction) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap px-6 py-4 font-extrabold text-[#24466f]",
									children: transaction.id
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap px-6 py-4 font-semibold text-[#5f7594]",
									children: transaction.type
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap px-6 py-4 font-semibold text-[#29466f]",
									children: transaction.item
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: `whitespace-nowrap px-6 py-4 font-extrabold ${transaction.quantity.startsWith("+") ? "text-[#16865b]" : "text-[#496483]"}`,
									children: transaction.quantity
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap px-6 py-4 text-[#7f92aa]",
									children: transaction.time
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap px-6 py-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `rounded-full px-3 py-1 text-[11px] font-extrabold ${transaction.status === "Posted" || transaction.status === "Approved" ? "bg-[#eaf8f1] text-[#16865b]" : transaction.status === "Rejected" ? "bg-[#fff0f0] text-[#b83b3b]" : "bg-[#fff5df] text-[#a8670d]"}`,
										children: transaction.status
									})
								})
							] }, transaction.id)), displayedTransactions.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								colSpan: 6,
								className: "px-6 py-10 text-center text-sm font-semibold text-[#7f92aa]",
								children: [
									"No ",
									historyView === "PENDING" ? "pending" : "completed",
									" activity was found."
								]
							}) })]
						})]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "worker-active-items",
				className: "overflow-hidden rounded-[24px] border border-[#e0e8f3] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.05)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-4 border-b border-[#e9eef5] px-6 py-5 sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#16865b]",
							children: "Live inventory catalogue"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-1 text-lg font-extrabold text-[#102a56]",
							children: "Active items"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-[#8294ac]",
							children: "Current on-hand information across every warehouse location — read-only."
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-2 rounded-full bg-[#eaf8f1] px-3 py-1 text-[10px] font-extrabold text-[#16865b]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 animate-pulse rounded-full bg-[#20ad76]" }), "Live from PostgreSQL"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "w-fit rounded-full bg-[#f2efff] px-3 py-1 text-xs font-extrabold text-[#6349c1]",
								children: [snapshot?.products.length ?? 0, " active items"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									onNavigate("Overview");
									window.scrollTo({
										top: 0,
										behavior: "smooth"
									});
								},
								className: "inline-flex h-9 items-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-3 text-xs font-extrabold text-[#155eef]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
									size: 15,
									className: "rotate-90"
								}), " Back to Overview"]
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "min-w-full text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "bg-[#f8fafc] text-[10px] uppercase tracking-[0.12em] text-[#8597af]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
								"SKU (primary key)",
								"Product",
								"Unit",
								"Locations",
								"Available"
							].map((heading) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "whitespace-nowrap px-6 py-3 font-extrabold",
								children: heading
							}, heading)) })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
							className: "divide-y divide-[#edf1f6] text-sm",
							children: [
								(snapshot?.products ?? []).map((product) => {
									const productBalances = (snapshot?.balances ?? []).filter((balance) => balance.product.id === product.id);
									const available = productBalances.reduce((total, balance) => total + Math.max(0, balance.quantity - balance.reservedQuantity), 0);
									const locationCodes = productBalances.map((balance) => balance.location.code);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "hover:bg-[#f7faff]",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "whitespace-nowrap px-6 py-4",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "rounded-lg border border-[#cfe0f8] bg-[#f4f8ff] px-2.5 py-1 font-mono text-xs font-extrabold text-[#155eef]",
													children: product.sku
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "whitespace-nowrap px-6 py-4 font-extrabold text-[#24466f]",
												children: product.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "whitespace-nowrap px-6 py-4 text-[#647b99]",
												children: product.unit
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "whitespace-nowrap px-6 py-4",
												children: locationCodes.length > 0 ? locationCodes.map((code) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "mr-1.5 inline-block rounded-full bg-[#edf4ff] px-2.5 py-1 text-[10px] font-extrabold text-[#155eef]",
													children: code
												}, code)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[#9aabc1]",
													children: "No location"
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: `whitespace-nowrap px-6 py-4 text-lg font-black ${available > 0 ? "text-[#16865b]" : "text-[#a46009]"}`,
												children: available
											})
										]
									}, product.id);
								}),
								snapshot && snapshot.products.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									colSpan: 5,
									className: "px-6 py-10 text-center text-sm font-semibold text-[#7f92aa]",
									children: "No active items are in the catalogue yet."
								}) }),
								!snapshot && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									colSpan: 5,
									className: "px-6 py-10 text-center text-sm font-semibold text-[#7f92aa]",
									children: "Loading live inventory from the warehouse service…"
								}) })
							]
						})]
					})
				})]
			})
		]
	});
}
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var LoaderCircle = createLucideIcon("LoaderCircle", [["path", {
	d: "M21 12a9 9 0 1 1-6.219-8.56",
	key: "13zald"
}]]);
function useVoicePosition() {
	const [position, setPosition] = (0, import_react.useState)(() => {
		const saved = window.localStorage.getItem("inventory_worker_voice_position");
		if (saved) try {
			const parsed = JSON.parse(saved);
			if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) return {
				x: Math.min(Math.max(12, parsed.x), Math.max(12, window.innerWidth - 76)),
				y: Math.min(Math.max(88, parsed.y), Math.max(88, window.innerHeight - 82))
			};
		} catch {
			window.localStorage.removeItem("inventory_worker_voice_position");
		}
		return null;
	});
	const [dragging, setDragging] = (0, import_react.useState)(false);
	const drag = (0, import_react.useRef)(null);
	function clampPosition(x, y) {
		return {
			x: Math.min(Math.max(12, x), Math.max(12, window.innerWidth - 76)),
			y: Math.min(Math.max(88, y), Math.max(88, window.innerHeight - 82))
		};
	}
	(0, import_react.useEffect)(() => {
		const keepOnScreen = () => setPosition((current) => current ? clampPosition(current.x, current.y) : current);
		window.addEventListener("resize", keepOnScreen);
		return () => window.removeEventListener("resize", keepOnScreen);
	}, []);
	function beginDrag(x, y, pointerId, bounds) {
		drag.current = {
			pointerId,
			startX: x,
			startY: y,
			originX: bounds.left,
			originY: bounds.top,
			moved: false
		};
		setPosition({
			x: bounds.left,
			y: bounds.top
		});
		setDragging(true);
	}
	function moveDrag(x, y, pointerId) {
		if (!drag.current || drag.current.pointerId !== pointerId) return;
		const deltaX = x - drag.current.startX;
		const deltaY = y - drag.current.startY;
		if (Math.abs(deltaX) + Math.abs(deltaY) > 5) drag.current.moved = true;
		setPosition(clampPosition(drag.current.originX + deltaX, drag.current.originY + deltaY));
	}
	function finishDrag(pointerId) {
		if (!drag.current || drag.current.pointerId !== pointerId) return { wasMoved: false };
		const wasMoved = drag.current.moved;
		drag.current = null;
		setDragging(false);
		setPosition((current) => {
			if (current) window.localStorage.setItem("inventory_worker_voice_position", JSON.stringify(current));
			return current;
		});
		return { wasMoved };
	}
	function cancelDrag() {
		drag.current = null;
		setDragging(false);
	}
	return {
		position,
		dragging,
		beginDrag,
		moveDrag,
		finishDrag,
		cancelDrag,
		clampPosition,
		setPosition
	};
}
function FloatingVoiceAssistant({ active, onOpen, voiceState = "idle", submissionState = "idle" }) {
	const { position, dragging, beginDrag, moveDrag, finishDrag, cancelDrag } = useVoicePosition();
	const isProcessing = voiceState === "recording" || voiceState === "transcribing" || voiceState === "extracting";
	const isComplete = submissionState === "complete";
	const buttonClass = [
		"floating-voice-button",
		active ? "is-active" : "",
		dragging ? "is-dragging" : "",
		voiceState === "recording" ? "voice-button-recording" : "",
		isProcessing && voiceState !== "recording" ? "voice-button-processing" : "",
		isComplete ? "voice-button-success" : ""
	].filter(Boolean).join(" ");
	const getButtonIcon = () => {
		if (isComplete) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
			size: 24,
			strokeWidth: 2.4
		});
		if (isProcessing) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
			size: 24,
			strokeWidth: 2.4,
			className: "animate-spin"
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, {
			size: 25,
			strokeWidth: 2.4
		});
	};
	const getAccessibleLabel = () => {
		if (active) return "Voice entry is open. Drag this microphone to move it.";
		if (voiceState === "recording") return "Recording in progress.";
		if (voiceState === "transcribing") return "Converting speech to text.";
		if (voiceState === "extracting") return "AI is extracting inventory details.";
		if (submissionState === "complete") return "Voice update completed successfully.";
		return "Start inventory update by voice. Drag this microphone to move it.";
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "floating-voice-wrap fixed z-50",
		style: position ? {
			left: position.x,
			top: position.y
		} : {
			right: 24,
			bottom: 24
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "floating-voice-hint",
				"aria-hidden": "true",
				children: voiceState === "recording" ? "Recording…" : voiceState === "transcribing" ? "Transcribing…" : voiceState === "extracting" ? "AI processing…" : isComplete ? "Done!" : "Tap for voice"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				"aria-label": getAccessibleLabel(),
				"aria-pressed": active,
				title: voiceState === "recording" ? "Recording — tap to stop" : "Drag to move · Tap to open Voice Entry",
				onPointerDown: (event) => {
					const bounds = event.currentTarget.getBoundingClientRect();
					event.currentTarget.setPointerCapture(event.pointerId);
					beginDrag(event.clientX, event.clientY, event.pointerId, bounds);
				},
				onPointerMove: (event) => moveDrag(event.clientX, event.clientY, event.pointerId),
				onPointerUp: (event) => {
					const { wasMoved } = finishDrag(event.pointerId);
					if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
					if (!wasMoved) onOpen();
				},
				onPointerCancel: cancelDrag,
				onKeyDown: (event) => {
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault();
						onOpen();
					}
				},
				className: buttonClass,
				style: { touchAction: "none" },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "floating-voice-ripple",
						"aria-hidden": "true"
					}),
					getButtonIcon(),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "floating-drag-dots",
						"aria-hidden": "true",
						children: "•••"
					})
				]
			}),
			voiceState === "recording" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute -bottom-8 left-1/2 flex -translate-x-1/2 items-end gap-[2px]",
				"aria-hidden": "true",
				children: [
					1,
					2,
					3,
					4,
					5
				].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `wave-bar-${i} inline-block w-[2px] rounded-full bg-[#dc3232]`,
					style: {
						height: `${8 + i * 2}px`,
						opacity: .7
					}
				}, i))
			}),
			(voiceState === "transcribing" || voiceState === "extracting") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-extrabold uppercase tracking-wider text-[#155eef]",
				"aria-live": "polite",
				children: voiceState === "transcribing" ? "Converting…" : "Processing…"
			})
		]
	});
}
/**
* Subtle animated background mesh/gradient that adds depth without distraction.
* Uses CSS transforms for performance - no canvas or heavy rendering.
* Automatically pauses when the page is hidden.
*/
function AnimatedBackground() {
	const meshRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const mesh = meshRef.current;
		if (!mesh) return;
		let animationId;
		let startTime = Date.now();
		let isVisible = true;
		const animate = () => {
			if (!isVisible || !mesh) return;
			const elapsed = (Date.now() - startTime) / 1e3;
			const x = Math.sin(elapsed * .03) * 15;
			const y = Math.cos(elapsed * .025) * 10;
			const s = 1 + Math.sin(elapsed * .015) * .02;
			mesh.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
			animationId = requestAnimationFrame(animate);
		};
		const onVisibility = () => {
			isVisible = document.visibilityState === "visible";
			if (isVisible) {
				startTime = Date.now();
				animationId = requestAnimationFrame(animate);
			} else cancelAnimationFrame(animationId);
		};
		document.addEventListener("visibilitychange", onVisibility);
		animationId = requestAnimationFrame(animate);
		return () => {
			cancelAnimationFrame(animationId);
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "animated-mesh fixed inset-0 z-0 pointer-events-none overflow-hidden",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: meshRef,
				className: "absolute -right-[200px] -top-[100px] h-[600px] w-[600px] rounded-full opacity-[0.08]",
				style: {
					background: "radial-gradient(circle, rgba(70, 130, 255, 0.6), transparent 70%)",
					willChange: "transform"
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute -bottom-[150px] -left-[200px] h-[500px] w-[500px] rounded-full opacity-[0.06]",
				style: {
					background: "radial-gradient(circle, rgba(28, 184, 131, 0.5), transparent 70%)",
					animation: "mesh-move-2 12s ease-in-out infinite",
					willChange: "transform"
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 opacity-[0.03]",
				style: {
					backgroundImage: "radial-gradient(rgba(21, 94, 239, 0.5) 1px, transparent 1px)",
					backgroundSize: "32px 32px",
					maskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
					WebkitMaskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)"
				}
			})
		]
	});
}
function WorkerToolDock({ activePage, onNavigate, pendingTaskCount = 0 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		"aria-label": "Warehouse Executive tools",
		className: "worker-tool-dock fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 lg:hidden",
		children: [
			[
				LayoutDashboard,
				"Home",
				"Home"
			],
			[
				ClipboardCheck,
				"Task queue",
				"Tasks"
			],
			[
				FileClock,
				"History",
				"History"
			],
			[
				Settings,
				"Settings",
				"Settings"
			]
		].map(([Icon, target, label]) => {
			const active = activePage === target || target === "Home" && [
				"Overview",
				"My transactions",
				"Cycle counts",
				"Posted today"
			].includes(activePage);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => {
					onNavigate(target);
					window.scrollTo({
						top: 0,
						behavior: "smooth"
					});
				},
				"aria-current": active ? "page" : void 0,
				"aria-label": label,
				className: `worker-tool-button relative ${active ? "is-active" : ""}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
						size: 20,
						strokeWidth: active ? 2.5 : 2
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }),
					target === "Task queue" && pendingTaskCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-label": `${pendingTaskCount} pending tasks`,
						className: "absolute right-[22%] top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-[#e53935] px-1 text-[10px] font-black leading-none text-white shadow-[0_4px_10px_rgba(229,57,53,.35)]",
						children: pendingTaskCount > 99 ? "99+" : pendingTaskCount
					})
				]
			}, target);
		})
	});
}
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Download = createLucideIcon("Download", [
	["path", {
		d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
		key: "ih7n3h"
	}],
	["polyline", {
		points: "7 10 12 15 17 10",
		key: "2ggqvy"
	}],
	["line", {
		x1: "12",
		x2: "12",
		y1: "15",
		y2: "3",
		key: "1vk2je"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Eye = createLucideIcon("Eye", [["path", {
	d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
	key: "1nclc0"
}], ["circle", {
	cx: "12",
	cy: "12",
	r: "3",
	key: "1v7zrd"
}]]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Flag = createLucideIcon("Flag", [["path", {
	d: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z",
	key: "i9b6wo"
}], ["line", {
	x1: "4",
	x2: "4",
	y1: "22",
	y2: "15",
	key: "1cm3nv"
}]]);
function isStockAdjustment(transaction) {
	return transaction.referenceNumber?.startsWith("ADJUSTMENT-") === true || transaction.notes?.startsWith("Administrator correction") === true || transaction.action === "DAMAGE";
}
function statusTone$1(status) {
	if (status === "POSTED") return "bg-[#eaf8f1] text-[#16865b]";
	if (status === "REJECTED") return "bg-[#fff0f0] text-[#b83b3b]";
	if (status === "CANCELLED") return "bg-[#eef2f7] text-[#7b8fa9]";
	return "bg-[#fff5df] text-[#a8670d]";
}
function AdministratorAuditTransactions({ transactions, loading }) {
	const [query, setQuery] = (0, import_react.useState)("");
	const [action, setAction] = (0, import_react.useState)("ALL");
	const [status, setStatus] = (0, import_react.useState)("ALL");
	const [selected, setSelected] = (0, import_react.useState)(null);
	const visibleTransactions = (0, import_react.useMemo)(() => {
		const normalizedQuery = query.trim().toLowerCase();
		return transactions.filter((transaction) => {
			const searchable = [
				transaction.id,
				transaction.product.name,
				transaction.product.sku,
				transaction.referenceNumber,
				transaction.createdBy?.displayName,
				transaction.approvedBy?.displayName,
				transaction.sourceLocation?.name,
				transaction.destinationLocation?.name
			].filter(Boolean).join(" ").toLowerCase();
			return (action === "ALL" || transaction.action === action) && (status === "ALL" || transaction.status === status) && (!normalizedQuery || searchable.includes(normalizedQuery));
		});
	}, [
		action,
		query,
		status,
		transactions
	]);
	function exportCsv() {
		const escape = (value) => `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
		const rows = [[
			"Transaction ID",
			"Date",
			"Action",
			"Product",
			"SKU",
			"Quantity",
			"From",
			"To",
			"Status",
			"Created by",
			"Reviewed by",
			"Reference",
			"Notes",
			"Review notes",
			"Transcript"
		], ...visibleTransactions.map((transaction) => [
			transaction.id,
			transaction.createdAt,
			transaction.action,
			transaction.product.name,
			transaction.product.sku,
			transaction.quantity,
			transaction.sourceLocation?.name ?? "",
			transaction.destinationLocation?.name ?? "",
			transaction.status,
			transaction.createdBy?.displayName ?? "",
			transaction.approvedBy?.displayName ?? "",
			transaction.referenceNumber ?? "",
			transaction.notes ?? "",
			transaction.reviewNotes ?? "",
			transaction.transcript ?? ""
		])];
		const blob = new Blob([rows.map((row) => row.map(escape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `administrator-audit-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	}
	const adjustmentReason = selected?.reviewNotes?.trim() || (selected?.notes?.includes("Reason:") ? selected.notes.split("Reason:").slice(1).join("Reason:").trim() : "No reason recorded.");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "admin-audit-transactions",
		className: "overflow-hidden rounded-[24px] border border-[#d7e2f0] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.06)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4 border-b border-[#e9eef5] p-6 xl:flex-row xl:items-center xl:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]",
						children: "Administrator audit"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 text-xl font-extrabold text-[#102a56]",
						children: "Inventory transaction ledger"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-[#7489a6]",
						children: "Review every stock movement, correction, user, reference and audit note. This page is read-only."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex h-10 min-w-[220px] items-center gap-2 rounded-xl border border-[#d5e1f0] bg-white px-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
								size: 15,
								className: "text-[#8294ac]"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: query,
								onChange: (event) => setQuery(event.target.value),
								placeholder: "Search transaction, item or user",
								className: "min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#29466f] outline-none"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							"aria-label": "Filter administrator audit action",
							value: action,
							onChange: (event) => setAction(event.target.value),
							className: "h-10 rounded-xl border border-[#d5e1f0] bg-white px-3 text-xs font-bold text-[#496482]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "ALL",
								children: "All actions"
							}), [
								"RECEIVE",
								"SHIP",
								"TRANSFER",
								"CYCLE_COUNT",
								"DAMAGE"
							].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value,
								children: value.replaceAll("_", " ")
							}, value))]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							"aria-label": "Filter administrator audit status",
							value: status,
							onChange: (event) => setStatus(event.target.value),
							className: "h-10 rounded-xl border border-[#d5e1f0] bg-white px-3 text-xs font-bold text-[#496482]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "ALL",
								children: "All statuses"
							}), [
								"PENDING",
								"RECOUNT_REQUESTED",
								"APPROVED",
								"REJECTED",
								"POSTED",
								"CANCELLED"
							].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value,
								children: value.replaceAll("_", " ")
							}, value))]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: exportCsv,
							disabled: !visibleTransactions.length,
							className: "inline-flex h-10 items-center gap-2 rounded-xl bg-[#155eef] px-4 text-xs font-extrabold text-white disabled:opacity-50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 15 }), " Export CSV"]
						})
					]
				})]
			}),
			selected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `m-5 rounded-2xl border p-5 ${isStockAdjustment(selected) ? "border-[#efc36f] bg-[#fff9ec]" : "border-[#cfe0f7] bg-[#f7faff]"}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-base font-extrabold text-[#102a56]",
								children: "Complete transaction record"
							}), isStockAdjustment(selected) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1 rounded-full bg-[#f4a322] px-2.5 py-1 text-[10px] font-extrabold text-white",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, { size: 12 }), " Stock adjustment"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-[#6c829f]",
							children: ["TX-", selected.id.slice(0, 8).toUpperCase()]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setSelected(null),
							"aria-label": "Close administrator transaction details",
							className: "rounded-lg border border-[#d5e1f0] bg-white p-2 text-[#66809f] hover:text-[#155eef]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
						className: "mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
						children: [
							["Date and time", new Intl.DateTimeFormat("en", {
								dateStyle: "medium",
								timeStyle: "short"
							}).format(new Date(selected.createdAt))],
							["Action", selected.action.replaceAll("_", " ")],
							["Status", selected.status.replaceAll("_", " ")],
							["Item", `${selected.product.name} (${selected.product.sku})`],
							["Quantity", `${selected.quantity} ${selected.product.unit}`],
							["From", selected.sourceLocation?.name ?? "Not applicable"],
							["To", selected.destinationLocation?.name ?? "Not applicable"],
							["Reference", selected.referenceNumber ?? "Not provided"],
							["Created by", selected.createdBy?.displayName ?? "System"],
							["Reviewed by", selected.approvedBy?.displayName ?? "Not reviewed"],
							["Previous system quantity", selected.systemQuantityBefore ?? "Not recorded"],
							["Difference", selected.discrepancyDifference ?? "Not applicable"]
						].map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-white/80 bg-white/80 p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8294ac]",
								children: label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "mt-1 break-words text-xs font-bold text-[#24466f]",
								children: value
							})]
						}, String(label)))
					}),
					isStockAdjustment(selected) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 rounded-xl border border-[#efc36f] bg-white p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#a8670d]",
							children: "Adjustment reason"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm font-bold text-[#704a12]",
							children: adjustmentReason
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid gap-4 lg:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-[#e1e8f1] bg-white p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8294ac]",
								children: "Audit notes"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 whitespace-pre-wrap text-xs leading-5 text-[#496482]",
								children: selected.notes ?? "No audit notes recorded."
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-[#e1e8f1] bg-white p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8294ac]",
								children: "Voice transcript"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 whitespace-pre-wrap text-xs leading-5 text-[#496482]",
								children: selected.transcript ?? "No voice transcript attached."
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "min-w-full text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-[#f8fafc] text-[10px] uppercase tracking-[0.12em] text-[#8597af]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
							"Date",
							"Transaction",
							"Action",
							"Item",
							"Quantity",
							"Location",
							"Created by",
							"Status",
							"Details"
						].map((heading) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "whitespace-nowrap px-5 py-3 font-extrabold",
							children: heading
						}, heading)) })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
						className: "divide-y divide-[#edf1f6] text-xs",
						children: [
							visibleTransactions.map((transaction) => {
								const adjustment = isStockAdjustment(transaction);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									tabIndex: 0,
									role: "button",
									onClick: () => setSelected(transaction),
									onKeyDown: (event) => {
										if (event.key === "Enter" || event.key === " ") {
											event.preventDefault();
											setSelected(transaction);
										}
									},
									className: `cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#155eef] ${adjustment ? "bg-[#fff8e9] hover:bg-[#fff1d2]" : "hover:bg-[#f7faff]"}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: `whitespace-nowrap px-5 py-4 text-[#6c829f] ${adjustment ? "border-l-4 border-[#e49a20]" : ""}`,
											children: new Intl.DateTimeFormat("en", {
												day: "2-digit",
												month: "short",
												year: "numeric",
												hour: "2-digit",
												minute: "2-digit"
											}).format(new Date(transaction.createdAt))
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "whitespace-nowrap px-5 py-4 font-extrabold text-[#155eef]",
											children: ["TX-", transaction.id.slice(0, 8).toUpperCase()]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "whitespace-nowrap px-5 py-4 font-bold text-[#496482]",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-col items-start gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: transaction.action.replaceAll("_", " ") }), adjustment && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "inline-flex items-center gap-1 rounded-full bg-[#f4a322] px-2 py-0.5 text-[9px] font-extrabold text-white",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, { size: 10 }), " Adjusted stock"]
												})]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "whitespace-nowrap px-5 py-4 font-extrabold text-[#24466f]",
											children: transaction.product.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "whitespace-nowrap px-5 py-4 font-bold text-[#29466f]",
											children: [
												transaction.quantity,
												" ",
												transaction.product.unit
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "whitespace-nowrap px-5 py-4 text-[#6c829f]",
											children: transaction.sourceLocation?.name ?? transaction.destinationLocation?.name ?? "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "whitespace-nowrap px-5 py-4 text-[#496482]",
											children: transaction.createdBy?.displayName ?? "System"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "whitespace-nowrap px-5 py-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusTone$1(transaction.status)}`,
												children: transaction.status.replaceAll("_", " ")
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "whitespace-nowrap px-5 py-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "inline-flex items-center gap-1 font-extrabold text-[#155eef]",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 14 }), " View"]
											})
										})
									]
								}, transaction.id);
							}),
							!loading && !visibleTransactions.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 9,
								className: "px-6 py-12 text-center text-sm font-semibold text-[#7f92aa]",
								children: "No audit transactions match the selected filters."
							}) }),
							loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 9,
								className: "px-6 py-12 text-center text-sm font-semibold text-[#7f92aa]",
								children: "Loading audit transactions…"
							}) })
						]
					})]
				})
			})
		]
	});
}
function AdministratorDashboard({ managerMode = false, page = "Overview", onNavigate, displayName }) {
	const [snapshot, setSnapshot] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [clockNow, setClockNow] = (0, import_react.useState)(() => /* @__PURE__ */ new Date());
	const [editingProduct, setEditingProduct] = (0, import_react.useState)(null);
	const [showProductForm, setShowProductForm] = (0, import_react.useState)(false);
	const [productMessage, setProductMessage] = (0, import_react.useState)("");
	const [productError, setProductError] = (0, import_react.useState)(false);
	const [savingProduct, setSavingProduct] = (0, import_react.useState)(false);
	const [deletingProductId, setDeletingProductId] = (0, import_react.useState)(null);
	const [adjustingBalance, setAdjustingBalance] = (0, import_react.useState)(null);
	const [savingBalanceAdjustment, setSavingBalanceAdjustment] = (0, import_react.useState)(false);
	const [systemHealth, setSystemHealth] = (0, import_react.useState)(null);
	const [healthLoading, setHealthLoading] = (0, import_react.useState)(false);
	const [healthError, setHealthError] = (0, import_react.useState)("");
	const [systemUsers, setSystemUsers] = (0, import_react.useState)([]);
	const [showUserForm, setShowUserForm] = (0, import_react.useState)(false);
	const [userMessage, setUserMessage] = (0, import_react.useState)("");
	const [savingUser, setSavingUser] = (0, import_react.useState)(false);
	const [updatingUserId, setUpdatingUserId] = (0, import_react.useState)(null);
	const [editingSystemUser, setEditingSystemUser] = (0, import_react.useState)(null);
	const [resetPasswordUser, setResetPasswordUser] = (0, import_react.useState)(null);
	const [itemSearch, setItemSearch] = (0, import_react.useState)("");
	const [trackedItemId, setTrackedItemId] = (0, import_react.useState)(null);
	const [showLocationForm, setShowLocationForm] = (0, import_react.useState)(false);
	const [editingLocation, setEditingLocation] = (0, import_react.useState)(null);
	const [locationMessage, setLocationMessage] = (0, import_react.useState)("");
	const [locationError, setLocationError] = (0, import_react.useState)(false);
	const [savingLocation, setSavingLocation] = (0, import_react.useState)(false);
	const [deletingLocationId, setDeletingLocationId] = (0, import_react.useState)(null);
	const [selectedLocationDetails, setSelectedLocationDetails] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const timer = window.setInterval(() => setClockNow(/* @__PURE__ */ new Date()), 3e4);
		return () => window.clearInterval(timer);
	}, []);
	const load = async () => {
		setLoading(true);
		setError("");
		try {
			if (managerMode) setSnapshot(await fetchInventorySnapshot());
			else {
				const [health, users, inventory] = await Promise.allSettled([
					fetchDetailedSystemHealth(),
					fetchSystemUsers(),
					fetchInventorySnapshot()
				]);
				const failedSections = [];
				if (health.status === "fulfilled") {
					setSystemHealth(health.value);
					setHealthError("");
				} else {
					setSystemHealth(null);
					setHealthError("System health could not be loaded. Verify that the API is running, then refresh health.");
					failedSections.push("system health");
				}
				if (users.status === "fulfilled") setSystemUsers(users.value);
				else failedSections.push("user access");
				if (inventory.status === "fulfilled") setSnapshot(inventory.value);
				else failedSections.push("inventory");
				if (failedSections.length > 0) setError(`Some live sections are unavailable: ${failedSections.join(", ")}. Other available administration data is still shown.`);
			}
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : managerMode ? "Warehouse management data could not be loaded." : "Administrator access and system-health data could not be loaded.");
		} finally {
			setLoading(false);
		}
	};
	const refreshHealth = async () => {
		setHealthLoading(true);
		setHealthError("");
		try {
			setSystemHealth(await fetchDetailedSystemHealth());
		} catch (healthRefreshError) {
			setHealthError(healthRefreshError instanceof Error && healthRefreshError.message.toLowerCase().includes("unauthorized") ? "Your administrator session has expired. Sign in again to view system health." : "System health could not be refreshed. Verify that the API is running, then try again.");
		} finally {
			setHealthLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		const timer = setTimeout(() => void load(), 0);
		return () => clearTimeout(timer);
	}, []);
	(0, import_react.useEffect)(() => {
		const refreshTimer = window.setInterval(() => {
			fetchInventorySnapshot().then((inventory) => setSnapshot(inventory)).catch(() => void 0);
		}, 8e3);
		return () => window.clearInterval(refreshTimer);
	}, []);
	async function saveSystemUser(event) {
		event.preventDefault();
		setSavingUser(true);
		setUserMessage("");
		const form = event.currentTarget;
		const data = new FormData(form);
		try {
			const userInput = {
				employeeId: String(data.get("employeeId") ?? ""),
				displayName: String(data.get("displayName") ?? ""),
				email: String(data.get("email") ?? ""),
				role: String(data.get("role")),
				shift: String(data.get("shift") ?? ""),
				warehouseZone: String(data.get("warehouseZone") ?? "")
			};
			if (editingSystemUser) await updateSystemUser(editingSystemUser.id, userInput);
			else await createSystemUser({
				...userInput,
				temporaryPassword: String(data.get("temporaryPassword") ?? "")
			});
			setUserMessage(editingSystemUser ? "User details and role updated successfully." : "User created successfully.");
			form.reset();
			setShowUserForm(false);
			setEditingSystemUser(null);
			setSystemUsers(await fetchSystemUsers());
		} catch (saveError) {
			setUserMessage(saveError instanceof Error ? saveError.message : "User account could not be created.");
		} finally {
			setSavingUser(false);
		}
	}
	async function changeSystemUserStatus(user) {
		if (user.active && !window.confirm(`Deactivate ${user.displayName}? The user will be signed out and blocked immediately.`)) return;
		setUpdatingUserId(user.id);
		setUserMessage("");
		try {
			const updated = await updateSystemUserStatus(user.id, !user.active);
			setSystemUsers((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
			setUserMessage(updated.active ? `${updated.displayName} was activated and can sign in now.` : `${updated.displayName} was deactivated and signed out immediately.`);
		} catch (statusError) {
			setUserMessage(statusError instanceof Error ? statusError.message : "The account status could not be changed.");
		} finally {
			setUpdatingUserId(null);
		}
	}
	async function saveResetPassword(event) {
		event.preventDefault();
		if (!resetPasswordUser) return;
		setUpdatingUserId(resetPasswordUser.id);
		setUserMessage("");
		const form = event.currentTarget;
		const data = new FormData(form);
		try {
			await resetSystemUserPassword(resetPasswordUser.id, String(data.get("temporaryPassword") ?? ""));
			setUserMessage(`${resetPasswordUser.displayName}'s password was reset.`);
			form.reset();
			setResetPasswordUser(null);
		} catch (resetError) {
			setUserMessage(resetError instanceof Error ? resetError.message : "The temporary password could not be reset.");
		} finally {
			setUpdatingUserId(null);
		}
	}
	async function saveProduct(event) {
		event.preventDefault();
		setSavingProduct(true);
		setProductMessage("");
		setProductError(false);
		const data = new FormData(event.currentTarget);
		const sku = String(data.get("sku") ?? "").trim().toUpperCase();
		const input = {
			sku,
			name: String(data.get("name") ?? "").trim(),
			unit: String(data.get("unit") ?? "unit").trim() || "unit",
			safetyStock: Number(data.get("safetyStock")),
			reorderQuantity: Number(data.get("reorderQuantity"))
		};
		if ((snapshot?.products ?? []).some((product) => product.sku.trim().toUpperCase() === sku && product.id !== editingProduct?.id)) {
			setProductError(true);
			setProductMessage(`A product with SKU "${sku}" already exists. Choose a different SKU.`);
			setSavingProduct(false);
			return;
		}
		try {
			if (editingProduct) await updateInventoryProduct(editingProduct.id, input);
			else await createInventoryProduct(input);
			setProductMessage(editingProduct ? "Product and rules updated successfully." : "Product added successfully.");
			setEditingProduct(null);
			setShowProductForm(false);
			await load();
		} catch (error) {
			setProductError(true);
			setProductMessage(error instanceof Error ? error.message : "Product could not be saved.");
		} finally {
			setSavingProduct(false);
		}
	}
	async function handleDeleteProduct(product) {
		const stockedBalances = (snapshot?.balances ?? []).filter((balance) => balance.product.id === product.id && balance.quantity > 0);
		if (stockedBalances.length > 0 && managerMode) {
			setProductError(true);
			setProductMessage(`"${product.name}" still has stock on hand and cannot be deleted.`);
			return;
		}
		const confirmationMessage = stockedBalances.length > 0 ? `Administrator override: archive "${product.name}" (${product.sku}) even though it still has stock? The item will disappear from active inventory, while its stock records and audit history are preserved.` : `Delete "${product.name}" (${product.sku}) from the product list?`;
		if (!window.confirm(confirmationMessage)) return;
		setDeletingProductId(product.id);
		setProductMessage("");
		setProductError(false);
		try {
			await deleteInventoryProduct(product.id, stockedBalances.length > 0 && !managerMode);
			setProductMessage(stockedBalances.length > 0 ? `Product ${product.sku} archived using Administrator permission. Stock records and audit history were preserved.` : `Product ${product.sku} deleted.`);
			await load();
		} catch (error) {
			setProductError(true);
			setProductMessage(error instanceof Error ? error.message : "Product could not be deleted.");
		} finally {
			setDeletingProductId(null);
		}
	}
	async function saveBalanceAdjustment(event) {
		event.preventDefault();
		if (!adjustingBalance || managerMode) return;
		setSavingBalanceAdjustment(true);
		setProductMessage("");
		setProductError(false);
		const data = new FormData(event.currentTarget);
		try {
			await adjustInventoryBalance({
				balanceId: adjustingBalance.id,
				quantity: Number(data.get("quantity")),
				reason: String(data.get("reason") ?? "").trim()
			});
			setProductMessage(`${adjustingBalance.product.name} stock updated. Available quantity and status were recalculated automatically.`);
			setAdjustingBalance(null);
			await load();
		} catch (adjustError) {
			setProductError(true);
			setProductMessage(adjustError instanceof Error ? adjustError.message : "Stock quantity could not be adjusted.");
		} finally {
			setSavingBalanceAdjustment(false);
		}
	}
	async function saveLocation(event) {
		event.preventDefault();
		setSavingLocation(true);
		setLocationMessage("");
		setLocationError(false);
		const form = event.currentTarget;
		const data = new FormData(form);
		const input = {
			code: String(data.get("code") ?? "").trim().toUpperCase(),
			name: String(data.get("name") ?? "").trim(),
			description: String(data.get("description") ?? "").trim(),
			active: editingLocation?.active ?? true
		};
		if ((snapshot?.locations ?? []).some((location) => location.code.trim().toUpperCase() === input.code && location.id !== editingLocation?.id)) {
			setLocationError(true);
			setLocationMessage(`Location code "${input.code}" already exists.`);
			setSavingLocation(false);
			return;
		}
		try {
			if (editingLocation) await updateLocation(editingLocation.id, input);
			else await createLocation(input);
			setLocationMessage(editingLocation ? "Location updated successfully." : "Location added successfully.");
			form.reset();
			setEditingLocation(null);
			setShowLocationForm(false);
			await load();
		} catch (saveError) {
			setLocationError(true);
			setLocationMessage(saveError instanceof Error ? saveError.message : "Location could not be saved.");
		} finally {
			setSavingLocation(false);
		}
	}
	async function handleDeleteLocation(location) {
		if ((snapshot?.balances ?? []).filter((balance) => balance.location.id === location.id).some((balance) => balance.quantity > 0)) {
			setLocationError(true);
			setLocationMessage(`"${location.name}" contains stock and cannot be deleted. Move the stock first.`);
			return;
		}
		if (!window.confirm(`Delete location "${location.name}" (${location.code})?`)) return;
		setDeletingLocationId(location.id);
		setLocationMessage("");
		setLocationError(false);
		try {
			await deleteLocation(location.id);
			setLocationMessage(`Location ${location.code} deleted.`);
			await load();
		} catch (deleteError) {
			setLocationError(true);
			setLocationMessage(deleteError instanceof Error ? deleteError.message : "Location could not be deleted.");
		} finally {
			setDeletingLocationId(null);
		}
	}
	const nextSku = (0, import_react.useMemo)(() => {
		let highest = 99;
		for (const product of snapshot?.products ?? []) {
			const match = /^ITEM-(\d+)$/i.exec(product.sku.trim());
			if (match) highest = Math.max(highest, Number(match[1]));
		}
		return `ITEM-${String(highest + 1).padStart(3, "0")}`;
	}, [snapshot]);
	const filteredItems = (snapshot?.products ?? []).filter((product) => `${product.sku} ${product.name}`.toLowerCase().includes(itemSearch.trim().toLowerCase()));
	const trackedItem = snapshot?.products.find((product) => product.id === trackedItemId) ?? null;
	const trackedBalances = trackedItem ? (snapshot?.balances ?? []).filter((balance) => balance.product.id === trackedItem.id) : [];
	const trackedTransactions = trackedItem ? (snapshot?.transactions ?? []).filter((transaction) => transaction.product.id === trackedItem.id).slice(0, 8) : [];
	const selectedLocationBalances = selectedLocationDetails ? (snapshot?.balances ?? []).filter((balance) => balance.location.id === selectedLocationDetails.id && balance.quantity > 0) : [];
	const totalAvailableStock = (snapshot?.balances ?? []).reduce((total, balance) => total + Math.max(0, balance.quantity), 0);
	const lowItemCount = (snapshot?.products ?? []).filter((product) => {
		return (snapshot?.balances ?? []).filter((balance) => balance.product.id === product.id).reduce((total, balance) => total + Math.max(0, balance.quantity), 0) < product.safetyStock;
	}).length;
	const adminName = displayName || "Administrator";
	const adminGreeting = (() => {
		const hour = clockNow.getHours();
		if (hour < 12) return "Good morning";
		if (hour < 17) return "Good afternoon";
		return "Good evening";
	})();
	const healthItems = systemHealth ? systemHealth.services.map((service) => ({
		key: service.key,
		label: service.name,
		status: service.status,
		detail: service.detail
	})) : [];
	const healthTone = (status) => {
		if (status === "degraded") return {
			pulse: "warning",
			card: "border-[#f0ce8e] bg-[#fffaf0]",
			badge: "bg-[#fff4df] text-[#b36d0c]",
			label: "Degraded"
		};
		if (status === "unavailable") return {
			pulse: "offline",
			card: "border-[#efb5b5] bg-[#fff4f4]",
			badge: "bg-[#ffe8e8] text-[#c43f3f]",
			label: "Offline"
		};
		return {
			pulse: "online",
			card: "border-[#cfe0c0] bg-[#f5fcf7]",
			badge: "bg-[#eaf8f1] text-[#16865b]",
			label: "Online"
		};
	};
	const lastCheckedLabel = systemHealth ? new Intl.DateTimeFormat("en", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	}).format(new Date(systemHealth.checkedAt)) : null;
	const metrics = [
		[
			UsersRound,
			"Application users",
			String(systemUsers.length),
			"Authenticated users",
			"User access"
		],
		[
			Boxes,
			"Active items",
			String(snapshot?.products.length ?? 0),
			"Products in catalogue",
			"Items"
		],
		[
			PackageCheck,
			"Available stock",
			String(totalAvailableStock),
			"Current on-hand quantity",
			"Items"
		],
		[
			TriangleAlert,
			"Items below safety",
			String(lowItemCount),
			"Replenishment attention",
			"Items"
		],
		[
			Activity,
			"System health",
			systemHealth?.status === "healthy" ? "Healthy" : "Review",
			"Service availability",
			"System health"
		],
		[
			ClipboardCheck,
			"Audit records",
			String(snapshot?.transactions.length ?? 0),
			"Recorded stock actions",
			"Audit transactions"
		]
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		id: managerMode ? "manager-warehouse-controls" : "admin-overview",
		className: "dashboard-content page-dashboard administrator-dashboard space-y-6",
		"data-active-page": page,
		children: [
			!managerMode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					id: "admin-overview-hero",
					className: "hero-3d relative overflow-hidden rounded-[26px] border border-[#d9e6f8] p-6 text-white sm:p-7",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#c4d8ff] backdrop-blur",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 13 }), new Intl.DateTimeFormat("en", {
										weekday: "long",
										day: "numeric",
										month: "long",
										year: "numeric"
									}).format(clockNow)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
									className: "mt-3 text-[24px] font-extrabold tracking-[-0.03em] sm:text-[30px]",
									children: [
										adminGreeting,
										", ",
										adminName
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1.5 max-w-2xl text-sm font-semibold leading-6 text-[#c6d7f6]",
									children: [
										"Manage the item catalogue, user access and system health —",
										" ",
										lowItemCount,
										" item",
										lowItemCount === 1 ? "" : "s",
										" need attention and ",
										systemUsers.length,
										" user",
										systemUsers.length === 1 ? "" : "s",
										" have secure access."
									]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-row items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "warehouse-hero-frame hidden h-28 w-44 shrink-0 sm:block",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WarehouseHero, {
									variant: "admin",
									className: "w-full h-full"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => void load(),
								className: "inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-[#155eef] shadow-[0_10px_24px_rgba(21,94,239,0.25)] transition hover:scale-[1.03]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCcw, {
										size: 16,
										className: loading ? "animate-spin" : ""
									}),
									" ",
									"Refresh"
								]
							})]
						})]
					})
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					id: "admin-load-error",
					className: "rounded-2xl border border-[#efb5b5] bg-[#fff4f4] p-4 text-sm font-semibold text-[#a73737]",
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdministratorAuditTransactions, {
					transactions: snapshot?.transactions ?? [],
					loading
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					id: "admin-overview-metrics",
					className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 stagger",
					children: metrics.map(([Icon, label, value, detail, targetPage]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							onNavigate?.(targetPage);
							window.scrollTo({
								top: 0,
								behavior: "smooth"
							});
						},
						className: "card-3d rounded-[20px] bg-white p-5 text-left",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-extrabold uppercase tracking-[0.12em] text-[#8295af]",
									children: label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
									size: 19,
									className: "text-[#155eef]"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 text-3xl font-extrabold text-[#102a56]",
								children: loading ? "—" : value
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs font-semibold text-[#7b8fa9]",
								children: detail
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-3 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#155eef]",
								children: "View details →"
							})
						]
					}, label))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					id: "admin-overview-command",
					className: "admin-command-center grid gap-5 xl:grid-cols-[1.35fr_0.65fr]",
					children: [healthItems.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "admin-health-panel card-3d rounded-[24px] bg-white p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]",
									children: "Service Health"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-1 text-lg font-extrabold text-[#102a56]",
									children: "Live system monitoring"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-[#8294ac]",
									children: "All services with live status indicators and response times."
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
							children: healthItems.map((item) => {
								const tone = healthTone(item.status);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `rounded-2xl border p-4 ${tone.card}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPulse, { status: tone.pulse }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-extrabold text-[#17345f]",
													children: item.label
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: `ml-auto rounded-full px-2 py-0.5 text-[9px] font-extrabold ${tone.badge}`,
													children: tone.label
												})
											]
										}),
										item.detail && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-xs font-semibold text-[#7b8fa9]",
											children: item.detail
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8295af]",
											children: ["Last checked · ", lastCheckedLabel ?? "—"]
										})
									]
								}, item.key ?? item.label);
							})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "admin-tool-panel card-3d rounded-[24px] bg-white p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#155eef]",
								children: "Quick toolbar"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-lg font-extrabold text-[#102a56]",
								children: "Jump to any tool"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-6",
							children: [
								[
									"Items",
									"Items",
									Boxes,
									"from-[#155eef] to-[#4a7df0]"
								],
								[
									"User access",
									"User access",
									UsersRound,
									"from-[#d47b08] to-[#f0a13a]"
								],
								[
									"System health",
									"System health",
									Activity,
									"from-[#16865b] to-[#2fa97c]"
								],
								[
									"Add item",
									"Add item",
									PackageCheck,
									"from-[#16865b] to-[#22aa78]"
								],
								[
									"Add user",
									"Add user",
									UserRound,
									"from-[#7257d6] to-[#9678f2]"
								],
								[
									"Refresh data",
									"Refresh",
									RefreshCcw,
									"from-[#455b78] to-[#6e86a5]"
								]
							].map(([action, label, ToolIcon, tone]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									if (action === "Add item") {
										onNavigate?.("Items");
										setEditingProduct(null);
										setShowProductForm(true);
										setProductMessage("");
										setProductError(false);
										window.scrollTo({
											top: 0,
											behavior: "smooth"
										});
										return;
									}
									if (action === "Add user") {
										onNavigate?.("User access");
										setEditingSystemUser(null);
										setShowUserForm(true);
										setUserMessage("");
										return;
									}
									if (action === "Refresh data") {
										load();
										return;
									}
									onNavigate?.(action);
									window.scrollTo({
										top: 0,
										behavior: "smooth"
									});
								},
								className: "group relative flex min-h-[88px] flex-col items-start justify-between rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-3 text-left transition hover:-translate-y-1 hover:border-[#b9cff0] hover:bg-white hover:shadow-[0_12px_28px_rgba(16,45,82,0.1)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-[0_8px_18px_rgba(21,94,239,0.22)] transition group-hover:scale-110`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolIcon, { size: 18 })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-2 text-xs font-extrabold text-[#24466f]",
									children: label
								})]
							}, action))
						})]
					})]
				})
			] }),
			managerMode && error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				id: "admin-load-error",
				className: "rounded-2xl border border-[#efb5b5] bg-[#fff4f4] p-4 text-sm font-semibold text-[#a73737]",
				children: error
			}),
			(!managerMode || page === "Catalog") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: managerMode ? "admin-warehouse-setup" : "admin-items",
				className: "card-3d scroll-mt-28 rounded-[24px] bg-white",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-5 border-b border-[#e8eef6] p-6 lg:flex-row lg:items-center lg:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]",
								children: "Item master"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-1 text-xl font-extrabold text-[#102a56]",
								children: "Items and stock control"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-[#7489a6]",
								children: "Track items, check availability, edit inventory rules."
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2 sm:flex-row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex h-11 items-center gap-2 rounded-xl border border-[#d5e1f0] bg-[#f8fafc] px-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
									size: 16,
									className: "text-[#8295af]"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: itemSearch,
									onChange: (event) => setItemSearch(event.target.value),
									placeholder: "Search item or SKU",
									"aria-label": "Search items",
									className: "w-56 bg-transparent text-xs font-semibold outline-none"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setEditingProduct(null);
									setShowProductForm(true);
									setProductMessage("");
									setProductError(false);
								},
								className: "h-11 rounded-xl bg-[#155eef] px-4 text-sm font-extrabold text-white",
								children: "+ Add item"
							})]
						})]
					}),
					productMessage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						role: "status",
						className: `mx-6 mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${productError ? "border-[#ffd1d1] bg-[#fff2f2] text-[#a73737]" : "border-[#cfe0f8] bg-[#eef6ff] text-[#244f86]"}`,
						children: productMessage
					}),
					showProductForm && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: saveProduct,
						className: "mx-6 mt-5 grid gap-4 rounded-2xl border border-[#cbdcf5] bg-[#f7faff] p-5 sm:grid-cols-2 xl:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sm:col-span-2 xl:col-span-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-extrabold text-[#17345f]",
									children: editingProduct ? `Edit ${editingProduct.name}` : "Add a new item"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-[#7b8fa9]",
									children: "Item details and reorder settings."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["SKU", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "sku",
									required: true,
									defaultValue: editingProduct?.sku ?? nextSku,
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["Name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "name",
									required: true,
									defaultValue: editingProduct?.name ?? "",
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["Unit", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "unit",
									required: true,
									defaultValue: editingProduct?.unit ?? "unit",
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["Safety stock", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "safetyStock",
									type: "number",
									min: "0",
									required: true,
									defaultValue: editingProduct?.safetyStock ?? 10,
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["Reorder qty", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "reorderQuantity",
									type: "number",
									min: "0",
									required: true,
									defaultValue: editingProduct?.reorderQuantity ?? 20,
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-end gap-2 sm:col-span-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									disabled: savingProduct,
									className: "h-11 rounded-xl bg-[#155eef] px-5 text-sm font-extrabold text-white disabled:opacity-60",
									children: savingProduct ? "Saving..." : editingProduct ? "Save changes" : "Add item"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										setShowProductForm(false);
										setEditingProduct(null);
									},
									className: "h-11 rounded-xl border border-[#d5e1f0] bg-white px-4 text-sm font-bold text-[#617796]",
									children: "Cancel"
								})]
							})
						]
					}, editingProduct?.id ?? "new-admin-item"),
					!managerMode && adjustingBalance && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: saveBalanceAdjustment,
						className: "mx-6 mt-5 grid gap-4 rounded-2xl border border-[#f1c978] bg-[#fffaf0] p-5 sm:grid-cols-2 xl:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sm:col-span-2 xl:col-span-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#b36d0c]",
										children: "Administrator-only adjustment"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
										className: "mt-1 text-lg font-extrabold text-[#17345f]",
										children: [
											"Adjust ",
											adjustingBalance.product.name,
											" stock"
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-xs text-[#7b8fa9]",
										children: "Available quantity and status are calculated automatically after saving."
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["Location", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									value: adjustingBalance.id,
									onChange: (event) => {
										const selected = (snapshot?.balances ?? []).find((balance) => balance.id === event.target.value);
										if (selected) setAdjustingBalance(selected);
									},
									className: "mt-2 h-11 w-full rounded-xl border border-[#dfc589] bg-white px-3 text-sm font-semibold",
									children: (snapshot?.balances ?? []).filter((balance) => balance.product.id === adjustingBalance.product.id).map((balance) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: balance.id,
										children: balance.location.name
									}, balance.id))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["On-hand quantity", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "quantity",
									type: "number",
									min: "0",
									step: "1",
									required: true,
									defaultValue: adjustingBalance.quantity,
									className: "mt-2 h-11 w-full rounded-xl border border-[#dfc589] bg-white px-3 text-sm font-semibold"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["Adjustment reason", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "reason",
									required: true,
									minLength: 5,
									maxLength: 500,
									placeholder: "Example: Physical recount correction",
									className: "mt-2 h-11 w-full rounded-xl border border-[#dfc589] bg-white px-3 text-sm font-semibold"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2 sm:col-span-2 xl:col-span-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									disabled: savingBalanceAdjustment,
									className: "h-11 rounded-xl bg-[#b36d0c] px-5 text-sm font-extrabold text-white disabled:opacity-60",
									children: savingBalanceAdjustment ? "Saving adjustment..." : "Save stock adjustment"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setAdjustingBalance(null),
									className: "h-11 rounded-xl border border-[#dfc589] bg-white px-4 text-sm font-bold text-[#617796]",
									children: "Cancel"
								})]
							})
						]
					}, adjustingBalance.id),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "overflow-x-auto p-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "min-w-full text-left text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
								className: "border-b border-[#e5ebf4] text-[10px] uppercase tracking-[0.12em] text-[#8295af]",
								children: [
									"SKU",
									"Item",
									"Locations",
									"On hand",
									"Available",
									"Safety",
									"Status",
									"Actions"
								].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "whitespace-nowrap px-4 py-3.5 font-extrabold",
									children: h
								}, h))
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: filteredItems.map((product) => {
								const balances = (snapshot?.balances ?? []).filter((b) => b.product.id === product.id);
								const onHand = balances.reduce((t, b) => t + b.quantity, 0);
								const available = Math.max(0, onHand);
								const status = available <= 0 ? "Out of stock" : available < product.safetyStock ? "Low stock" : "Available";
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: `border-b border-[#eef2f7] last:border-0 ${trackedItemId === product.id ? "bg-[#f5f9ff]" : ""}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-4 py-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "inline-flex items-center gap-1.5 rounded-lg border border-[#cfe0f8] bg-[#f4f8ff] px-2.5 py-1.5 font-mono text-[11px] font-extrabold text-[#155eef]",
												children: product.sku
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-4 py-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-extrabold text-[#17345f]",
												children: product.name
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-4 py-4 font-bold text-[#496482]",
											children: balances.length
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-4 py-4 font-extrabold text-[#17345f]",
											children: onHand
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-4 py-4 text-lg font-black text-[#16865b]",
											children: available
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-4 py-4 font-bold text-[#496482]",
											children: product.safetyStock
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-4 py-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `rounded-full px-3 py-1 text-[10px] font-extrabold ${status === "Available" ? "bg-[#eaf8f1] text-[#16865b]" : status === "Low stock" ? "bg-[#fff4df] text-[#b36d0c]" : "bg-[#ffe8e8] text-[#c43f3f]"}`,
												children: status
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-4 py-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-wrap gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: () => setTrackedItemId(product.id),
														className: "rounded-lg border border-[#b9d0f8] px-3 py-2 text-xs font-extrabold text-[#155eef]",
														children: "Track"
													}),
													!managerMode && balances.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: () => {
															setAdjustingBalance(balances[0]);
															setProductMessage("");
															setProductError(false);
															window.scrollTo({
																top: 0,
																behavior: "smooth"
															});
														},
														className: "rounded-lg border border-[#dfc589] bg-[#fffaf0] px-3 py-2 text-xs font-extrabold text-[#9a5d08]",
														children: "Adjust stock"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: () => {
															setEditingProduct(product);
															setShowProductForm(true);
															setProductMessage("");
															setProductError(false);
														},
														className: "rounded-lg border border-[#c9d8ee] px-3 py-2 text-xs font-extrabold text-[#496482]",
														children: "Edit"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														disabled: deletingProductId === product.id,
														onClick: () => void handleDeleteProduct(product),
														className: "rounded-lg border border-[#efb5b5] px-3 py-2 text-xs font-extrabold text-[#b83f3f] disabled:opacity-50",
														children: deletingProductId === product.id ? "Deleting..." : "Delete"
													})
												]
											})
										})
									]
								}, product.id);
							}) })]
						}), !filteredItems.length && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "py-12 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Boxes, {
								size: 28,
								className: "mx-auto text-[#9aabc1]"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm font-extrabold text-[#496482]",
								children: "No items match your search"
							})]
						})]
					}),
					trackedItem && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-t border-[#e8eef6] bg-[#f8fbff] p-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]",
									children: "Item tracking"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
									className: "mt-1 text-lg font-extrabold text-[#102a56]",
									children: [trackedItem.name, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-sm text-[#8295af]",
										children: [
											" ",
											"(",
											trackedItem.sku,
											")"
										]
									})]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setTrackedItemId(null),
									className: "rounded-lg border border-[#d5e1f0] bg-white px-3 py-2 text-xs font-bold text-[#617796]",
									children: "Close"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
								children: [trackedBalances.map((balance) => {
									const available = Math.max(0, balance.quantity);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
										className: "rounded-2xl border border-[#dce6f3] bg-white p-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-extrabold text-[#17345f]",
													children: balance.location.code
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Warehouse, {
													size: 17,
													className: "text-[#155eef]"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-3 text-2xl font-black text-[#16865b]",
												children: available
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] font-bold uppercase tracking-wider text-[#8295af]",
												children: "Available"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mt-3 flex justify-between text-xs font-semibold text-[#647b99]",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["On hand ", balance.quantity] })
											})
										]
									}, balance.id);
								}), !trackedBalances.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
									className: "rounded-2xl border border-dashed border-[#cbd8e8] bg-white p-5 text-sm font-semibold text-[#7b8fa9]",
									children: "No location assignments found."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-5 overflow-x-auto rounded-2xl border border-[#dce6f3] bg-white",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
									className: "min-w-full text-left text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
										className: "border-b border-[#e8eef6] bg-[#f7f9fc] text-[10px] uppercase tracking-wider text-[#8295af]",
										children: [
											"Date",
											"Action",
											"Qty",
											"Location",
											"Status"
										].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "whitespace-nowrap px-4 py-3",
											children: h
										}, h))
									}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [trackedTransactions.map((tx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-b border-[#eef2f7] last:border-0",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "whitespace-nowrap px-4 py-3 text-[#7186a3]",
												children: new Intl.DateTimeFormat("en", {
													day: "2-digit",
													month: "short",
													hour: "2-digit",
													minute: "2-digit"
												}).format(new Date(tx.createdAt))
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-4 py-3 font-extrabold text-[#496482]",
												children: tx.action.replaceAll("_", " ")
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-4 py-3 font-bold text-[#17345f]",
												children: tx.quantity
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-4 py-3 text-[#647b99]",
												children: tx.sourceLocation?.code ?? tx.destinationLocation?.code ?? "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-4 py-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "rounded-full bg-[#eaf8f1] px-2.5 py-1 text-[10px] font-extrabold text-[#16865b]",
													children: tx.status.replaceAll("_", " ")
												})
											})
										]
									}, tx.id)), !trackedTransactions.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										colSpan: 5,
										className: "px-5 py-8 text-center text-sm font-semibold text-[#7b8fa9]",
										children: "No transactions recorded."
									}) })] })]
								})
							})
						]
					})
				]
			}),
			managerMode && page === "Locations" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "admin-locations",
				className: "card-3d scroll-mt-28 rounded-[24px] bg-white",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 border-b border-[#e8eef6] p-6 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]",
								children: "Warehouse master"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-1 text-xl font-extrabold text-[#102a56]",
								children: "Locations"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-[#7489a6]",
								children: "View every active storage area and the stock currently assigned to it."
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => void load(),
								className: "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-4 text-sm font-extrabold text-[#155eef]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCcw, {
									size: 16,
									className: loading ? "animate-spin" : ""
								}), "Refresh"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setEditingLocation(null);
									setShowLocationForm(true);
									setLocationMessage("");
									setLocationError(false);
								},
								className: "h-11 rounded-xl bg-[#155eef] px-4 text-sm font-extrabold text-white",
								children: "+ Add location"
							})]
						})]
					}),
					locationMessage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						role: "status",
						className: `mx-6 mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${locationError ? "border-[#ffd1d1] bg-[#fff2f2] text-[#a73737]" : "border-[#cfe0f8] bg-[#eef6ff] text-[#244f86]"}`,
						children: locationMessage
					}),
					showLocationForm && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: saveLocation,
						className: "mx-6 mt-5 grid gap-4 rounded-2xl border border-[#cbdcf5] bg-[#f7faff] p-5 md:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "md:col-span-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-extrabold text-[#17345f]",
									children: editingLocation ? "Edit location" : "Add location"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-[#7b8fa9]",
									children: "Use a short code and a simple, voice-friendly location name."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["Location code", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "code",
									required: true,
									maxLength: 30,
									defaultValue: editingLocation?.code ?? "",
									placeholder: "STORAGE",
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["Location name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "name",
									required: true,
									maxLength: 80,
									defaultValue: editingLocation?.name ?? "",
									placeholder: "Storage",
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f] md:col-span-2",
								children: ["Description", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "description",
									maxLength: 200,
									defaultValue: editingLocation?.description ?? "",
									placeholder: "Main available stock area",
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2 md:col-span-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									disabled: savingLocation,
									className: "h-11 rounded-xl bg-[#155eef] px-5 text-sm font-extrabold text-white disabled:opacity-60",
									children: savingLocation ? "Saving..." : editingLocation ? "Save changes" : "Add location"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										setShowLocationForm(false);
										setEditingLocation(null);
									},
									className: "h-11 rounded-xl border border-[#d5e1f0] bg-white px-4 text-sm font-bold text-[#617796]",
									children: "Cancel"
								})]
							})
						]
					}, editingLocation?.id ?? "new-location"),
					selectedLocationDetails && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						id: "selected-location-items",
						className: "mx-6 mt-5 scroll-mt-28 overflow-hidden rounded-2xl border border-[#b9d0f8] bg-[#f7faff]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3 border-b border-[#dce6f3] px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#155eef]",
									children: [selectedLocationDetails.code, " · Location inventory"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
									className: "mt-1 text-lg font-extrabold text-[#17345f]",
									children: ["Items stored in ", selectedLocationDetails.name]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-xs text-[#7186a3]",
									children: [
										selectedLocationBalances.length,
										" stocked item",
										selectedLocationBalances.length === 1 ? "" : "s",
										" with current quantities and availability."
									]
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setSelectedLocationDetails(null),
								"aria-label": "Close assigned items",
								className: "grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#cbd8e8] bg-white text-[#617796] transition hover:text-[#155eef]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 17 })
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "overflow-x-auto",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "min-w-full text-left",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
									className: "bg-white/70 text-[10px] uppercase tracking-[0.12em] text-[#8294ac]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
										"SKU",
										"Item",
										"Unit",
										"On hand",
										"Available",
										"Safety stock",
										"Status"
									].map((heading) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "whitespace-nowrap px-5 py-3 font-extrabold",
										children: heading
									}, heading)) })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
									className: "divide-y divide-[#e4ebf4] text-xs",
									children: [selectedLocationBalances.map((balance) => {
										const available = Math.max(0, balance.quantity);
										const lowStock = available < balance.product.safetyStock;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
											className: "bg-white/45",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "whitespace-nowrap px-5 py-4 font-extrabold text-[#155eef]",
													children: balance.product.sku
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "whitespace-nowrap px-5 py-4 font-extrabold text-[#17345f]",
													children: balance.product.name
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "whitespace-nowrap px-5 py-4 text-[#6c829f]",
													children: balance.product.unit
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "whitespace-nowrap px-5 py-4 font-bold text-[#29466f]",
													children: balance.quantity
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "whitespace-nowrap px-5 py-4 font-extrabold text-[#16865b]",
													children: available
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "whitespace-nowrap px-5 py-4 font-bold text-[#496482]",
													children: balance.product.safetyStock
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "whitespace-nowrap px-5 py-4",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: `rounded-full px-2.5 py-1 text-[10px] font-extrabold ${lowStock ? "bg-[#fff4df] text-[#a8670d]" : "bg-[#eaf8f1] text-[#16865b]"}`,
														children: lowStock ? "Low stock" : "Available"
													})
												})
											]
										}, balance.id);
									}), !selectedLocationBalances.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										colSpan: 8,
										className: "px-6 py-10 text-center text-sm font-semibold text-[#7f92aa]",
										children: "No stock is currently stored in this location."
									}) })]
								})]
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3",
						children: [
							loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "col-span-full rounded-2xl border border-dashed border-[#cbd8e8] px-5 py-12 text-center text-sm font-semibold text-[#7b8fa9]",
								children: "Loading warehouse locations..."
							}),
							!loading && (snapshot?.locations ?? []).map((location) => {
								const locationBalances = (snapshot?.balances ?? []).filter((balance) => balance.location.id === location.id && balance.quantity > 0);
								const available = locationBalances.reduce((total, balance) => total + Math.max(0, balance.quantity), 0);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
									className: "rounded-2xl border border-[#dce6f3] bg-[#fbfdff] p-5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start justify-between gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#155eef]",
												children: location.code
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "mt-1 text-lg font-extrabold text-[#17345f]",
												children: location.name
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `rounded-full px-3 py-1 text-[10px] font-extrabold ${location.active === false ? "bg-[#eef2f7] text-[#7186a3]" : "bg-[#eaf8f1] text-[#16865b]"}`,
												children: location.active === false ? "Inactive" : "Active"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 min-h-10 text-xs leading-5 text-[#7186a3]",
											children: location.description || "No description provided."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-4 grid grid-cols-2 gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "rounded-xl bg-[#eef5ff] p-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xl font-black text-[#155eef]",
													children: available
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[10px] font-bold uppercase tracking-wider text-[#7186a3]",
													children: "Available units"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => {
													setSelectedLocationDetails(location);
													window.requestAnimationFrame(() => document.getElementById("selected-location-items")?.scrollIntoView({
														behavior: "smooth",
														block: "start"
													}));
												},
												className: "rounded-xl bg-[#f3f7fb] p-3 text-left transition hover:bg-[#e8f1ff] focus:outline-none focus:ring-2 focus:ring-[#155eef]",
												"aria-label": `View ${locationBalances.length} stocked items in ${location.name}`,
												"aria-expanded": selectedLocationDetails?.id === location.id,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xl font-black text-[#17345f]",
													children: locationBalances.length
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[10px] font-bold uppercase tracking-wider text-[#7186a3]",
													children: "Stocked items · View"
												})]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-4 rounded-xl border border-[#cbdcf5] bg-[#f7faff] p-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#155eef]",
													children: "Actual stock in this location"
												}), locationBalances.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => {
														setSelectedLocationDetails(location);
														window.requestAnimationFrame(() => document.getElementById("selected-location-items")?.scrollIntoView({
															behavior: "smooth",
															block: "start"
														}));
													},
													className: "text-[10px] font-extrabold text-[#155eef] hover:underline",
													children: "View full details"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-2 space-y-2",
												children: [
													locationBalances.slice(0, 3).map((balance) => {
														const itemAvailable = Math.max(0, balance.quantity);
														return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "min-w-0",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																	className: "truncate text-xs font-extrabold text-[#17345f]",
																	children: balance.product.name
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																	className: "text-[9px] font-bold text-[#8294ac]",
																	children: [
																		balance.product.sku,
																		" · On hand ",
																		balance.quantity
																	]
																})]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "shrink-0 text-right",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																	className: "text-sm font-black text-[#155eef]",
																	children: [
																		itemAvailable,
																		" ",
																		balance.product.unit
																	]
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																	className: "text-[9px] font-bold uppercase text-[#8294ac]",
																	children: "available"
																})]
															})]
														}, balance.id);
													}),
													locationBalances.length > 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
														type: "button",
														onClick: () => setSelectedLocationDetails(location),
														className: "w-full rounded-lg bg-[#eaf2ff] px-3 py-2 text-center text-[10px] font-extrabold text-[#155eef]",
														children: [
															"+",
															locationBalances.length - 3,
															" more items · View all"
														]
													}),
													!locationBalances.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "rounded-lg bg-white px-3 py-4 text-center text-xs font-semibold text-[#8294ac]",
														children: "No stock is currently stored in this location."
													})
												]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-4 flex flex-wrap gap-2 border-t border-[#e7edf5] pt-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => {
													setEditingLocation(location);
													setShowLocationForm(true);
													setLocationMessage("");
													setLocationError(false);
													window.scrollTo({
														top: 0,
														behavior: "smooth"
													});
												},
												className: "rounded-lg border border-[#b9d0f8] px-3 py-2 text-xs font-extrabold text-[#155eef]",
												children: "Edit"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												disabled: deletingLocationId === location.id,
												onClick: () => void handleDeleteLocation(location),
												className: "rounded-lg border border-[#efb5b5] px-3 py-2 text-xs font-extrabold text-[#b83f3f] disabled:opacity-50",
												children: deletingLocationId === location.id ? "Deleting..." : "Delete"
											})]
										})
									]
								}, location.id);
							}),
							!loading && !(snapshot?.locations.length ?? 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "col-span-full rounded-2xl border border-dashed border-[#cbd8e8] px-5 py-12 text-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Warehouse, {
										size: 28,
										className: "mx-auto text-[#9aabc1]"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 text-sm font-extrabold text-[#496482]",
										children: "No locations have been added"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-xs text-[#8295af]",
										children: "Add a warehouse location before receiving or moving stock."
									})
								]
							})
						]
					})
				]
			}),
			!managerMode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "admin-user-access",
				className: "card-3d scroll-mt-28 rounded-[22px] bg-white p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-lg font-extrabold text-[#102a56]",
							children: "User access and permissions"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-[#7489a6]",
							children: "Manage accounts, roles and access."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								setEditingSystemUser(null);
								setShowUserForm(true);
								setUserMessage("");
							},
							className: "rounded-xl bg-[#155eef] px-4 py-2.5 text-sm font-extrabold text-white",
							children: "+ Add user"
						})]
					}),
					userMessage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						role: "status",
						className: "mt-4 rounded-xl border border-[#cfe0f8] bg-[#eef6ff] px-4 py-3 text-sm font-semibold text-[#244f86]",
						children: userMessage
					}),
					showUserForm && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: saveSystemUser,
						className: "mt-5 grid gap-4 rounded-2xl border border-[#cbdcf5] bg-[#f7faff] p-5 md:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["Employee ID", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "employeeId",
									required: true,
									defaultValue: editingSystemUser?.employeeId ?? "",
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["Full name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "displayName",
									required: true,
									defaultValue: editingSystemUser?.displayName ?? "",
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["Email", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "email",
									type: "email",
									required: true,
									defaultValue: editingSystemUser?.email ?? "",
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["Role", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									name: "role",
									required: true,
									defaultValue: editingSystemUser?.role ?? "WORKER",
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "WORKER",
										children: "Warehouse Executive"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "MANAGER",
										children: "Manager"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["Shift", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									name: "shift",
									defaultValue: editingSystemUser?.shift ?? "",
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "Not assigned"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "Day",
											children: "Day"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "Evening",
											children: "Evening"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "Night",
											children: "Night"
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["Zone", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "warehouseZone",
									defaultValue: editingSystemUser?.warehouseZone ?? "",
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
								})]
							}),
							!editingSystemUser && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["Temporary password", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "temporaryPassword",
									type: "password",
									required: true,
									minLength: 8,
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-semibold"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-end gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									disabled: savingUser,
									className: "h-11 rounded-xl bg-[#155eef] px-5 text-sm font-extrabold text-white disabled:opacity-60",
									children: savingUser ? "Saving..." : editingSystemUser ? "Save" : "Create"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										setShowUserForm(false);
										setEditingSystemUser(null);
									},
									className: "h-11 rounded-xl border border-[#d5e1f0] bg-white px-4 text-sm font-bold text-[#617796]",
									children: "Cancel"
								})]
							})
						]
					}, editingSystemUser?.id ?? "new-system-user"),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-5 grid gap-4 md:grid-cols-3",
						children: [
							[
								Warehouse,
								"Warehouse Executive",
								"Voice entry and transactions"
							],
							[
								ClipboardCheck,
								"Manager",
								"Approvals and master data"
							],
							[
								Settings,
								"Administrator",
								"User access and system health"
							]
						].map(([Icon, title, desc]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl border border-[#e2e9f3] bg-[#f8fafc] p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-10 w-10 place-items-center rounded-xl bg-[#eaf2ff] text-[#155eef]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 19 })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-extrabold text-[#17345f]",
									children: title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-bold uppercase tracking-wider text-[#16865b]",
									children: "Keycloak controlled"
								})] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-xs font-semibold leading-5 text-[#7186a3]",
								children: desc
							})]
						}, title))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 border-t border-[#e8edf5] pt-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "font-extrabold text-[#17345f]",
								children: "Real-time account controls"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-[#7b8fa9]",
								children: "Deactivation signs the user out and blocks API access immediately."
							}),
							resetPasswordUser && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								onSubmit: saveResetPassword,
								className: "mt-4 rounded-2xl border border-[#f0cf8d] bg-[#fffaf0] p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-xs font-extrabold text-[#6f582b]",
									children: [
										"New password for ",
										resetPasswordUser.displayName,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											name: "temporaryPassword",
											type: "password",
											required: true,
											minLength: 8,
											className: "mt-2 h-11 w-full rounded-xl border border-[#e4cf9e] bg-white px-3 text-sm font-semibold"
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										disabled: updatingUserId === resetPasswordUser.id,
										className: "rounded-xl bg-[#a46009] px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-50",
										children: "Reset password"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setResetPasswordUser(null),
										className: "rounded-xl border border-[#dccda9] bg-white px-4 py-2.5 text-sm font-bold text-[#6f582b]",
										children: "Cancel"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3",
								children: systemUsers.map((user) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
									className: "rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start justify-between gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "truncate font-extrabold text-[#17345f]",
													children: user.displayName
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "mt-1 text-[10px] font-bold uppercase tracking-wider text-[#7b8fa9]",
													children: [
														user.employeeId,
														" ·",
														" ",
														user.role.replaceAll("_", " ")
													]
												}),
												user.role === "WORKER" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "mt-2 text-xs font-semibold text-[#55708f]",
													children: [
														user.shift ?? "No shift",
														" ·",
														" ",
														user.warehouseZone ?? "No zone"
													]
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `rounded-full px-2.5 py-1 text-[10px] font-extrabold ${user.active ? "bg-[#eaf8f1] text-[#16865b]" : "bg-[#eef1f5] text-[#75859b]"}`,
											children: user.active ? "Active" : "Inactive"
										})]
									}), user.role === "ADMINISTRATOR" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-4 text-xs font-extrabold text-[#7b8fa9]",
										children: "Protected Administrator account"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-4 flex flex-wrap gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => {
													setEditingSystemUser(user);
													setShowUserForm(true);
													setUserMessage("");
												},
												className: "rounded-lg border border-[#c9d8ee] px-3 py-2 text-xs font-extrabold text-[#155eef]",
												children: "Edit"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => {
													setResetPasswordUser(user);
													setUserMessage("");
												},
												className: "rounded-lg border border-[#e0c37e] px-3 py-2 text-xs font-extrabold text-[#915807]",
												children: "Reset password"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												disabled: updatingUserId === user.id,
												onClick: () => void changeSystemUserStatus(user),
												className: `rounded-lg border px-3 py-2 text-xs font-extrabold disabled:opacity-50 ${user.active ? "border-[#efb5b5] text-[#b83f3f]" : "border-[#b9decf] text-[#16865b]"}`,
												children: updatingUserId === user.id ? "Updating..." : user.active ? "Deactivate" : "Activate"
											})
										]
									})]
								}, user.id))
							})
						]
					})
				]
			}),
			!managerMode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "admin-system-health",
				className: "card-3d scroll-mt-28 rounded-[22px] bg-white p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-lg font-extrabold text-[#102a56]",
								children: "System health"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-[#7489a6]",
								children: "Live monitoring for all application services."
							}),
							systemHealth && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								"data-testid": "health-last-checked",
								className: "mt-1.5 text-xs font-semibold text-[#8295af]",
								children: [
									"Last checked:",
									" ",
									new Intl.DateTimeFormat("en", {
										hour: "2-digit",
										minute: "2-digit",
										second: "2-digit"
									}).format(new Date(systemHealth.checkedAt))
								]
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => void refreshHealth(),
							disabled: healthLoading,
							className: "inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-[#c8d6e8] px-4 py-2.5 text-xs font-extrabold text-[#496482] transition hover:border-[#155eef] hover:text-[#155eef] disabled:cursor-not-allowed disabled:opacity-60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCcw, {
								size: 14,
								className: healthLoading ? "animate-spin" : ""
							}), healthLoading ? "Checking..." : "Refresh health"]
						})]
					}),
					healthError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						role: "alert",
						className: "mt-4 rounded-xl border border-[#efb5b5] bg-[#fff4f4] px-4 py-3 text-sm font-semibold text-[#a73737]",
						children: healthError
					}),
					healthItems.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-5 rounded-2xl border border-dashed border-[#d5e1f0] bg-[#fbfcfe] px-5 py-8 text-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-extrabold text-[#24466f]",
							children: loading || healthLoading ? "Loading health data..." : "System health data unavailable"
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
						children: healthItems.map((item) => {
							const tone = healthTone(item.status);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `rounded-2xl border p-4 ${tone.card}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPulse, { status: tone.pulse }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-extrabold text-[#17345f]",
												children: item.label
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `ml-auto rounded-full px-2 py-0.5 text-[9px] font-extrabold ${tone.badge}`,
												children: tone.label
											})
										]
									}),
									item.detail && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-xs font-semibold text-[#7b8fa9]",
										children: item.detail
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8295af]",
										children: ["Last checked · ", lastCheckedLabel ?? "—"]
									})
								]
							}, item.key ?? item.label);
						})
					})
				]
			}),
			managerMode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6",
				children: [error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-2xl border border-[#efb5b5] bg-[#fff4f4] p-4 text-sm font-semibold text-[#a73737]",
					children: error
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					id: "admin-items",
					className: "card-3d scroll-mt-28 rounded-[24px] bg-white",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-col gap-5 border-b border-[#e8eef6] p-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]",
								children: "Warehouse controls"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-1 text-xl font-extrabold text-[#102a56]",
								children: "Products and locations"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-[#7489a6]",
								children: "Manage catalogue and warehouse locations."
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "p-6",
						children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "py-8 text-center text-sm font-extrabold text-[#496482]",
							children: "Loading data..."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-2xl border border-[#dce6f3] bg-white p-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "grid h-10 w-10 place-items-center rounded-xl bg-[#eaf2ff] text-[#155eef]",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PackageCheck, { size: 19 })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-extrabold text-[#17345f]",
										children: "Products"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[10px] text-[#8295af]",
										children: [snapshot?.products.length ?? 0, " items"]
									})] })]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-2xl border border-[#dce6f3] bg-white p-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "grid h-10 w-10 place-items-center rounded-xl bg-[#eaf2ff] text-[#155eef]",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Warehouse, { size: 19 })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-extrabold text-[#17345f]",
										children: "Locations"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[10px] text-[#8295af]",
										children: [snapshot?.locations.length ?? 0, " active"]
									})] })]
								})
							})]
						})
					})]
				})]
			})
		]
	});
}
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ChartColumn = createLucideIcon("ChartColumn", [
	["path", {
		d: "M3 3v16a2 2 0 0 0 2 2h16",
		key: "c24i48"
	}],
	["path", {
		d: "M18 17V9",
		key: "2bz60n"
	}],
	["path", {
		d: "M13 17V5",
		key: "1frdt8"
	}],
	["path", {
		d: "M8 17v-3",
		key: "17ska0"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var FileDown = createLucideIcon("FileDown", [
	["path", {
		d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
		key: "1rqfz7"
	}],
	["path", {
		d: "M14 2v4a2 2 0 0 0 2 2h4",
		key: "tnqrlb"
	}],
	["path", {
		d: "M12 18v-6",
		key: "17g6i2"
	}],
	["path", {
		d: "m9 15 3 3 3-3",
		key: "1npd3o"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var History = createLucideIcon("History", [
	["path", {
		d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
		key: "1357e3"
	}],
	["path", {
		d: "M3 3v5h5",
		key: "1xhq8a"
	}],
	["path", {
		d: "M12 7v5l4 2",
		key: "1fdv2h"
	}]
]);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Scale = createLucideIcon("Scale", [
	["path", {
		d: "m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z",
		key: "7g6ntu"
	}],
	["path", {
		d: "m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z",
		key: "ijws7r"
	}],
	["path", {
		d: "M7 21h10",
		key: "1b0cd5"
	}],
	["path", {
		d: "M12 3v18",
		key: "108xh3"
	}],
	["path", {
		d: "M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2",
		key: "3gwbw2"
	}]
]);
var severityTone = {
	NONE: "bg-[#eef2f7] text-[#7b8fa9]",
	MINOR: "bg-[#edf4ff] text-[#155eef]",
	MEDIUM: "bg-[#fff4df] text-[#b36d0c]",
	MAJOR: "bg-[#fff1e3] text-[#c56c08]",
	CRITICAL: "bg-[#ffecec] text-[#c04343]"
};
var statusTone = {
	OPEN: "bg-[#edf4ff] text-[#155eef]",
	AWAITING_REVIEW: "bg-[#fff4df] text-[#b36d0c]",
	RECOUNT_REQUESTED: "bg-[#f2efff] text-[#6349c1]",
	APPROVED: "bg-[#eaf8f1] text-[#16865b]",
	REJECTED: "bg-[#fff0f0] text-[#b83f3f]",
	RESOLVED_AS_TRANSFER: "bg-[#eaf8f1] text-[#16865b]",
	CLOSED: "bg-[#eef2f7] text-[#7b8fa9]"
};
var statusLabel = {
	OPEN: "Open",
	AWAITING_REVIEW: "Awaiting review",
	RECOUNT_REQUESTED: "Recount requested",
	APPROVED: "Approved",
	REJECTED: "Rejected",
	RESOLVED_AS_TRANSFER: "Resolved as transfer",
	CLOSED: "Closed"
};
var auditActionMeta = {
	CASE_CREATED: {
		label: "Case created",
		tone: "bg-[#edf4ff] text-[#155eef]"
	},
	WORKER_CONFIRMED: {
		label: "Worker confirmed",
		tone: "bg-[#f4f7fc] text-[#6c829f]"
	},
	REVIEW_OPENED: {
		label: "Review opened",
		tone: "bg-[#edf4ff] text-[#155eef]"
	},
	RECOUNT_REQUESTED: {
		label: "Recount requested",
		tone: "bg-[#f2efff] text-[#6349c1]"
	},
	RECOUNT_COMPLETED: {
		label: "Recount completed",
		tone: "bg-[#f2efff] text-[#6349c1]"
	},
	APPROVED: {
		label: "Approved",
		tone: "bg-[#eaf8f1] text-[#16865b]"
	},
	REJECTED: {
		label: "Rejected",
		tone: "bg-[#fff0f0] text-[#b83f3f]"
	},
	RESOLVED_AS_TRANSFER: {
		label: "Resolved as transfer",
		tone: "bg-[#eaf8f1] text-[#16865b]"
	},
	PHOTO_UPLOADED: {
		label: "Photo uploaded",
		tone: "bg-[#e0f7fb] text-[#0e7490]"
	},
	CASE_CLOSED: {
		label: "Case closed",
		tone: "bg-[#eef2f7] text-[#7b8fa9]"
	}
};
function formatDifference(quantity) {
	return quantity > 0 ? `+${quantity}` : String(quantity);
}
function DiscrepanciesPage() {
	const [items, setItems] = (0, import_react.useState)([]);
	const [summary, setSummary] = (0, import_react.useState)(null);
	const [total, setTotal] = (0, import_react.useState)(0);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [page, setPage] = (0, import_react.useState)(1);
	const pageSize = 12;
	const [query, setQuery] = (0, import_react.useState)("");
	const [statusFilter, setStatusFilter] = (0, import_react.useState)("");
	const [severityFilter, setSeverityFilter] = (0, import_react.useState)("");
	const [differenceFilter, setDifferenceFilter] = (0, import_react.useState)("");
	const [summaryView, setSummaryView] = (0, import_react.useState)(null);
	const [sort, setSort] = (0, import_react.useState)("createdAt");
	const [order, setOrder] = (0, import_react.useState)("desc");
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [detailLoading, setDetailLoading] = (0, import_react.useState)(false);
	const [message, setMessage] = (0, import_react.useState)("");
	const [messageTone, setMessageTone] = (0, import_react.useState)("info");
	const [actingId, setActingId] = (0, import_react.useState)(null);
	const [action, setAction] = (0, import_react.useState)(null);
	const [actionNote, setActionNote] = (0, import_react.useState)("");
	const [inventorySnapshot, setInventorySnapshot] = (0, import_react.useState)(null);
	const [transferSource, setTransferSource] = (0, import_react.useState)("");
	const [transferDestination, setTransferDestination] = (0, import_react.useState)("");
	const [auditEvents, setAuditEvents] = (0, import_react.useState)([]);
	const [auditLoading, setAuditLoading] = (0, import_react.useState)(false);
	const [evidenceUrls, setEvidenceUrls] = (0, import_react.useState)({});
	const [reportsOpen, setReportsOpen] = (0, import_react.useState)(false);
	const [reports, setReports] = (0, import_react.useState)(null);
	const [reportsLoading, setReportsLoading] = (0, import_react.useState)(false);
	const [exporting, setExporting] = (0, import_react.useState)(false);
	const [uploadPreview, setUploadPreview] = (0, import_react.useState)(null);
	const [uploadFile, setUploadFile] = (0, import_react.useState)(null);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const [uploadError, setUploadError] = (0, import_react.useState)("");
	async function loadData(resetPage = false) {
		setLoading(true);
		try {
			const [list, summaryData, snapshot] = await Promise.all([
				fetchDiscrepancies({
					page: resetPage ? 1 : page,
					pageSize,
					status: statusFilter || void 0,
					severity: severityFilter || void 0,
					difference: differenceFilter || void 0,
					sort,
					order,
					view: summaryView || void 0
				}),
				fetchDiscrepancySummary(),
				fetchInventorySnapshot().catch(() => null)
			]);
			setItems(list.items);
			setTotal(list.total);
			setSummary(summaryData);
			if (resetPage) setPage(1);
			if (snapshot) setInventorySnapshot(snapshot);
		} catch {
			setItems([]);
			setTotal(0);
		} finally {
			setLoading(false);
		}
	}
	(0, import_react.useEffect)(() => {
		const timer = window.setTimeout(() => {
			loadData();
		}, 0);
		return () => window.clearTimeout(timer);
	}, [
		page,
		statusFilter,
		severityFilter,
		differenceFilter,
		sort,
		order,
		summaryView
	]);
	const filteredBySearch = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		if (!q) return items;
		return items.filter((item) => item.caseNumber.toLowerCase().includes(q) || item.product.name.toLowerCase().includes(q) || item.product.sku.toLowerCase().includes(q));
	}, [items, query]);
	async function openDetail(item) {
		setDetailLoading(true);
		setSelected(item);
		setUploadPreview(null);
		setUploadFile(null);
		setUploadError("");
		setAuditEvents([]);
		try {
			const [fresh, audit] = await Promise.all([fetchDiscrepancy(item.id), fetchDiscrepancyAudit(item.id).catch(() => [])]);
			setSelected(fresh);
			setAuditEvents(audit);
			setAuditLoading(false);
			loadEvidenceUrls(fresh);
		} catch {
			setMessageTone("error");
			setMessage("The case details could not be loaded. Refresh and try again.");
		} finally {
			setDetailLoading(false);
		}
	}
	async function loadEvidenceUrls(caseData) {
		const evidence = await fetchDiscrepancyEvidence(caseData.id).catch(() => []);
		const urls = {};
		await Promise.all(evidence.slice(0, 8).map(async (entry) => {
			try {
				urls[entry.id] = await fetchEvidenceObjectUrl(entry.id);
			} catch {}
		}));
		setEvidenceUrls((current) => ({
			...current,
			...urls
		}));
	}
	function closeDetail() {
		setSelected(null);
		setAction(null);
		setActionNote("");
		setTransferSource("");
		setTransferDestination("");
		setAuditEvents([]);
		setUploadPreview(null);
		setUploadFile(null);
	}
	async function refresh() {
		setMessage("");
		await loadData(true);
		setMessageTone("info");
		setMessage("Discrepancy cases refreshed from the live database.");
	}
	async function toggleReports() {
		const next = !reportsOpen;
		setReportsOpen(next);
		if (next && !reports) {
			setReportsLoading(true);
			try {
				setReports(await fetchDiscrepancyReports());
			} catch {
				setMessageTone("error");
				setMessage("Manager reports could not be loaded. Try again.");
			} finally {
				setReportsLoading(false);
			}
		}
	}
	async function exportCsv() {
		setExporting(true);
		setMessage("");
		try {
			await downloadDiscrepancyCsv({
				status: statusFilter || void 0,
				severity: severityFilter || void 0,
				difference: differenceFilter || void 0
			});
			setMessageTone("info");
			setMessage("The filtered discrepancy list was exported as a CSV file.");
		} catch (error) {
			setMessageTone("error");
			setMessage(error instanceof Error ? error.message : "The CSV export could not be completed.");
		} finally {
			setExporting(false);
		}
	}
	function prepareUpload(file) {
		if (!file) return;
		if (![
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/webp"
		].includes(file.type)) {
			setUploadError("Only JPEG, PNG and WebP images are accepted.");
			return;
		}
		if (file.size > 8 * 1024 * 1024) {
			setUploadError("The photo must be 8 MB or smaller.");
			return;
		}
		setUploadError("");
		setUploadFile({
			file,
			name: file.name || "evidence.jpg"
		});
		const reader = new FileReader();
		reader.onload = () => setUploadPreview(String(reader.result));
		reader.readAsDataURL(file);
	}
	async function submitEvidence() {
		if (!selected || !uploadFile) return;
		setUploading(true);
		setUploadError("");
		try {
			await uploadDiscrepancyEvidence(selected.id, uploadFile.file, uploadFile.name);
			const fresh = await fetchDiscrepancy(selected.id);
			setSelected(fresh);
			setUploadPreview(null);
			setUploadFile(null);
			setMessageTone("info");
			setMessage("Photo evidence uploaded and linked to the case.");
			loadEvidenceUrls(fresh);
		} catch (error) {
			setUploadError(error instanceof Error ? error.message : "The photo could not be uploaded.");
		} finally {
			setUploading(false);
		}
	}
	async function runDecision() {
		if (!selected || !action) return;
		setActingId(selected.id);
		setMessage("");
		try {
			if (action === "approve") {
				await approveDiscrepancy(selected.id, actionNote);
				setMessageTone("info");
				setMessage(`Case ${selected.caseNumber} approved. The stock balance was updated to the counted quantity.`);
			} else if (action === "recount") {
				await requestDiscrepancyRecount(selected.id, actionNote, void 0);
				setMessageTone("info");
				setMessage(`A recount task was created for ${selected.caseNumber}. No stock was changed.`);
			} else if (action === "reject") {
				await rejectDiscrepancy(selected.id, actionNote);
				setMessageTone("info");
				setMessage(`Case ${selected.caseNumber} was rejected. Stock stays unchanged.`);
			} else if (action === "transfer") {
				await resolveDiscrepancyTransfer(selected.id, {
					sourceLocationId: transferSource,
					destinationLocationId: transferDestination,
					note: actionNote
				});
				setMessageTone("info");
				setMessage(`Case ${selected.caseNumber} was resolved as a transfer. Stock moved between the two locations.`);
			}
			setAction(null);
			setActionNote("");
			setTransferSource("");
			setTransferDestination("");
			await loadData();
			const fresh = await fetchDiscrepancy(selected.id).catch(() => null);
			if (fresh) {
				setSelected(fresh);
				setAuditEvents(await fetchDiscrepancyAudit(selected.id).catch(() => []));
			}
		} catch (error) {
			setMessageTone("error");
			setMessage(error instanceof Error ? error.message : "The manager decision could not be completed. Try again.");
		} finally {
			setActingId(null);
		}
	}
	const openCases = summary?.byStatus.AWAITING_REVIEW ?? 0;
	const recountCases = summary?.byStatus.RECOUNT_REQUESTED ?? 0;
	const majorCritical = (summary?.bySeverity.MAJOR ?? 0) + (summary?.bySeverity.CRITICAL ?? 0);
	const resolvedToday = items.filter((item) => item.resolvedAt && new Date(item.resolvedAt).toDateString() === (/* @__PURE__ */ new Date()).toDateString()).length;
	const missingQuantity = items.filter((item) => item.differenceQuantity < 0).reduce((sum, item) => sum + Math.abs(item.differenceQuantity), 0);
	const extraQuantity = items.filter((item) => item.differenceQuantity > 0).reduce((sum, item) => sum + item.differenceQuantity, 0);
	const selectSummaryView = (view) => {
		setSummaryView(view);
		setStatusFilter("");
		setSeverityFilter("");
		setDifferenceFilter("");
		setQuery("");
		setPage(1);
		window.setTimeout(() => {
			document.getElementById("discrepancy-case-list")?.scrollIntoView({
				behavior: "smooth",
				block: "start"
			});
		}, 50);
	};
	const transferQuantity = selected ? Math.abs(selected.differenceQuantity) : 0;
	const positiveLocationDifference = (selected?.differenceQuantity ?? 0) > 0;
	const transferSourceOptions = (0, import_react.useMemo)(() => {
		if (!selected || !inventorySnapshot || !positiveLocationDifference) return [];
		return inventorySnapshot.balances.filter((balance) => balance.product.id === selected.product.id && balance.location.id !== selected.location.id && balance.quantity >= transferQuantity).sort((left, right) => left.location.name.localeCompare(right.location.name));
	}, [
		inventorySnapshot,
		positiveLocationDifference,
		selected,
		transferQuantity
	]);
	const transferDestinationOptions = (0, import_react.useMemo)(() => {
		if (!selected || !inventorySnapshot || positiveLocationDifference) return [];
		return inventorySnapshot.locations.filter((location) => location.id !== selected.location.id).sort((left, right) => left.name.localeCompare(right.name));
	}, [
		inventorySnapshot,
		positiveLocationDifference,
		selected
	]);
	const transferSourceBalance = inventorySnapshot?.balances.find((balance) => balance.product.id === selected?.product.id && balance.location.id === transferSource);
	const transferDestinationBalance = inventorySnapshot?.balances.find((balance) => balance.product.id === selected?.product.id && balance.location.id === transferDestination);
	const transferSourceBefore = transferSourceBalance?.quantity ?? 0;
	const transferDestinationBefore = transferDestinationBalance?.quantity ?? 0;
	const transferSourceAfter = transferSourceBefore - transferQuantity;
	const transferDestinationAfter = transferDestinationBefore + transferQuantity;
	const transferHasEnoughAvailable = transferSourceBefore >= transferQuantity;
	const recountInFlight = selected?.recountTask?.status === "OPEN" || selected?.recountTask?.status === "IN_PROGRESS";
	const canDecide = selected !== null && ["AWAITING_REVIEW", "OPEN"].includes(selected.status) && !recountInFlight;
	const summaryCards = [
		{
			label: "Open",
			value: String(openCases),
			detail: "Awaiting manager review",
			icon: ClipboardCheck,
			tone: "text-[#155eef] bg-[#edf4ff]",
			view: "OPEN",
			explanation: "Cases waiting for a manager to review the physical count and choose an action."
		},
		{
			label: "Awaiting recount",
			value: String(recountCases),
			detail: "Recount tasks assigned",
			icon: RefreshCcw,
			tone: "text-[#6349c1] bg-[#f2efff]",
			view: "AWAITING_RECOUNT",
			explanation: "Cases sent back to a Warehouse Executive for another physical count."
		},
		{
			label: "Major and critical",
			value: String(majorCritical),
			detail: "High-priority cases",
			icon: TriangleAlert,
			tone: "text-[#c04343] bg-[#ffecec]",
			view: "HIGH_PRIORITY",
			explanation: "Major and critical differences that need priority attention."
		},
		{
			label: "Resolved today",
			value: String(summary?.resolvedToday ?? resolvedToday),
			detail: "Cases closed today",
			icon: CircleCheck,
			tone: "text-[#16865b] bg-[#eaf8f1]",
			view: "RESOLVED_TODAY",
			explanation: "Cases approved, rejected, closed or resolved as a transfer today."
		},
		{
			label: "Missing quantity",
			value: String(summary?.missingQuantity ?? missingQuantity),
			detail: "Units short across open cases",
			icon: PackageMinus,
			tone: "text-[#b36d0c] bg-[#fff4df]",
			view: "MISSING",
			explanation: "Open cases where the physical count is lower than the system quantity."
		},
		{
			label: "Extra quantity",
			value: String(summary?.extraQuantity ?? extraQuantity),
			detail: "Units over system stock",
			icon: PackagePlus,
			tone: "text-[#0e7490] bg-[#e0f7fb]",
			view: "EXTRA",
			explanation: "Open cases where the physical count is higher than the system quantity."
		}
	];
	const pageCount = Math.max(1, Math.ceil(total / pageSize));
	const severityTotal = reports ? Object.values(reports.severityDistribution).reduce((sum, value) => sum + value, 0) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		id: "manager-discrepancies",
		className: "space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "overflow-hidden rounded-[24px] border border-[#d8e5f7] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.06)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-4 border-b border-[#e9eef5] px-6 py-6 sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#c04343]",
							children: "Manager-only · count accuracy"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-1 text-lg font-extrabold text-[#102a56]",
							children: "Discrepancies"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-[#8294ac]",
							children: "Physical counts that differ from the system balance. Approve the count, request a recount, reject it, or resolve it as a transfer."
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => void exportCsv(),
								disabled: exporting,
								className: "inline-flex w-fit items-center gap-2 rounded-xl border border-[#c8d6e8] bg-white px-4 py-2.5 text-xs font-extrabold text-[#496482] transition hover:bg-[#f4f8ff] disabled:opacity-60",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileDown, { size: 15 }), exporting ? "Exporting…" : "Export CSV"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => void toggleReports(),
								disabled: reportsLoading,
								className: "inline-flex w-fit items-center gap-2 rounded-xl border border-[#c8d6e8] bg-white px-4 py-2.5 text-xs font-extrabold text-[#496482] transition hover:bg-[#f4f8ff] disabled:opacity-60",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartColumn, { size: 15 }), reportsOpen ? "Hide reports" : "Manager reports"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => void refresh(),
								disabled: loading,
								className: "inline-flex w-fit items-center gap-2 rounded-xl border border-[#c8d6e8] bg-white px-4 py-2.5 text-xs font-extrabold text-[#496482] transition hover:bg-[#f4f8ff] disabled:opacity-60",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCcw, {
									size: 15,
									className: loading ? "animate-spin" : ""
								}), loading ? "Refreshing…" : "Refresh cases"]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6",
					children: summaryCards.map((card, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => selectSummaryView(card.view),
						"aria-pressed": summaryView === card.view,
						"aria-label": `Show ${card.label.toLowerCase()} discrepancy details`,
						className: `rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(16,45,82,0.08)] focus:outline-none focus:ring-2 focus:ring-[#155eef]/30 ${summaryView === card.view ? "border-[#155eef] bg-[#f1f6ff] shadow-[0_10px_24px_rgba(21,94,239,0.12)]" : "border-[#e2e9f3] bg-[#f9fbfd]"}`,
						style: { animation: `dashboard-enter .5s ease ${index * 70}ms both` },
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `grid h-9 w-9 place-items-center rounded-xl ${card.tone}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(card.icon, { size: 17 })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scale, {
									size: 14,
									className: "text-[#c9d5e4]"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-2xl font-black tracking-[-0.03em] text-[#17345f]",
								children: card.value
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-0.5 text-xs font-extrabold text-[#29466f]",
								children: card.label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-0.5 text-[10px] font-semibold text-[#8294ac]",
								children: card.detail
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-[10px] font-extrabold text-[#155eef]",
								children: "View details →"
							})
						]
					}, card.label))
				}),
				reportsOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "border-t border-[#e9eef5] bg-[#fbfdff] px-6 py-6",
					"aria-label": "Manager discrepancy reports",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]",
							children: "Reports · real database records only"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-1 text-base font-extrabold text-[#102a56]",
							children: "Discrepancy insights"
						})] }), reports?.generatedAt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[10px] font-semibold text-[#9aabc1]",
							children: ["Generated ", new Intl.DateTimeFormat("en", {
								dateStyle: "medium",
								timeStyle: "short"
							}).format(new Date(reports.generatedAt))]
						})]
					}), reportsLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
						children: [
							0,
							1,
							2,
							3
						].map((index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-28 animate-pulse rounded-2xl bg-[#eef3f9]" }, index))
					}) : reports ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 space-y-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-2xl border border-[#e6edf5] bg-white p-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] font-extrabold uppercase tracking-wider text-[#8295af]",
											children: "Difference split"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-2 space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs font-bold text-[#0e7490]",
												children: [
													"Extra +",
													reports.differenceSplit.positive.units,
													" units · ",
													reports.differenceSplit.positive.cases,
													" cases"
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs font-bold text-[#c04343]",
												children: [
													"Missing −",
													reports.differenceSplit.negative.units,
													" units · ",
													reports.differenceSplit.negative.cases,
													" cases"
												]
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-2xl border border-[#e6edf5] bg-white p-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] font-extrabold uppercase tracking-wider text-[#8295af]",
											children: "Severity distribution"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-2 space-y-1.5",
											children: [Object.entries(reports.severityDistribution).filter(([, count]) => count > 0).map(([severity, count]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: `w-14 rounded px-1.5 py-0.5 text-center text-[9px] font-extrabold ${severityTone[severity]}`,
														children: severity
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "h-1.5 flex-1 overflow-hidden rounded-full bg-[#eef3f9]",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "h-full rounded-full bg-[#155eef]",
															style: { width: `${severityTotal ? Math.max(4, count / severityTotal * 100) : 0}%` }
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "w-6 text-right text-[10px] font-extrabold text-[#49617f]",
														children: count
													})
												]
											}, severity)), severityTotal === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-[#9aabc1]",
												children: "No cases recorded yet."
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-2xl border border-[#e6edf5] bg-white p-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] font-extrabold uppercase tracking-wider text-[#8295af]",
												children: "Resolution & recounts"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2 text-2xl font-black text-[#17345f]",
												children: reports.averageResolutionHours ?? "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] font-bold text-[#8295af]",
												children: "avg resolution hours"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-2 text-sm font-extrabold text-[#6349c1]",
												children: [reports.recountFrequency, " recounts"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-0.5 text-sm font-extrabold text-[#16865b]",
												children: [reports.approvedAdjustmentQuantity, " units approved"]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-2xl border border-[#e6edf5] bg-white p-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] font-extrabold uppercase tracking-wider text-[#8295af]",
											children: "Stock accuracy trend"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-2 space-y-1.5",
											children: [reports.stockAccuracyTrend.slice(-4).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "flex items-center justify-between text-[11px] font-bold text-[#49617f]",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: row.month }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: row.accuracy === null ? "text-[#9aabc1]" : row.accuracy >= 90 ? "text-[#16865b]" : "text-[#c56c08]",
													children: row.accuracy === null ? "no counts" : `${row.accuracy}% accurate`
												})]
											}, row.month)), reports.stockAccuracyTrend.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-[#9aabc1]",
												children: "No cycle counts yet."
											})]
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid gap-4 lg:grid-cols-3",
								children: [
									{
										title: "By product",
										rows: reports.byProduct.slice(0, 6),
										render: (row) => `${row.name} · ${row.cases} case${row.cases === 1 ? "" : "s"}`
									},
									{
										title: "By location",
										rows: reports.byLocation.slice(0, 6),
										render: (row) => `${row.name} · ${row.cases} case${row.cases === 1 ? "" : "s"}`
									},
									{
										title: "By worker",
										rows: reports.byWorker.slice(0, 6),
										render: (row) => `${row.name} · ${row.cases} case${row.cases === 1 ? "" : "s"}`
									}
								].map((panel) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-2xl border border-[#e6edf5] bg-white p-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-extrabold uppercase tracking-wider text-[#8295af]",
										children: panel.title
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-2 space-y-1.5",
										children: panel.rows.length > 0 ? panel.rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "truncate text-[11px] font-bold text-[#49617f]",
											children: panel.render(row)
										}, row.name)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-[#9aabc1]",
											children: "No data yet."
										})
									})]
								}, panel.title))
							}),
							(reports.repeatedProducts.length > 0 || reports.repeatedLocations.length > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2",
								children: [reports.repeatedProducts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-2xl border border-[#ffe3b3] bg-[#fffaf0] p-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-extrabold uppercase tracking-wider text-[#b36d0c]",
										children: "Repeated problem products"
									}), reports.repeatedProducts.slice(0, 4).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1.5 truncate text-[11px] font-bold text-[#7a5410]",
										children: [
											row.name,
											" · ",
											row.cases,
											" cases"
										]
									}, row.productId))]
								}), reports.repeatedLocations.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-2xl border border-[#ffe3b3] bg-[#fffaf0] p-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-extrabold uppercase tracking-wider text-[#b36d0c]",
										children: "Repeated problem locations"
									}), reports.repeatedLocations.slice(0, 4).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1.5 truncate text-[11px] font-bold text-[#7a5410]",
										children: [
											row.name,
											" · ",
											row.cases,
											" cases"
										]
									}, row.locationId))]
								})]
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 rounded-xl bg-[#fff4df] px-4 py-3 text-xs font-semibold text-[#7a5410]",
						children: "The reports could not be generated from live data."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					id: "discrepancy-case-list",
					className: "scroll-mt-24 border-t border-[#e9eef5]",
					children: [summaryView && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-6 mt-5 flex flex-col gap-3 rounded-2xl border border-[#cbdcf6] bg-[#f3f7ff] px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
						role: "status",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm font-extrabold text-[#17345f]",
							children: ["Showing: ", summaryCards.find((card) => card.view === summaryView)?.label]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 text-xs font-semibold text-[#637b9b]",
							children: summaryCards.find((card) => card.view === summaryView)?.explanation
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								setSummaryView(null);
								setPage(1);
							},
							className: "shrink-0 rounded-xl border border-[#b9cef0] bg-white px-4 py-2 text-xs font-extrabold text-[#155eef] transition hover:bg-[#eaf2ff]",
							children: "Show all cases"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "relative block w-full lg:max-w-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "sr-only",
									children: "Search discrepancies"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
									size: 15,
									className: "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8597af]"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "search",
									value: query,
									onChange: (event) => setQuery(event.target.value),
									placeholder: "Search case, item or SKU",
									className: "h-10 w-full rounded-xl border border-[#d5e1f0] bg-white pl-9 pr-3 text-sm font-semibold text-[#17345f] outline-none transition focus:border-[#155eef] focus:ring-2 focus:ring-[#155eef]/15"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: statusFilter,
									onChange: (event) => {
										setSummaryView(null);
										setStatusFilter(event.target.value);
										setPage(1);
									},
									"aria-label": "Filter by status",
									className: "h-10 rounded-xl border border-[#d5e1f0] bg-white px-3 text-xs font-bold text-[#17345f] outline-none transition focus:border-[#155eef]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "All statuses"
									}), Object.entries(statusLabel).map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value,
										children: label
									}, value))]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: severityFilter,
									onChange: (event) => {
										setSummaryView(null);
										setSeverityFilter(event.target.value);
										setPage(1);
									},
									"aria-label": "Filter by severity",
									className: "h-10 rounded-xl border border-[#d5e1f0] bg-white px-3 text-xs font-bold text-[#17345f] outline-none transition focus:border-[#155eef]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "All severities"
									}), [
										"MINOR",
										"MEDIUM",
										"MAJOR",
										"CRITICAL"
									].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value,
										children: value
									}, value))]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: differenceFilter,
									onChange: (event) => {
										setSummaryView(null);
										setDifferenceFilter(event.target.value);
										setPage(1);
									},
									"aria-label": "Filter by difference direction",
									className: "h-10 rounded-xl border border-[#d5e1f0] bg-white px-3 text-xs font-bold text-[#17345f] outline-none transition focus:border-[#155eef]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "All differences"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "POSITIVE",
											children: "Extra (counted above)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "NEGATIVE",
											children: "Missing (counted below)"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: sort,
									onChange: (event) => setSort(event.target.value),
									"aria-label": "Sort by",
									className: "h-10 rounded-xl border border-[#d5e1f0] bg-white px-3 text-xs font-bold text-[#17345f] outline-none transition focus:border-[#155eef]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "createdAt",
											children: "Newest first"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "severity",
											children: "Severity"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "differenceQuantity",
											children: "Difference"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "differencePercentage",
											children: "Difference %"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setOrder(order === "desc" ? "asc" : "desc"),
									"aria-pressed": order === "asc",
									className: "h-10 rounded-xl border border-[#d5e1f0] bg-[#f4f8ff] px-3 text-xs font-extrabold text-[#496482] transition hover:text-[#155eef]",
									children: order === "desc" ? "Newest ↓" : "Oldest ↑"
								})
							]
						})]
					})]
				}),
				message && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					role: "status",
					className: `mx-6 mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${messageTone === "error" ? "bg-[#fff0f0] text-[#a73737]" : "bg-[#eef6ff] text-[#244f86]"}`,
					children: message
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3 px-5 py-4 lg:hidden",
					children: [
						loading && items.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-3",
							children: [
								0,
								1,
								2
							].map((index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-36 animate-pulse rounded-2xl border border-[#e6edf5] bg-[#f4f7fc]" }, index))
						}),
						!loading && filteredBySearch.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "py-10 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
									size: 26,
									className: "mx-auto text-[#16865b]"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-sm font-extrabold text-[#24466f]",
									children: "No discrepancy cases found"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-[#7b8fa9]",
									children: query || statusFilter || severityFilter ? "No cases match the current search and filters." : "Physical counts that differ from the system balance appear here."
								})
							]
						}),
						filteredBySearch.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => void openDetail(item),
							className: "block w-full rounded-2xl border border-[#e2e9f3] bg-white p-4 text-left transition hover:border-[#b9d0f8] hover:bg-[#f8faff]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-sm font-extrabold text-[#155eef]",
										children: item.caseNumber
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${severityTone[item.severity]}`,
										children: item.severity
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1.5 truncate text-sm font-extrabold text-[#24466f]",
									children: [
										item.product.name,
										" · ",
										item.product.sku
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-0.5 text-xs font-semibold text-[#7186a3]",
									children: item.location.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex items-center justify-between text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-bold text-[#29466f]",
										children: [
											"Expected ",
											item.expectedQuantity,
											" · Counted ",
											item.countedQuantity
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `font-extrabold ${item.differenceQuantity < 0 ? "text-[#c04343]" : item.differenceQuantity > 0 ? "text-[#0e7490]" : "text-[#7b8fa9]"}`,
										children: formatDifference(item.differenceQuantity)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusTone[item.status]}`,
										children: statusLabel[item.status]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] font-bold text-[#9aabc1]",
										children: new Intl.DateTimeFormat("en", {
											day: "2-digit",
											month: "short",
											hour: "2-digit",
											minute: "2-digit"
										}).format(new Date(item.createdAt))
									})]
								})
							]
						}, item.id))
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hidden overflow-x-auto lg:block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "min-w-full text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-[#e5ebf4] text-[10px] uppercase tracking-wider text-[#8295af]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3",
									children: "Case"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3",
									children: "Date"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3",
									children: "Product"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3",
									children: "SKU"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3",
									children: "Location"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3 text-right",
									children: "Available Stock"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3 text-right",
									children: "Counted"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3 text-right",
									children: "Difference"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3 text-right",
									children: "%"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3",
									children: "Severity"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3",
									children: "Worker"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3",
									children: "Status"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3",
									children: "Review"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
							loading && items.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 13,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-3 px-5 py-6",
									children: [
										0,
										1,
										2
									].map((index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-10 animate-pulse rounded-xl bg-[#f0f4fa]" }, index))
								})
							}) }),
							filteredBySearch.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-[#eef2f7] last:border-0 transition hover:bg-[#f8faff]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "whitespace-nowrap px-5 py-4 font-extrabold text-[#155eef]",
										children: item.caseNumber
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "whitespace-nowrap px-5 py-4 text-[#6c829f]",
										children: new Intl.DateTimeFormat("en", {
											day: "2-digit",
											month: "short",
											hour: "2-digit",
											minute: "2-digit"
										}).format(new Date(item.createdAt))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "whitespace-nowrap px-5 py-4 font-extrabold text-[#24466f]",
										children: item.product.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "whitespace-nowrap px-5 py-4 text-[#6c829f]",
										children: item.product.sku
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "whitespace-nowrap px-5 py-4 text-[#6c829f]",
										children: item.location.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "whitespace-nowrap px-5 py-4 text-right font-bold text-[#29466f]",
										children: item.expectedQuantity
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "whitespace-nowrap px-5 py-4 text-right font-bold text-[#29466f]",
										children: item.countedQuantity
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: `whitespace-nowrap px-5 py-4 text-right font-extrabold ${item.differenceQuantity < 0 ? "text-[#c04343]" : item.differenceQuantity > 0 ? "text-[#0e7490]" : "text-[#7b8fa9]"}`,
										children: formatDifference(item.differenceQuantity)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "whitespace-nowrap px-5 py-4 text-right font-bold text-[#6c829f]",
										children: [item.differencePercentage, "%"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "whitespace-nowrap px-5 py-4",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `rounded-full px-2.5 py-1 text-[10px] font-extrabold ${severityTone[item.severity]}`,
											children: item.severity
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "whitespace-nowrap px-5 py-4 text-[#6c829f]",
										children: item.worker?.displayName ?? "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "whitespace-nowrap px-5 py-4",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusTone[item.status]}`,
											children: statusLabel[item.status]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "whitespace-nowrap px-5 py-4",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => void openDetail(item),
											className: "rounded-lg border border-[#c9d8ee] px-3 py-1.5 text-[11px] font-extrabold text-[#155eef] transition hover:bg-[#f4f8ff]",
											children: "Review"
										})
									})
								]
							}, item.id)),
							filteredBySearch.length === 0 && !loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								colSpan: 13,
								className: "px-6 py-14 text-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
										size: 26,
										className: "mx-auto text-[#16865b]"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 text-sm font-extrabold text-[#24466f]",
										children: "No discrepancy cases found"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-xs text-[#7b8fa9]",
										children: query || statusFilter || severityFilter ? "No cases match the current search and filters." : "Physical counts that differ from the system balance appear here."
									})
								]
							}) })
						] })]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 border-t border-[#e9eef5] px-6 py-4 sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs font-bold text-[#8295af]",
						children: [
							total,
							" case",
							total === 1 ? "" : "s",
							" · page ",
							page,
							" of ",
							pageCount
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: page <= 1,
							onClick: () => setPage((value) => Math.max(1, value - 1)),
							className: "rounded-lg border border-[#c9d8ee] px-3 py-2 text-[11px] font-extrabold text-[#496482] transition hover:bg-[#f4f8ff] disabled:opacity-40",
							children: "Previous"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: page >= pageCount,
							onClick: () => setPage((value) => Math.min(pageCount, value + 1)),
							className: "rounded-lg border border-[#c9d8ee] px-3 py-2 text-[11px] font-extrabold text-[#496482] transition hover:bg-[#f4f8ff] disabled:opacity-40",
							children: "Next"
						})]
					})]
				})
			]
		}), selected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0b2343]/50 p-4 backdrop-blur-sm sm:p-8",
			role: "dialog",
			"aria-modal": "true",
			"aria-label": `Case ${selected.caseNumber}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-3xl rounded-[26px] border border-[#d8e5f7] bg-white shadow-[0_24px_70px_rgba(11,35,67,0.35)]",
				style: { animation: "dialog-in .3s ease both" },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-4 border-b border-[#e9eef5] px-6 py-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]",
							children: "Discrepancy case"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-1 text-lg font-extrabold text-[#102a56]",
							children: selected.caseNumber
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: closeDetail,
							"aria-label": "Close case details",
							className: "rounded-lg p-2 text-[#6f84a3] transition hover:bg-[#f5f8fc]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18 })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "max-h-[60vh] overflow-y-auto px-6 py-5",
						children: detailLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-3",
							children: [
								0,
								1,
								2,
								3
							].map((index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-14 animate-pulse rounded-xl bg-[#f0f4fa]" }, index))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
									children: [
										["Product", `${selected.product.name} (${selected.product.sku})`],
										["Location", selected.location.name],
										["Expected quantity", String(selected.expectedQuantity)],
										["Counted quantity", String(selected.countedQuantity)],
										["Difference", `${formatDifference(selected.differenceQuantity)} (${selected.differencePercentage}%)`],
										["Severity", selected.severity],
										["Severity rule", selected.severityRule ?? "Standard backend thresholds applied."],
										["Worker", selected.worker?.displayName ?? "—"],
										["Date and time", new Intl.DateTimeFormat("en", {
											dateStyle: "medium",
											timeStyle: "short"
										}).format(new Date(selected.createdAt))],
										["Status", statusLabel[selected.status]]
									].map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl border border-[#e6edf5] bg-[#f9fbfd] px-3 py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[9px] font-extrabold uppercase tracking-wider text-[#8295af]",
											children: label
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm font-extrabold text-[#29466f]",
											children: value
										})]
									}, label))
								}),
								selected.transaction?.transcript && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-[#e6edf5] bg-[#f9fbfd] px-4 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8295af]",
										children: "Voice transcript"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1.5 text-sm font-semibold leading-6 text-[#3a5070]",
										children: [
											"“",
											selected.transaction.transcript,
											"”"
										]
									})]
								}),
								selected.transaction && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-[#b9d0f8] bg-[#f2f6ff] px-4 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#155eef]",
										children: "AI-understood details · related transaction"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2 grid gap-2 text-sm sm:grid-cols-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "font-bold text-[#29466f]",
												children: ["TX-", selected.transactionId.slice(0, 8).toUpperCase()]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "font-semibold text-[#49617f]",
												children: [
													selected.transaction.action,
													" · ",
													selected.transaction.status
												]
											}),
											selected.transaction.reviewReasons && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#b36d0c] sm:col-span-2",
												children: ["Flagged: ", selected.transaction.reviewReasons]
											})
										]
									})]
								}),
								(selected.workerNotes || selected.managerNotes) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [selected.workerNotes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl bg-[#f4f7fc] px-4 py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#6c829f]",
											children: "Worker note"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm font-semibold text-[#49617f]",
											children: selected.workerNotes
										})]
									}), selected.managerNotes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl bg-[#fff4df] px-4 py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#b36d0c]",
											children: "Manager note"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm font-semibold text-[#7a5410]",
											children: selected.managerNotes
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-[#e6edf5] bg-[#f9fbfd] px-4 py-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0e7490]",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 13 }),
													" Photo evidence",
													selected.evidence && selected.evidence.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "rounded-full bg-[#e0f7fb] px-2 py-0.5 text-[10px]",
														children: selected.evidence.length
													})
												]
											}), !uploadPreview && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "cursor-pointer rounded-lg border border-[#b9d0f8] bg-[#f2f6ff] px-3 py-1.5 text-[10px] font-extrabold text-[#155eef] transition hover:bg-[#eaf2ff]",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, {
															size: 12,
															className: "mr-1 inline"
														}),
														"Choose file",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
															type: "file",
															accept: "image/jpeg,image/png,image/webp",
															className: "sr-only",
															onChange: (event) => prepareUpload(event.target.files?.[0])
														})
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "cursor-pointer rounded-lg border border-[#b9d0f8] bg-[#f2f6ff] px-3 py-1.5 text-[10px] font-extrabold text-[#155eef] transition hover:bg-[#eaf2ff]",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {
															size: 12,
															className: "mr-1 inline"
														}),
														"Camera",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
															type: "file",
															accept: "image/*",
															capture: "environment",
															className: "sr-only",
															onChange: (event) => prepareUpload(event.target.files?.[0])
														})
													]
												})]
											})]
										}),
										uploadPreview && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-3 rounded-xl border border-[#d5e1f0] bg-white p-3",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													src: uploadPreview,
													alt: "Evidence photo preview",
													className: "mx-auto max-h-44 rounded-lg object-contain"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-2 flex items-center justify-between gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "truncate text-[11px] font-bold text-[#49617f]",
														children: uploadFile?.name
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
															type: "button",
															onClick: () => {
																setUploadPreview(null);
																setUploadFile(null);
																setUploadError("");
															},
															className: "flex items-center gap-1 rounded-lg border border-[#efb5b5] bg-[#fff6f6] px-3 py-1.5 text-[10px] font-extrabold text-[#b83f3f]",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 12 }), " Remove"]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															type: "button",
															onClick: () => void submitEvidence(),
															disabled: uploading,
															className: "rounded-lg bg-[#155eef] px-3 py-1.5 text-[10px] font-extrabold text-white disabled:opacity-60",
															children: uploading ? "Uploading…" : "Upload photo"
														})]
													})]
												}),
												uploadError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-2 text-[11px] font-semibold text-[#a73737]",
													children: uploadError
												})
											]
										}),
										selected.evidence && selected.evidence.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4",
											children: selected.evidence.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "overflow-hidden rounded-lg border border-[#d5e1f0] bg-white",
												children: [
													evidenceUrls[entry.id] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
														src: evidenceUrls[entry.id],
														alt: entry.originalFilename,
														className: "h-16 w-full object-cover"
													}) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "grid h-16 w-full place-items-center bg-[#eef3f9] text-[#9aabc1]",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { size: 16 })
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "truncate px-1.5 py-1 text-[9px] font-bold text-[#6c829f]",
														title: entry.originalFilename,
														children: entry.originalFilename
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "px-1.5 pb-1.5 text-[9px] font-semibold text-[#9aabc1]",
														children: [
															entry.uploadedBy?.displayName ?? "—",
															" · ",
															formatClock(entry.createdAt)
														]
													})
												]
											}, entry.id))
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-[#e6edf5] bg-[#f9fbfd] px-4 py-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#6349c1]",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { size: 13 }),
											" Audit history · append-only",
											auditEvents.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "rounded-full bg-[#f2efff] px-2 py-0.5 text-[10px]",
												children: [auditEvents.length, " events"]
											})
										]
									}), auditLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 text-xs font-semibold text-[#9aabc1]",
										children: "Loading audit history…"
									}) : auditEvents.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 text-xs font-semibold text-[#9aabc1]",
										children: "No audit events recorded for this case."
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
										className: "mt-4 space-y-0",
										children: auditEvents.map((event, index) => {
											const meta = auditActionMeta[event.action] ?? {
												label: event.action,
												tone: "bg-[#eef2f7] text-[#7b8fa9]"
											};
											const actor = event.actorManager?.displayName ?? event.actorWorker?.displayName ?? null;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
												className: "relative flex gap-3 pb-4 last:pb-0",
												children: [
													index < auditEvents.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "absolute left-[9px] top-5 h-full w-px bg-[#e2e9f3]",
														"aria-hidden": "true"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: `mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full ring-4 ring-white ${meta.tone.split(" ")[0]}`,
														"aria-hidden": "true"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "min-w-0 flex-1",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex flex-wrap items-center gap-x-2 gap-y-0.5",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: `rounded-full px-2 py-0.5 text-[9px] font-extrabold ${meta.tone}`,
																		children: meta.label
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "text-[9px] font-bold text-[#9aabc1]",
																		children: new Intl.DateTimeFormat("en", {
																			day: "2-digit",
																			month: "short",
																			hour: "2-digit",
																			minute: "2-digit"
																		}).format(new Date(event.createdAt))
																	}),
																	actor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "text-[10px] font-bold text-[#49617f]",
																		children: actor
																	})
																]
															}),
															(event.previousStatus || event.newStatus) && event.previousStatus !== event.newStatus && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "mt-1 text-[10px] font-semibold text-[#7186a3]",
																children: [
																	event.previousStatus ? statusLabel[event.previousStatus] ?? event.previousStatus : "Created",
																	" → ",
																	statusLabel[event.newStatus ?? ""] ?? event.newStatus
																]
															}),
															event.differenceQuantity !== null && event.differenceQuantity !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "mt-0.5 text-[10px] font-bold text-[#29466f]",
																children: [
																	"Expected ",
																	event.expectedQuantity,
																	" · Counted ",
																	event.countedQuantity,
																	" · ",
																	formatDifference(event.differenceQuantity)
																]
															}),
															event.severityRule && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "mt-0.5 text-[10px] font-semibold text-[#49617f]",
																children: ["Rule: ", event.severityRule]
															}),
															event.reason && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "mt-0.5 text-[11px] font-semibold text-[#6c829f]",
																children: event.reason
															}),
															event.rawTranscript && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "mt-1 rounded-lg bg-[#f4f7fc] px-2.5 py-1.5 text-[10px] font-semibold italic leading-4 text-[#7186a3]",
																children: [
																	"“",
																	event.rawTranscript,
																	"”"
																]
															})
														]
													})
												]
											}, event.id);
										})
									})]
								}),
								selected.resolvedAt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-[#cde6d8] bg-[#f1faf5] px-4 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#16865b]",
										children: "Decision history · final resolution"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2 grid gap-2 text-sm sm:grid-cols-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-bold text-[#24573f]",
												children: statusLabel[selected.status]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "font-semibold text-[#3a6b50]",
												children: [
													selected.resolvedBy?.displayName ?? "—",
													" · ",
													formatClock(selected.resolvedAt)
												]
											}),
											selected.resolutionTransaction && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "font-semibold text-[#3a6b50] sm:col-span-2",
												children: [
													"Ledger TX-",
													selected.resolutionTransaction.id.slice(0, 8).toUpperCase(),
													" · ",
													selected.resolutionTransaction.action,
													" · ",
													selected.resolutionTransaction.status
												]
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-2.5 border-t border-[#eef2f7] pt-4 sm:grid-cols-2 lg:grid-cols-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: !canDecide || actingId !== null,
											onClick: () => {
												setAction("approve");
												setActionNote("");
											},
											className: "rounded-xl bg-[#16865b] px-4 py-3 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(22,134,91,0.22)] disabled:opacity-50",
											children: "Approve adjustment"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: ![
												"AWAITING_REVIEW",
												"OPEN",
												"RECOUNT_REQUESTED"
											].includes(selected.status) || actingId !== null,
											onClick: () => {
												setAction("recount");
												setActionNote("");
											},
											className: "rounded-xl border border-[#cfc0f0] bg-[#faf6ff] px-4 py-2.5 text-xs font-extrabold text-[#6349c1] disabled:opacity-50",
											children: "Request recount"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: !canDecide || actingId !== null,
											onClick: () => {
												setAction("reject");
												setActionNote("");
											},
											className: "rounded-xl border border-[#efb5b5] bg-[#fff6f6] px-4 py-2.5 text-xs font-extrabold text-[#b83f3f] disabled:opacity-50",
											children: "Reject"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: !canDecide || actingId !== null,
											onClick: () => {
												setAction("transfer");
												setActionNote("");
												if (selected.differenceQuantity > 0) {
													setTransferSource("");
													setTransferDestination(selected.location.id);
												} else {
													setTransferSource(selected.location.id);
													setTransferDestination("");
												}
											},
											className: "rounded-xl border border-[#b9d0f8] bg-[#f2f6ff] px-4 py-2.5 text-xs font-extrabold text-[#155eef] disabled:opacity-50",
											children: "Resolve as transfer"
										})
									]
								})
							]
						})
					}),
					action && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-t border-[#e9eef5] bg-[#f8faff] px-6 py-5",
						children: [
							action === "approve" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-3 rounded-xl bg-[#fff4df] px-4 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
										size: 17,
										className: "mt-0.5 shrink-0 text-[#b36d0c]"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs font-semibold leading-5 text-[#7a5410]",
										children: [
											"Approving sets the balance to the counted quantity (",
											selected.countedQuantity,
											") and posts the ledger entry. This changes stock."
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block text-xs font-extrabold text-[#49617f]",
									children: ["Manager note (required)", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										value: actionNote,
										onChange: (event) => setActionNote(event.target.value),
										maxLength: 500,
										placeholder: "Count confirmed against the shelf record.",
										className: "mt-2 min-h-[72px] w-full rounded-xl border border-[#d5e1f0] bg-white px-3 py-2.5 text-sm font-semibold text-[#17345f] outline-none transition focus:border-[#155eef] focus:ring-2 focus:ring-[#155eef]/15"
									})]
								})]
							}),
							action === "recount" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "rounded-xl bg-[#f2efff] px-4 py-3 text-xs font-semibold text-[#5a4696]",
									children: "A recount task is created and assigned to the original worker. Stock is never changed."
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block text-xs font-extrabold text-[#49617f]",
									children: ["Instructions (required)", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										value: actionNote,
										onChange: (event) => setActionNote(event.target.value),
										maxLength: 500,
										placeholder: "Count the full shelf again and call back the number.",
										className: "mt-2 min-h-[72px] w-full rounded-xl border border-[#d5e1f0] bg-white px-3 py-2.5 text-sm font-semibold text-[#17345f] outline-none transition focus:border-[#155eef] focus:ring-2 focus:ring-[#155eef]/15"
									})]
								})]
							}),
							action === "reject" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "rounded-xl bg-[#fff0f0] px-4 py-3 text-xs font-semibold text-[#a73737]",
									children: "The count is rejected and the case is closed. Stock stays unchanged and history is preserved."
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block text-xs font-extrabold text-[#49617f]",
									children: ["Reason (required)", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										value: actionNote,
										onChange: (event) => setActionNote(event.target.value),
										maxLength: 500,
										placeholder: "The counted quantity cannot be confirmed.",
										className: "mt-2 min-h-[72px] w-full rounded-xl border border-[#d5e1f0] bg-white px-3 py-2.5 text-sm font-semibold text-[#17345f] outline-none transition focus:border-[#155eef] focus:ring-2 focus:ring-[#155eef]/15"
									})]
								})]
							}),
							action === "transfer" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start gap-3 rounded-xl bg-[#fff4df] px-4 py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRightLeft, {
											size: 17,
											className: "mt-0.5 shrink-0 text-[#b36d0c]"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs font-semibold leading-5 text-[#7a5410]",
											children: [
												"Moves ",
												transferQuantity,
												" ",
												selected.product.unit,
												" between two locations in one posted transfer. The original Cycle Count is closed, and total inventory cannot increase."
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-3 sm:grid-cols-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "block text-xs font-extrabold text-[#49617f]",
											children: ["Source location", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
												value: transferSource,
												onChange: (event) => setTransferSource(event.target.value),
												disabled: !positiveLocationDifference,
												className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-bold text-[#17345f] disabled:bg-[#eef2f7] disabled:text-[#6f829a]",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
														value: "",
														children: positiveLocationDifference ? transferSourceOptions.length ? "Select recorded stock location" : "No location has enough available stock" : `${selected.location.code} — ${selected.location.name}`
													}),
													positiveLocationDifference && transferSourceOptions.map((balance) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
														value: balance.location.id,
														children: [
															balance.location.code,
															" — ",
															balance.location.name,
															" — ",
															balance.quantity,
															" ",
															balance.product.unit,
															" available"
														]
													}, balance.location.id)),
													!positiveLocationDifference && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
														value: selected.location.id,
														children: [
															selected.location.code,
															" — ",
															selected.location.name
														]
													})
												]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "block text-xs font-extrabold text-[#49617f]",
											children: ["Physical destination", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
												value: transferDestination,
												onChange: (event) => setTransferDestination(event.target.value),
												disabled: positiveLocationDifference,
												className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 text-sm font-bold text-[#17345f] disabled:bg-[#eef2f7] disabled:text-[#6f829a]",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
														value: "",
														children: positiveLocationDifference ? `${selected.location.code} — ${selected.location.name}` : "Select physical destination"
													}),
													positiveLocationDifference && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
														value: selected.location.id,
														children: [
															selected.location.code,
															" — ",
															selected.location.name
														]
													}),
													!positiveLocationDifference && transferDestinationOptions.map((location) => {
														const balance = inventorySnapshot?.balances.find((entry) => entry.product.id === selected.product.id && entry.location.id === location.id);
														return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
															value: location.id,
															children: [
																location.code,
																" — ",
																location.name,
																" — ",
																balance?.quantity ?? 0,
																" ",
																selected.product.unit,
																" recorded"
															]
														}, location.id);
													})
												]
											})]
										})]
									}),
									transferSource && transferDestination && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-2xl border border-[#cddcf2] bg-white p-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#155eef]",
												children: [
													"Stock preview — total remains ",
													transferSourceBefore + transferDestinationBefore,
													" ",
													selected.product.unit
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-3 grid gap-3 sm:grid-cols-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "rounded-xl bg-[#fff6f0] p-3",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-xs font-extrabold text-[#8b4b22]",
															children: ["From ", transferSourceBalance?.location.name ?? "source"]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "mt-1 text-sm font-black text-[#17345f]",
															children: [
																transferSourceBefore,
																" → ",
																transferSourceAfter
															]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "mt-1 text-[10px] font-semibold text-[#7f91a8]",
															children: ["Available before: ", transferSourceBefore]
														})
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "rounded-xl bg-[#eef9f3] p-3",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-xs font-extrabold text-[#246044]",
															children: ["To ", transferDestinationBalance?.location.name ?? selected.location.name]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "mt-1 text-sm font-black text-[#17345f]",
															children: [
																transferDestinationBefore,
																" → ",
																transferDestinationAfter
															]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "mt-1 text-[10px] font-semibold text-[#7f91a8]",
															children: ["Total after: ", transferSourceAfter + transferDestinationAfter]
														})
													]
												})]
											}),
											!transferHasEnoughAvailable && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-3 rounded-lg bg-[#fff0f0] px-3 py-2 text-xs font-bold text-[#a73737]",
												children: "The source does not have enough available stock for this transfer."
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "block text-xs font-extrabold text-[#49617f]",
										children: ["Resolution reason (required)", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
											value: actionNote,
											onChange: (event) => setActionNote(event.target.value),
											maxLength: 500,
											placeholder: "Stock was physically found in Storage 1 but recorded in Packing.",
											className: "mt-2 min-h-[72px] w-full rounded-xl border border-[#d5e1f0] bg-white px-3 py-2.5 text-sm font-semibold text-[#17345f] outline-none transition focus:border-[#155eef] focus:ring-2 focus:ring-[#155eef]/15"
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex items-center justify-end gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setAction(null),
									className: "rounded-xl border border-[#c9d8ee] px-4 py-2.5 text-xs font-extrabold text-[#496482]",
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: actingId !== null || action === "approve" && !actionNote.trim() || action === "recount" && !actionNote.trim() || action === "reject" && !actionNote.trim() || action === "transfer" && (!transferSource || !transferDestination || !actionNote.trim() || !transferHasEnoughAvailable),
									onClick: () => void runDecision(),
									className: `rounded-xl px-5 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(21,94,239,0.22)] disabled:opacity-50 ${action === "reject" ? "bg-[#c04343]" : action === "approve" ? "bg-[#16865b]" : action === "recount" ? "bg-[#7257d6]" : "bg-[#155eef]"}`,
									children: actingId === selected.id ? "Working…" : action === "approve" ? "Approve and post" : action === "recount" ? "Create recount task" : action === "reject" ? "Reject case" : "Resolve transfer"
								})]
							})
						]
					})
				]
			})
		})]
	});
}
/**
* Manager photo-evidence viewer for one transaction.
*
* The metadata list comes from GET /transactions/:id/evidence (which never
* exposes the physical storage path) and the pixels are fetched through the
* authenticated file endpoint as object URLs. Every object URL created here is
* revoked when the preview closes or the component unmounts.
*/
function TransactionEvidence({ transactionId, evidenceCount = 0, inline = false }) {
	const [open, setOpen] = (0, import_react.useState)(inline);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [evidence, setEvidence] = (0, import_react.useState)([]);
	const [thumbnailUrls, setThumbnailUrls] = (0, import_react.useState)({});
	const [preview, setPreview] = (0, import_react.useState)(null);
	const [previewLoading, setPreviewLoading] = (0, import_react.useState)(false);
	const [previewError, setPreviewError] = (0, import_react.useState)(null);
	const mountedRef = (0, import_react.useRef)(true);
	const createdUrlsRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const revokeAll = (0, import_react.useCallback)(() => {
		createdUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
		createdUrlsRef.current.clear();
	}, []);
	(0, import_react.useEffect)(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
			revokeAll();
		};
	}, [revokeAll]);
	const loadEvidence = (0, import_react.useCallback)(async () => {
		setLoading(true);
		setError(null);
		try {
			const rows = await fetchTransactionEvidence(transactionId);
			if (!mountedRef.current) return;
			setEvidence(rows);
			revokeAll();
			const next = {};
			await Promise.all(rows.slice(0, 12).map(async (entry) => {
				try {
					const url = await fetchEvidenceObjectUrl(entry.id);
					if (!mountedRef.current) {
						URL.revokeObjectURL(url);
						return;
					}
					next[entry.id] = url;
					createdUrlsRef.current.add(url);
				} catch {}
			}));
			if (mountedRef.current) setThumbnailUrls(next);
		} catch (caught) {
			if (mountedRef.current) setError(caught instanceof Error ? caught.message : "Photo evidence could not be loaded.");
		} finally {
			if (mountedRef.current) setLoading(false);
		}
	}, [transactionId, revokeAll]);
	(0, import_react.useEffect)(() => {
		if (!inline) return void 0;
		const timer = window.setTimeout(() => void loadEvidence(), 0);
		return () => window.clearTimeout(timer);
	}, [inline, loadEvidence]);
	function openViewer() {
		setOpen(true);
		loadEvidence();
	}
	async function openPreview(entry) {
		setPreviewLoading(true);
		setPreviewError(null);
		try {
			const url = await fetchEvidenceObjectUrl(entry.id);
			if (!mountedRef.current) {
				URL.revokeObjectURL(url);
				return;
			}
			setPreview({
				evidence: entry,
				url
			});
		} catch (caught) {
			if (mountedRef.current) setPreviewError(caught instanceof Error ? caught.message : "The photo could not be opened.");
		} finally {
			if (mountedRef.current) setPreviewLoading(false);
		}
	}
	function closePreview() {
		if (preview) URL.revokeObjectURL(preview.url);
		setPreview(null);
		setPreviewError(null);
	}
	const hasPhotos = (evidence.length > 0 || evidenceCount > 0) && !loading;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		!inline && evidenceCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: openViewer,
			className: "inline-flex items-center gap-2 rounded-lg border border-[#b9d0f8] bg-[#f2f6ff] px-3 py-1.5 text-[11px] font-extrabold text-[#155eef] transition hover:bg-[#eaf2ff]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 14 }),
				"View evidence",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-full bg-[#155eef] px-1.5 py-0.5 text-[9px] font-extrabold text-white",
					children: evidence.length > 0 ? evidence.length : evidenceCount
				})
			]
		}),
		open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			"aria-label": "Photo evidence",
			className: "rounded-xl border border-[#e6edf5] bg-[#f9fbfd] px-4 py-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0e7490]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 13 }),
						" Photo evidence",
						hasPhotos && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-[#e0f7fb] px-2 py-0.5 text-[10px]",
							children: evidence.length > 0 ? evidence.length : evidenceCount
						})
					]
				}), !inline && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setOpen(false),
					"aria-label": "Close photo evidence",
					className: "rounded-lg border border-[#d5e1f0] bg-white p-1.5 text-[#66809f] transition hover:text-[#155eef]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14 })
				})]
			}), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 flex items-center gap-2 text-xs font-semibold text-[#9aabc1]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
					size: 14,
					className: "animate-spin"
				}), "Loading photo evidence…"]
			}) : error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f3c0c0] bg-[#fff1f1] px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex items-center gap-2 text-xs font-semibold text-[#a12f2f]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 14 }), error]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => void loadEvidence(),
					className: "inline-flex items-center gap-1.5 rounded-lg bg-[#a12f2f] px-3 py-1.5 text-[10px] font-extrabold text-white",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCcw, { size: 12 }), " Try again"]
				})]
			}) : evidence.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-xs font-semibold text-[#9aabc1]",
				children: "No photo evidence attached to this transaction."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4",
				children: evidence.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => void openPreview(entry),
					"aria-label": `Preview ${entry.originalFilename}`,
					className: "group overflow-hidden rounded-lg border border-[#d5e1f0] bg-white text-left transition hover:border-[#155eef]",
					children: [
						thumbnailUrls[entry.id] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: thumbnailUrls[entry.id],
							alt: entry.originalFilename,
							className: "h-16 w-full object-cover transition group-hover:scale-105"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-16 w-full place-items-center bg-[#eef3f9] text-[#9aabc1]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { size: 16 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate px-1.5 py-1 text-[9px] font-bold text-[#6c829f]",
							children: entry.originalFilename
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "block truncate px-1.5 pb-1.5 text-[9px] font-semibold text-[#9aabc1]",
							children: [
								entry.uploadedBy?.displayName ?? "Unknown",
								" ·",
								" ",
								new Intl.DateTimeFormat("en", {
									day: "2-digit",
									month: "short",
									hour: "2-digit",
									minute: "2-digit"
								}).format(new Date(entry.createdAt))
							]
						})
					]
				}, entry.id))
			})]
		}),
		preview && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": `Photo preview — ${preview.evidence.originalFilename}`,
			className: "fixed inset-0 z-50 grid place-items-center bg-[#0a1a33]/80 p-4 backdrop-blur-sm",
			onClick: closePreview,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl",
				onClick: (event) => event.stopPropagation(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-4 border-b border-[#e6edf6] px-5 py-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-sm font-extrabold text-[#17345f]",
							children: preview.evidence.originalFilename
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-0.5 text-[11px] font-semibold text-[#7b8fa9]",
							children: [
								"Uploaded by ",
								preview.evidence.uploadedBy?.displayName ?? "Unknown",
								" ·",
								" ",
								new Intl.DateTimeFormat("en", {
									dateStyle: "medium",
									timeStyle: "short"
								}).format(new Date(preview.evidence.createdAt))
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: closePreview,
						"aria-label": "Close photo preview",
						className: "rounded-lg border border-[#d5e1f0] bg-white p-2 text-[#66809f] transition hover:text-[#155eef]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid max-h-[70vh] place-items-center overflow-auto bg-[#0f1e38] p-3",
					children: previewLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-center gap-2 py-16 text-sm font-bold text-[#a9c6ff]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
							size: 18,
							className: "animate-spin"
						}), " Loading photo…"]
					}) : previewError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "py-16 text-sm font-bold text-[#ffb4b4]",
						children: previewError
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: preview.url,
						alt: preview.evidence.originalFilename,
						className: "max-h-[65vh] w-auto max-w-full rounded-lg object-contain"
					})
				})]
			})
		})
	] });
}
var currentCycleCountPeriod = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
function monthEndDueValue(periodMonth) {
	const [year, month] = periodMonth.split("-").map(Number);
	const finalDay = new Date(year, month, 0).getDate();
	return `${periodMonth}-${String(finalDay).padStart(2, "0")}T17:00`;
}
function ManagerDashboard({ page, onNavigate, onPendingApprovalsChange }) {
	const [snapshot, setSnapshot] = (0, import_react.useState)(null);
	const [reorderDrafts, setReorderDrafts] = (0, import_react.useState)([]);
	const [transactionTab, setTransactionTab] = (0, import_react.useState)("needsReview");
	const [reviewingId, setReviewingId] = (0, import_react.useState)(null);
	const [managerMessage, setManagerMessage] = (0, import_react.useState)("");
	const [damageAdjustmentReasons, setDamageAdjustmentReasons] = (0, import_react.useState)({});
	const [reorderActionId, setReorderActionId] = (0, import_react.useState)(null);
	const [reorderMessage, setReorderMessage] = (0, import_react.useState)("");
	const [purchaseQuery, setPurchaseQuery] = (0, import_react.useState)("");
	const [purchaseFilter, setPurchaseFilter] = (0, import_react.useState)("ALL");
	const [purchaseSort, setPurchaseSort] = (0, import_react.useState)("severity");
	const [auditAction, setAuditAction] = (0, import_react.useState)("ALL");
	const [auditStatus, setAuditStatus] = (0, import_react.useState)("ALL");
	const [selectedAuditTransaction, setSelectedAuditTransaction] = (0, import_react.useState)(null);
	const [cancellingTransactionId, setCancellingTransactionId] = (0, import_react.useState)(null);
	const [managerTasks, setManagerTasks] = (0, import_react.useState)([]);
	const [taskAssignees, setTaskAssignees] = (0, import_react.useState)([]);
	const [taskMessage, setTaskMessage] = (0, import_react.useState)("");
	const [taskMessageTone, setTaskMessageTone] = (0, import_react.useState)("info");
	const [deletingTaskId, setDeletingTaskId] = (0, import_react.useState)(null);
	const [managerTaskView, setManagerTaskView] = (0, import_react.useState)("OPEN");
	const [taskDueValue, setTaskDueValue] = (0, import_react.useState)(defaultTaskDue);
	const [plannedTaskType, setPlannedTaskType] = (0, import_react.useState)("RECEIVE");
	const [plannedProductId, setPlannedProductId] = (0, import_react.useState)("");
	const [plannedLocationId, setPlannedLocationId] = (0, import_react.useState)("");
	const [plannedCycleLocationIds, setPlannedCycleLocationIds] = (0, import_react.useState)([]);
	const [plannedTransferQuantity, setPlannedTransferQuantity] = (0, import_react.useState)("");
	const [plannedTransferSourceId, setPlannedTransferSourceId] = (0, import_react.useState)("");
	const [plannedTransferDestinationId, setPlannedTransferDestinationId] = (0, import_react.useState)("");
	const [schedulingTasks, setSchedulingTasks] = (0, import_react.useState)(false);
	const [scheduledLocationIds, setScheduledLocationIds] = (0, import_react.useState)([]);
	const [blindCycleCount, setBlindCycleCount] = (0, import_react.useState)(true);
	const [cycleCountInstructions, setCycleCountInstructions] = (0, import_react.useState)("");
	const [cycleCountAssigneeId, setCycleCountAssigneeId] = (0, import_react.useState)("");
	const [cycleCountPeriod, setCycleCountPeriod] = (0, import_react.useState)(currentCycleCountPeriod);
	const [cycleCountDueValue, setCycleCountDueValue] = (0, import_react.useState)(() => monthEndDueValue(currentCycleCountPeriod));
	const [cycleCountPlans, setCycleCountPlans] = (0, import_react.useState)([]);
	const [openPlanId, setOpenPlanId] = (0, import_react.useState)(null);
	const [openPlanDetail, setOpenPlanDetail] = (0, import_react.useState)(null);
	const [loadingPlanDetail, setLoadingPlanDetail] = (0, import_react.useState)(false);
	const [healthMounted, setHealthMounted] = (0, import_react.useState)(false);
	const [snapshotLoading, setSnapshotLoading] = (0, import_react.useState)(true);
	const [snapshotError, setSnapshotError] = (0, import_react.useState)("");
	const [auxiliaryWarning, setAuxiliaryWarning] = (0, import_react.useState)("");
	const [reloadKey, setReloadKey] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const frame = requestAnimationFrame(() => setHealthMounted(true));
		return () => cancelAnimationFrame(frame);
	}, []);
	function navigateToTransactions(tab) {
		setTransactionTab(tab);
		onNavigate(resolveManagerPage("Transactions"));
		window.scrollTo({
			top: 0,
			behavior: "smooth"
		});
	}
	function applyReorderDrafts(drafts) {
		setReorderDrafts(drafts);
	}
	function retryLiveData() {
		setSnapshotLoading(true);
		setSnapshotError("");
		setAuxiliaryWarning("");
		setReloadKey((value) => value + 1);
	}
	(0, import_react.useEffect)(() => {
		let active = true;
		Promise.allSettled([
			fetchInventorySnapshot(),
			refreshReorderDrafts(),
			fetchInventoryTasks(),
			fetchTaskAssignees(),
			fetchCycleCountPlans()
		]).then(([inventory, drafts, tasks, assignees, plans]) => {
			if (!active) return;
			if (inventory.status === "fulfilled") {
				setSnapshot(inventory.value);
				setSnapshotError("");
			} else setSnapshotError("Live inventory data could not be loaded. Check the API and PostgreSQL services, then retry.");
			if (drafts.status === "fulfilled") applyReorderDrafts(drafts.value);
			if (tasks.status === "fulfilled") setManagerTasks(tasks.value);
			if (assignees.status === "fulfilled") setTaskAssignees(assignees.value);
			if (plans.status === "fulfilled") setCycleCountPlans(plans.value);
			const secondaryFailures = [
				drafts,
				tasks,
				assignees,
				plans
			].filter((result) => result.status === "rejected").length;
			setAuxiliaryWarning(secondaryFailures > 0 ? `${secondaryFailures} supporting data section${secondaryFailures === 1 ? " is" : "s are"} temporarily unavailable.` : "");
			setSnapshotLoading(false);
		});
		const refreshLiveData = async () => {
			if (!active || document.visibilityState === "hidden") return;
			const [tasks, inventory, drafts, plans] = await Promise.allSettled([
				fetchInventoryTasks(),
				fetchInventorySnapshot(),
				refreshReorderDrafts(),
				fetchCycleCountPlans()
			]);
			if (!active) return;
			if (tasks.status === "fulfilled") setManagerTasks(tasks.value);
			if (inventory.status === "fulfilled") {
				setSnapshot(inventory.value);
				setSnapshotError("");
				setAuxiliaryWarning("");
			} else setAuxiliaryWarning("Automatic live refresh could not connect. The last successfully loaded data remains visible.");
			if (drafts.status === "fulfilled") setReorderDrafts(drafts.value);
			if (plans.status === "fulfilled") setCycleCountPlans(plans.value);
		};
		const timer = window.setInterval(() => void refreshLiveData(), 8e3);
		const refreshOnFocus = () => void refreshLiveData();
		const refreshOnVisible = () => {
			if (document.visibilityState === "visible") refreshLiveData();
		};
		window.addEventListener("focus", refreshOnFocus);
		document.addEventListener("visibilitychange", refreshOnVisible);
		return () => {
			active = false;
			window.clearInterval(timer);
			window.removeEventListener("focus", refreshOnFocus);
			document.removeEventListener("visibilitychange", refreshOnVisible);
		};
	}, [reloadKey]);
	const stockHealth = (0, import_react.useMemo)(() => {
		const balances = snapshot?.balances ?? [];
		const productStock = /* @__PURE__ */ new Map();
		for (const balance of balances) {
			const current = productStock.get(balance.product.id) ?? {
				available: 0,
				safety: balance.product.safetyStock
			};
			current.available += Math.max(0, balance.quantity);
			productStock.set(balance.product.id, current);
		}
		let critical = 0;
		let low = 0;
		let healthy = 0;
		for (const { available, safety } of productStock.values()) if (available <= Math.max(1, Math.floor(safety / 2))) critical += 1;
		else if (available < safety) low += 1;
		else healthy += 1;
		const total = productStock.size || 1;
		return {
			critical,
			low,
			healthy,
			total: productStock.size,
			healthyPct: Math.round(healthy / total * 100)
		};
	}, [snapshot]);
	const needsAttention = (0, import_react.useMemo)(() => {
		return mapLowStock(snapshot?.balances ?? []).sort((left, right) => left.available / Math.max(1, left.threshold) - right.available / Math.max(1, right.threshold)).slice(0, 3).map((entry) => ({
			name: entry.item,
			sku: entry.code,
			available: entry.available,
			safety: entry.threshold
		}));
	}, [snapshot]);
	const displayedLowStock = snapshot ? mapLowStock(snapshot.balances) : [];
	const openTaskCount = managerTasks.filter((task) => task.status === "OPEN" || task.status === "IN_PROGRESS").length;
	const completedTaskCount = managerTasks.filter((task) => task.status === "COMPLETED").length;
	const displayedManagerTasks = managerTasks.filter((task) => managerTaskView === "OPEN" ? task.status === "OPEN" || task.status === "IN_PROGRESS" : task.status === "COMPLETED").slice(0, 12);
	const transferSourceBalances = (0, import_react.useMemo)(() => {
		if (!snapshot || !plannedProductId) return [];
		return snapshot.balances.filter((balance) => balance.product.id === plannedProductId && balance.quantity > 0).sort((left, right) => left.location.name.localeCompare(right.location.name));
	}, [snapshot, plannedProductId]);
	const plannedTaskLocationOptions = (0, import_react.useMemo)(() => {
		if (!snapshot || !plannedProductId) return [];
		const product = snapshot.products.find((entry) => entry.id === plannedProductId);
		if (!product) return [];
		return snapshot.locations.map((location) => {
			const balance = snapshot.balances.find((entry) => entry.product.id === plannedProductId && entry.location.id === location.id);
			return {
				location,
				available: Math.max(0, balance?.quantity ?? 0),
				unit: product.unit
			};
		}).filter((entry) => plannedTaskType === "RECEIVE" || entry.available > 0).sort((left, right) => left.location.name.localeCompare(right.location.name));
	}, [
		snapshot,
		plannedProductId,
		plannedTaskType
	]);
	const selectedTransferSourceBalance = transferSourceBalances.find((balance) => balance.location.id === plannedTransferSourceId);
	const selectedTransferDestinationBalance = snapshot?.balances.find((balance) => balance.product.id === plannedProductId && balance.location.id === plannedTransferDestinationId);
	const selectedTransferProduct = snapshot?.products.find((product) => product.id === plannedProductId);
	const transferQuantity = Number(plannedTransferQuantity) || 0;
	const cycleCountPlanPreview = (0, import_react.useMemo)(() => {
		const balances = (snapshot?.balances ?? []).filter((balance) => scheduledLocationIds.includes(balance.location.id) && balance.quantity > 0);
		return {
			tasks: balances.length,
			locations: new Set(balances.map((balance) => balance.location.id)).size,
			items: new Set(balances.map((balance) => balance.product.id)).size
		};
	}, [snapshot, scheduledLocationIds]);
	const managerExecutives = (0, import_react.useMemo)(() => {
		const byAssignee = /* @__PURE__ */ new Map();
		for (const task of managerTasks) {
			if (!task.assignedTo) continue;
			let entry = byAssignee.get(task.assignedTo.id);
			if (!entry) {
				entry = {
					assignee: {
						id: task.assignedTo.id,
						displayName: task.assignedTo.displayName
					},
					open: 0,
					inProgress: 0,
					completed: 0
				};
				byAssignee.set(task.assignedTo.id, entry);
			}
			if (task.status === "COMPLETED") entry.completed += 1;
			else if (task.status === "IN_PROGRESS") {
				entry.inProgress += 1;
				entry.currentTask ??= task;
			} else if (task.status === "OPEN") entry.open += 1;
		}
		return [...byAssignee.values()].sort((left, right) => right.inProgress + right.open - (left.inProgress + left.open));
	}, [managerTasks]);
	const pendingReviewTransactions = snapshot ? snapshot.transactions.filter((transaction) => transaction.status === "PENDING" && Boolean(transaction.confirmedAt)) : [];
	const pendingApprovals = pendingReviewTransactions.length;
	(0, import_react.useEffect)(() => {
		onPendingApprovalsChange?.(pendingApprovals);
	}, [pendingApprovals, onPendingApprovalsChange]);
	const lowStockDraftCount = reorderDrafts.filter((draft) => draft.currentStock < draft.safetyStock).length;
	const visibleReorderDrafts = (0, import_react.useMemo)(() => {
		const query = purchaseQuery.trim().toLowerCase();
		return reorderDrafts.filter((draft) => draft.currentStock < draft.safetyStock).filter((draft) => {
			if (query === "") return true;
			return draft.product.name.toLowerCase().includes(query) || draft.product.sku.toLowerCase().includes(query);
		}).filter((draft) => purchaseFilter === "ALL" ? true : purchaseFilter === "OUT" ? draft.currentStock <= 0 : draft.currentStock > 0).sort((left, right) => {
			if (purchaseSort === "name") return left.product.name.localeCompare(right.product.name);
			return left.currentStock / Math.max(1, left.safetyStock) - right.currentStock / Math.max(1, right.safetyStock) || left.product.name.localeCompare(right.product.name);
		});
	}, [
		reorderDrafts,
		purchaseQuery,
		purchaseFilter,
		purchaseSort
	]);
	const movementReport = (0, import_react.useMemo)(() => {
		const days = Array.from({ length: 7 }, (_, offset) => {
			const date = /* @__PURE__ */ new Date();
			date.setHours(0, 0, 0, 0);
			date.setDate(date.getDate() - (6 - offset));
			return {
				key: date.toDateString(),
				label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date),
				received: 0,
				outgoing: 0
			};
		});
		for (const transaction of snapshot?.transactions ?? []) {
			if (transaction.status !== "POSTED") continue;
			const day = days.find((entry) => entry.key === new Date(transaction.createdAt).toDateString());
			if (!day) continue;
			if (transaction.action === "RECEIVE") day.received += transaction.quantity;
			if (transaction.action === "SHIP") day.outgoing += transaction.quantity;
		}
		return {
			days,
			receivedTotal: days.reduce((sum, day) => sum + day.received, 0),
			outgoingTotal: days.reduce((sum, day) => sum + day.outgoing, 0),
			maximum: Math.max(1, ...days.flatMap((day) => [day.received, day.outgoing]))
		};
	}, [snapshot]);
	const auditTransactions = (snapshot?.transactions ?? []).filter((transaction) => (auditAction === "ALL" || transaction.action === auditAction) && (auditStatus === "ALL" || transaction.status === auditStatus));
	const isStockAdjustment = (transaction) => transaction.referenceNumber?.startsWith("ADJUSTMENT-") === true || transaction.notes?.startsWith("Administrator correction") === true || transaction.action === "DAMAGE";
	const selectedAdjustmentReason = selectedAuditTransaction?.reviewNotes?.trim() || (selectedAuditTransaction?.notes?.includes("Reason:") ? selectedAuditTransaction.notes.split("Reason:").slice(1).join("Reason:").trim() : "No reason recorded.");
	function exportAuditHistory() {
		const escape = (value) => `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
		const rows = [[
			"Transaction ID",
			"Date",
			"Action",
			"Product",
			"Quantity",
			"Source",
			"Destination",
			"Status",
			"Created by",
			"Approved by",
			"Reference",
			"Notes",
			"Review notes"
		], ...auditTransactions.map((transaction) => [
			transaction.id,
			transaction.createdAt,
			transaction.action,
			transaction.product.name,
			transaction.quantity,
			transaction.sourceLocation?.name ?? "",
			transaction.destinationLocation?.name ?? "",
			transaction.status,
			transaction.createdBy?.displayName ?? "",
			transaction.approvedBy?.displayName ?? "",
			transaction.referenceNumber ?? "",
			transaction.notes ?? "",
			transaction.reviewNotes ?? ""
		])];
		const blob = new Blob([rows.map((row) => row.map(escape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `inventory-audit-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	}
	async function handleCancelManagerTransaction(transaction) {
		if (!window.confirm(`Cancel TX-${transaction.id.slice(0, 8).toUpperCase()} (${transaction.action} ${transaction.quantity} ${transaction.product.name})? No stock has changed yet, and the record will be marked as cancelled.`)) return;
		setCancellingTransactionId(transaction.id);
		setManagerMessage("");
		try {
			await cancelInventoryTransaction(transaction.id);
			setSnapshot(await fetchInventorySnapshot());
			setManagerMessage(`TX-${transaction.id.slice(0, 8).toUpperCase()} was cancelled. No stock was changed.`);
		} catch {
			setManagerMessage("The transaction could not be cancelled. Refresh and try again.");
		} finally {
			setCancellingTransactionId(null);
		}
	}
	async function reviewTransaction(transaction, decision) {
		const damageAdjustmentReason = damageAdjustmentReasons[transaction.id]?.trim() ?? "";
		if (transaction.action === "DAMAGE" && decision === "recount") {
			setManagerMessage("Damage transactions cannot be sent for recount. Approve with an adjustment reason or reject the transaction.");
			return;
		}
		if (transaction.action === "DAMAGE" && decision === "approve" && !damageAdjustmentReason) {
			setManagerMessage("Enter an adjustment reason before approving damaged stock.");
			return;
		}
		setReviewingId(transaction.id);
		setManagerMessage("");
		try {
			if (decision === "approve") {
				await approveInventoryTransaction(transaction.id, transaction.action === "DAMAGE" ? damageAdjustmentReason : "Approved after manager review.");
				if (transaction.action === "DAMAGE") setDamageAdjustmentReasons((current) => {
					const next = { ...current };
					delete next[transaction.id];
					return next;
				});
				setManagerMessage("Transaction approved and the validated stock adjustment was posted.");
			} else if (decision === "reject") {
				await rejectInventoryTransaction(transaction.id, "Rejected by the inventory manager.");
				setManagerMessage("Transaction rejected. No inventory stock was changed.");
			} else {
				await requestInventoryRecount(transaction.id, "A new physical count is required.");
				setManagerMessage("Recount requested. No inventory stock was changed.");
			}
			setSnapshot(await fetchInventorySnapshot());
		} catch (error) {
			setManagerMessage(error instanceof Error ? error.message : "The manager decision could not be completed. Refresh the inventory data and try again.");
		} finally {
			setReviewingId(null);
		}
	}
	async function savePlannedTask(event) {
		event.preventDefault();
		setTaskMessage("");
		const form = event.currentTarget;
		const data = new FormData(form);
		try {
			const taskInput = {
				type: plannedTaskType,
				priority: String(data.get("priority")),
				title: String(data.get("title")),
				description: String(data.get("description") ?? "") || void 0,
				dueAt: String(data.get("dueAt") ?? "") || void 0,
				assignedToId: String(data.get("assignedToId")),
				productId: plannedProductId || void 0,
				locationId: plannedTaskType === "TRANSFER" ? void 0 : plannedLocationId || void 0,
				quantity: plannedTaskType === "TRANSFER" ? transferQuantity : void 0,
				sourceLocationId: plannedTaskType === "TRANSFER" ? plannedTransferSourceId : void 0,
				destinationLocationId: plannedTaskType === "TRANSFER" ? plannedTransferDestinationId : void 0
			};
			if (plannedTaskType === "CYCLE_COUNT") {
				if (!plannedCycleLocationIds.length) throw new Error("Select at least one stocked location for the cycle count.");
				await Promise.all(plannedCycleLocationIds.map((locationId) => createInventoryTask({
					...taskInput,
					locationId
				})));
			} else await createInventoryTask(taskInput);
			setTaskMessage(plannedTaskType === "CYCLE_COUNT" ? `${plannedCycleLocationIds.length} cycle count task${plannedCycleLocationIds.length === 1 ? "" : "s"} assigned successfully.` : "Task assigned successfully and added to the Warehouse Executive queue.");
			setTaskMessageTone("info");
			form.reset();
			setTaskDueValue(defaultTaskDue());
			setPlannedTaskType("RECEIVE");
			setPlannedProductId("");
			setPlannedLocationId("");
			setPlannedCycleLocationIds([]);
			setPlannedTransferQuantity("");
			setPlannedTransferSourceId("");
			setPlannedTransferDestinationId("");
			setManagerTasks(await fetchInventoryTasks());
		} catch (error) {
			setTaskMessageTone("error");
			setTaskMessage(error instanceof Error ? error.message : "Task could not be assigned.");
		}
	}
	async function handleCancelTask(task) {
		if (!window.confirm(`Cancel “${task.title}”? The linked pending transaction will be cancelled without changing inventory. The audit record will be kept.`)) return;
		setDeletingTaskId(task.id);
		setTaskMessage("");
		try {
			await deleteInventoryTask(task.id);
			setManagerTasks((await fetchInventoryTasks()).filter((entry) => entry.status !== "CANCELLED"));
			setTaskMessageTone("info");
			setTaskMessage("Task cancelled. No inventory changed; the audit record was kept as CANCELLED.");
		} catch (error) {
			setTaskMessageTone("error");
			setTaskMessage(error instanceof Error ? error.message : "The task could not be cancelled.");
		} finally {
			setDeletingTaskId(null);
		}
	}
	async function scheduleLocationCycleCounts(event) {
		event.preventDefault();
		setTaskMessage("");
		setSchedulingTasks(true);
		const data = new FormData(event.currentTarget);
		const assigneeId = String(data.get("schedAssigneeId") ?? "");
		const dueAt = String(data.get("schedDueAt") ?? "");
		const priority = String(data.get("schedPriority") ?? "MEDIUM");
		const instructions = String(data.get("schedInstructions") ?? "").trim() || void 0;
		if (scheduledLocationIds.length === 0 || cycleCountPlanPreview.tasks === 0) {
			setTaskMessageTone("error");
			setTaskMessage(snapshot && scheduledLocationIds.length > 0 ? "No products with stock were found at the selected locations." : "Stock data could not be loaded. Refresh the page and try again.");
			setSchedulingTasks(false);
			return;
		}
		try {
			const result = await createCycleCountPlan({
				periodMonth: cycleCountPeriod,
				locationIds: scheduledLocationIds,
				assignedToId: assigneeId,
				priority,
				dueAt: dueAt || void 0,
				blindCount: blindCycleCount,
				instructions
			});
			setTaskMessageTone("info");
			setTaskMessage(result.idempotent ? `${result.planNumber}: this exact plan already exists — no duplicate tasks were created.` : `${result.planNumber}: scheduled ${result.createdTasks} separate count task${result.createdTasks === 1 ? "" : "s"} across ${result.selectedLocations} location${result.selectedLocations === 1 ? "" : "s"}.${result.skippedDuplicates ? ` Skipped ${result.skippedDuplicates} duplicate task${result.skippedDuplicates === 1 ? "" : "s"} for this period.` : ""}`);
			setScheduledLocationIds([]);
			setCycleCountAssigneeId("");
			setCycleCountInstructions("");
			const [tasks, plans] = await Promise.all([fetchInventoryTasks(), fetchCycleCountPlans()]);
			setManagerTasks(tasks);
			setCycleCountPlans(plans);
			setOpenPlanId(result.id);
			setOpenPlanDetail(null);
			window.scrollTo({
				top: document.getElementById("manager-cycle-count-plans")?.offsetTop ?? 0,
				behavior: "smooth"
			});
		} catch (error) {
			setTaskMessageTone("error");
			setTaskMessage(error instanceof Error ? error.message : "Cycle counts could not be scheduled.");
		} finally {
			setSchedulingTasks(false);
		}
	}
	async function openCycleCountPlan(planId) {
		if (openPlanId === planId && openPlanDetail) {
			setOpenPlanId(null);
			setOpenPlanDetail(null);
			return;
		}
		setOpenPlanId(planId);
		setLoadingPlanDetail(true);
		try {
			setOpenPlanDetail(await fetchCycleCountPlan(planId));
		} catch {
			setOpenPlanDetail(null);
		} finally {
			setLoadingPlanDetail(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "dashboard-content page-dashboard manager-dashboard",
		"data-active-page": page,
		children: [
			page === "Discrepancies" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiscrepanciesPage, {}),
			snapshotError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				role: "alert",
				className: "mb-5 flex flex-col gap-3 rounded-2xl border border-[#f0b8b8] bg-[#fff3f3] px-5 py-4 text-sm font-semibold text-[#9f3030] sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: snapshotError }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: retryLiveData,
					className: "w-fit rounded-xl bg-[#b63b3b] px-4 py-2 text-xs font-extrabold text-white",
					children: "Retry live data"
				})]
			}),
			auxiliaryWarning && !snapshotError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				role: "status",
				className: "mb-5 rounded-2xl border border-[#ead59d] bg-[#fff9e9] px-5 py-3 text-sm font-semibold text-[#8b6008]",
				children: auxiliaryWarning
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				id: "manager-overview-hero",
				className: "manager-command-hero hero-3d relative overflow-hidden rounded-[26px] border border-[#d9e6f8] p-6 text-white sm:p-7",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative grid items-center gap-6 lg:grid-cols-[1fr_320px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#bcd2ff]",
							children: "AI warehouse command"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-2 max-w-2xl text-[25px] font-black tracking-[-0.035em] sm:text-[32px]",
							children: "Live inventory control, made visual."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#c8d9f7]",
							children: "Monitor stock, review exceptions and keep warehouse work moving from one clear workspace."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "command-chip",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "command-chip-dot" }), " Live stock"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "command-chip",
									children: "AI assisted"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "command-chip",
									children: "Audit protected"
								})
							]
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "manager-warehouse-visual",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WarehouseHero, {
							variant: "manager",
							className: "h-44 w-full"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "manager-live-panel",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "manager-live-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: snapshotLoading ? "…" : snapshot ? snapshot.products.length : "—" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: snapshot ? "products monitored" : "live data unavailable" })] })]
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				id: "manager-overview-metrics",
				className: "grid gap-5 sm:grid-cols-2 xl:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
						label: "Active items",
						value: snapshotLoading ? "…" : snapshot ? String(snapshot.products.length) : "—",
						detail: snapshot ? "Loaded from PostgreSQL" : "Live inventory unavailable",
						icon: Boxes,
						onClick: () => {
							onNavigate("Catalog");
							window.scrollTo({
								top: 0,
								behavior: "smooth"
							});
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
						label: "Pending approvals",
						value: snapshotLoading ? "…" : snapshot ? String(pendingApprovals) : "—",
						detail: snapshot ? "Warehouse Executive-confirmed transactions requiring review" : "Live transactions unavailable",
						icon: ClipboardCheck,
						tone: "amber",
						onClick: () => navigateToTransactions("needsReview")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
						label: "Low-stock items",
						value: snapshotLoading ? "…" : snapshot ? String(displayedLowStock.length) : "—",
						detail: snapshot ? "Calculated from safety levels" : "Live stock levels unavailable",
						icon: TriangleAlert,
						tone: "violet",
						onClick: () => {
							onNavigate("Purchase Items");
							window.scrollTo({
								top: 0,
								behavior: "smooth"
							});
						}
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "manager-overview-health",
				className: "mt-6 overflow-hidden rounded-[24px] border border-[#d8e5f7] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.055)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2 border-b border-[#e9eef5] px-6 py-6 sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]",
							children: "Inventory health"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-1 text-lg font-extrabold text-[#102a56]",
							children: "Live stock overview at a glance"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-[#8294ac]",
							children: "Availability across every product and warehouse location, refreshed from live balances."
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: `inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[10px] font-extrabold ${snapshot ? "bg-[#eaf8f1] text-[#16865b]" : "bg-[#fff0f0] text-[#a73737]"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-2 w-2 rounded-full ${snapshot ? "animate-pulse bg-[#20ad76]" : "bg-[#d95c5c]"}` }), snapshotLoading ? "Loading" : snapshot ? "Live data" : "Data unavailable"]
					})]
				}), !snapshot ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "px-6 py-12 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
							size: 28,
							className: "mx-auto text-[#c04a4a]"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm font-extrabold text-[#24466f]",
							children: "Live stock data is unavailable"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-[#8093ab]",
							children: "The dashboard will not display false zero balances. Start or reconnect the API and PostgreSQL services."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: retryLiveData,
							className: "mt-4 rounded-xl bg-[#155eef] px-4 py-2.5 text-xs font-extrabold text-white",
							children: "Retry live data"
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-6 p-6 lg:grid-cols-[auto_1fr_1.1fr]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col items-center justify-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
									viewBox: "0 0 140 140",
									className: "h-36 w-36 -rotate-90",
									role: "img",
									"aria-label": `${stockHealth.healthyPct}% of stock assignments are healthy`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
											id: "healthRing",
											x1: "0%",
											y1: "0%",
											x2: "100%",
											y2: "100%",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
												offset: "0%",
												stopColor: "#16865b"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
												offset: "100%",
												stopColor: "#2fa97c"
											})]
										}) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
											cx: "70",
											cy: "70",
											r: "56",
											fill: "none",
											stroke: "#e9eef6",
											strokeWidth: "13"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
											cx: "70",
											cy: "70",
											r: "56",
											fill: "none",
											stroke: "url(#healthRing)",
											strokeWidth: "13",
											strokeLinecap: "round",
											strokeDasharray: 2 * Math.PI * 56,
											strokeDashoffset: healthMounted ? 2 * Math.PI * 56 * (1 - stockHealth.healthyPct / 100) : 2 * Math.PI * 56,
											style: { transition: "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)" }
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute inset-0 grid place-items-center text-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-3xl font-black tracking-[-0.04em] text-[#17345f]",
										children: [stockHealth.healthyPct, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-base text-[#8295af]",
											children: "%"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-0.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#8295af]",
										children: "Healthy stock"
									})] })
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "max-w-44 text-center text-[11px] font-semibold leading-4 text-[#8294ac]",
								children: [stockHealth.total, " stock assignments across the warehouse"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col justify-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between text-xs font-extrabold text-[#49617f]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Stock status breakdown" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [stockHealth.total, " assignments"] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex h-3.5 overflow-hidden rounded-full bg-[#eef2f7]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											style: {
												width: `${stockHealth.total ? stockHealth.critical / stockHealth.total * 100 : 0}%`,
												transition: "width 1s ease .2s"
											},
											className: "bg-[#e05252]"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											style: {
												width: `${stockHealth.total ? stockHealth.low / stockHealth.total * 100 : 0}%`,
												transition: "width 1s ease .35s"
											},
											className: "bg-[#e8a23d]"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											style: {
												width: `${stockHealth.total ? stockHealth.healthy / stockHealth.total * 100 : 0}%`,
												transition: "width 1s ease .5s"
											},
											className: "bg-[#2aa576]"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-3 grid grid-cols-3 gap-2 text-center",
									children: [
										[
											"Critical",
											stockHealth.critical,
											"bg-[#ffecec] text-[#c04343]"
										],
										[
											"Low",
											stockHealth.low,
											"bg-[#fff4df] text-[#b36d0c]"
										],
										[
											"Healthy",
											stockHealth.healthy,
											"bg-[#eaf8f1] text-[#16865b]"
										]
									].map(([label, count, tone]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `rounded-xl px-3 py-2.5 ${tone}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-lg font-black leading-none",
											children: String(count)
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-[9px] font-extrabold uppercase tracking-wider",
											children: String(label)
										})]
									}, String(label)))
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-semibold leading-5 text-[#8294ac]",
								children: stockHealth.critical > 0 ? `${stockHealth.critical} item${stockHealth.critical === 1 ? "" : "s"} are at or below half their safety level and should be prioritised for reordering.` : "No critical shortages — safety levels are holding across the warehouse."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl border border-[#e2e9f3] bg-[#f8fafc] p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#a46009]",
									children: "Needs attention"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => onNavigate("Purchase Items"),
									className: "rounded-lg border border-[#e0c37e] px-2.5 py-1.5 text-[10px] font-extrabold text-[#915807] transition hover:bg-[#fff4df]",
									children: "View purchase items"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 space-y-3",
								children: [needsAttention.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-dashed border-[#cfe0c0] bg-white px-4 py-6 text-center",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
											size: 22,
											className: "mx-auto text-[#16865b]"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-xs font-extrabold text-[#24466f]",
											children: "All items above safety stock"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-[10px] text-[#8294ac]",
											children: "Replenish as needed — nothing is low right now."
										})
									]
								}), needsAttention.map((item, index) => {
									const ratio = Math.min(1, item.available / Math.max(1, item.safety));
									const critical = item.available <= Math.max(1, Math.floor(item.safety / 2));
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "group rounded-xl border border-[#e4eaf3] bg-white p-3 transition hover:-translate-y-0.5 hover:border-[#c9d8ee] hover:shadow-[0_10px_24px_rgba(16,45,82,0.08)]",
										style: { animation: `dashboard-enter .5s ease ${index * 90}ms both` },
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "truncate text-xs font-extrabold text-[#17345f]",
													children: item.name
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: `shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold ${critical ? "bg-[#ffecec] text-[#c04343]" : "bg-[#fff4df] text-[#b36d0c]"}`,
													children: critical ? "Critical" : "Low"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-0.5 text-[10px] font-bold text-[#7b8fa9]",
												children: [
													item.sku,
													" · ",
													item.available,
													" available / ",
													item.safety,
													" safety"
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef2f7]",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: `h-full rounded-full ${critical ? "bg-[#e05252]" : "bg-[#e8a23d]"}`,
													style: {
														width: `${ratio * 100}%`,
														transition: "width 1s ease"
													}
												})
											})
										]
									}, item.sku);
								})]
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "manager-overview-approvals",
				className: "mt-6 overflow-hidden rounded-[24px] border border-[#e8d5a8] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.055)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 border-b border-[#f0e5cf] px-6 py-6 sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#d47b08]",
							children: "Action required"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-1 text-lg font-extrabold text-[#102a56]",
							children: "Pending approvals"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-[#8294ac]",
							children: "Warehouse Executive-confirmed transactions waiting for your decision."
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: !snapshot,
						onClick: () => navigateToTransactions("needsReview"),
						className: "inline-flex w-fit items-center gap-2 rounded-xl bg-[#d47b08] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_20px_rgba(212,123,8,0.25)] transition hover:bg-[#b86806] disabled:cursor-not-allowed disabled:opacity-50",
						children: [
							"Review all ",
							snapshot ? pendingApprovals : "—",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
								size: 15,
								className: "-rotate-90"
							})
						]
					})]
				}), !snapshot ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "px-6 py-10 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
							size: 26,
							className: "mx-auto text-[#c04a4a]"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm font-extrabold text-[#24466f]",
							children: "Approval data is unavailable"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-[#8093ab]",
							children: "No approval count is shown until live transaction data reconnects."
						})
					]
				}) : pendingReviewTransactions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "px-6 py-10 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
							size: 26,
							className: "mx-auto text-[#16865b]"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm font-extrabold text-[#24466f]",
							children: "No confirmed transactions need review"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-[#8093ab]",
							children: "New items requiring manager review will appear here automatically."
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "divide-y divide-[#edf1f6]",
					children: [pendingReviewTransactions.slice(0, 4).map((transaction) => {
						const title = transaction.action.toLowerCase().replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
						const location = transaction.sourceLocation?.name ?? transaction.destinationLocation?.name ?? "Location unavailable";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3.5 px-6 py-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff4df] text-[#d47b08]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 16 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "truncate text-sm font-extrabold text-[#24466f]",
											children: [
												title,
												" · ",
												transaction.product.name
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1 truncate text-[10px] font-bold uppercase tracking-[0.1em] text-[#8295af]",
											children: [
												"TX-",
												transaction.id.slice(0, 8).toUpperCase(),
												" · ",
												location
											]
										}),
										transaction.reviewReasons && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1.5 rounded-lg bg-[#fff4df] px-2.5 py-1.5 text-xs font-semibold text-[#b36d0c]",
											children: ["Flagged: ", transaction.reviewReasons.split("\n").join(" · ")]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "shrink-0 text-sm font-extrabold text-[#29466f]",
									children: [
										transaction.quantity,
										" ",
										transaction.product.unit
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => navigateToTransactions("needsReview"),
									className: "shrink-0 rounded-lg border border-[#c9d8ee] px-3 py-2 text-[11px] font-extrabold text-[#155eef] transition hover:bg-[#f4f8ff]",
									children: "Review"
								})
							]
						}, transaction.id);
					}), pendingReviewTransactions.length > 4 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => navigateToTransactions("needsReview"),
						className: "w-full px-6 py-3 text-xs font-extrabold text-[#155eef] transition hover:bg-[#f4f8ff]",
						children: [
							"+ ",
							pendingReviewTransactions.length - 4,
							" more pending · open Transactions"
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "manager-task-planning",
				className: "mt-6 scroll-mt-24 rounded-[24px] border border-[#d8e5f7] bg-white p-6 shadow-[0_14px_42px_rgba(16,45,82,0.055)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]",
								children: "Daily work planning"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-1 text-lg font-extrabold text-[#102a56]",
								children: "Assign and schedule Warehouse Executive tasks"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-[#8294ac]",
								children: "Assign receiving, transfers, stock checks, damage inspections, or a one-product cycle count. Use the month-end plan below for monthly and multi-location counts."
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex w-fit items-center gap-2 rounded-full bg-[#eaf8f1] px-3 py-1 text-[10px] font-extrabold text-[#16865b]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 animate-pulse rounded-full bg-[#20ad76]" }), "Queue syncs live"]
						})]
					}),
					taskMessage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						role: "status",
						className: `mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${taskMessageTone === "error" ? "bg-[#fff0f0] text-[#a73737]" : "bg-[#eef6ff] text-[#244f86]"}`,
						children: taskMessage
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: savePlannedTask,
						className: "mt-5 grid gap-4 rounded-2xl border border-[#cbdcf5] bg-[#f7faff] p-5 md:grid-cols-2 xl:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["Task type", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									name: "type",
									required: true,
									value: plannedTaskType,
									onChange: (event) => {
										setPlannedTaskType(event.target.value);
										setPlannedProductId("");
										setPlannedLocationId("");
										setPlannedCycleLocationIds([]);
										setPlannedTransferQuantity("");
										setPlannedTransferSourceId("");
										setPlannedTransferDestinationId("");
									},
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3",
									children: [
										"RECEIVE",
										"PICK",
										"TRANSFER",
										"CYCLE_COUNT",
										"STOCK_VERIFY",
										"DAMAGE_INSPECTION"
									].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value,
										children: value.replaceAll("_", " ")
									}, value))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["Priority", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									name: "priority",
									required: true,
									defaultValue: "MEDIUM",
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3",
									children: [
										"LOW",
										"MEDIUM",
										"HIGH",
										"URGENT"
									].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: value }, value))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["Assign to", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									name: "assignedToId",
									required: true,
									defaultValue: "",
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										disabled: true,
										children: "Select executive"
									}), taskAssignees.map((user) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
										value: user.id,
										children: [
											user.displayName,
											" — ",
											[user.shift, user.warehouseZone].filter(Boolean).join(" · ") || user.employeeId
										]
									}, user.id))]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["Due date and time", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "dueAt",
									type: "datetime-local",
									value: taskDueValue,
									onChange: (event) => setTaskDueValue(event.target.value),
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f] md:col-span-2",
								children: ["Task title", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "title",
									required: true,
									maxLength: 150,
									placeholder: plannedTaskType === "TRANSFER" ? "Move stock to another location" : plannedTaskType === "CYCLE_COUNT" ? "Count product at its storage location" : "Enter a clear task title",
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["Product", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									name: "productId",
									required: plannedTaskType === "TRANSFER" || plannedTaskType === "CYCLE_COUNT",
									value: plannedProductId,
									onChange: (event) => {
										setPlannedProductId(event.target.value);
										setPlannedLocationId("");
										setPlannedCycleLocationIds([]);
										setPlannedTransferQuantity("");
										setPlannedTransferSourceId("");
										setPlannedTransferDestinationId("");
									},
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: plannedTaskType === "TRANSFER" || plannedTaskType === "CYCLE_COUNT" ? "Select product" : "Not required"
									}), snapshot?.products.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
										value: product.id,
										children: [
											product.sku,
											" — ",
											product.name
										]
									}, product.id))]
								})]
							}),
							plannedTaskType === "CYCLE_COUNT" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
								className: "rounded-xl border border-[#cbdcf5] bg-white p-3 md:col-span-2 xl:col-span-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
										className: "px-2 text-xs font-extrabold text-[#49617f]",
										children: "Locations to count"
									}),
									!plannedProductId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "px-2 py-2 text-xs font-semibold text-[#8294ac]",
										children: "Select a product first."
									}) : plannedTaskLocationOptions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "px-2 py-2 text-xs font-semibold text-[#a73737]",
										children: "This product has no available stock location."
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid gap-2 sm:grid-cols-2",
										children: plannedTaskLocationOptions.map((entry) => {
											const selected = plannedCycleLocationIds.includes(entry.location.id);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: `flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition ${selected ? "border-[#7257d6] bg-[#f6f1ff]" : "border-[#e2e9f3] hover:border-[#cbbbed]"}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: selected,
													onChange: () => setPlannedCycleLocationIds((current) => selected ? current.filter((id) => id !== entry.location.id) : [...current, entry.location.id]),
													className: "h-4 w-4 accent-[#7257d6]"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "min-w-0 text-xs font-extrabold text-[#29466f]",
													children: [
														entry.location.code,
														" — ",
														entry.location.name,
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "block text-[10px] font-semibold text-[#8294ac]",
															children: [
																entry.available,
																" ",
																entry.unit,
																" available"
															]
														})
													]
												})]
											}, entry.location.id);
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 px-2 text-[10px] font-semibold text-[#8294ac]",
										children: "A separate task is created for each selected location."
									})
								]
							}) : plannedTaskType !== "TRANSFER" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f]",
								children: ["Location", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									name: "locationId",
									required: Boolean(plannedProductId),
									value: plannedLocationId,
									onChange: (event) => setPlannedLocationId(event.target.value),
									disabled: !plannedProductId,
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 disabled:cursor-not-allowed disabled:bg-[#eef2f7]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: !plannedProductId ? "Select product first" : plannedTaskLocationOptions.length === 0 ? "No location has available stock" : plannedTaskType === "RECEIVE" ? "Select destination location" : "Select stocked location"
									}), plannedTaskLocationOptions.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
										value: entry.location.id,
										children: [
											entry.location.code,
											" — ",
											entry.location.name,
											" — ",
											entry.available,
											" ",
											entry.unit,
											" available"
										]
									}, entry.location.id))]
								})]
							}),
							plannedTaskType === "TRANSFER" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-xs font-extrabold text-[#49617f]",
									children: ["Transfer quantity", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "quantity",
										type: "number",
										min: 1,
										max: selectedTransferSourceBalance ? selectedTransferSourceBalance.quantity : void 0,
										required: true,
										value: plannedTransferQuantity,
										onChange: (event) => setPlannedTransferQuantity(event.target.value),
										disabled: !plannedTransferSourceId,
										placeholder: plannedTransferSourceId ? "Enter quantity" : "Select pick-from location first",
										className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 disabled:cursor-not-allowed disabled:bg-[#eef2f7]"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-xs font-extrabold text-[#49617f]",
									children: ["Pick from", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										name: "sourceLocationId",
										required: true,
										value: plannedTransferSourceId,
										onChange: (event) => {
											setPlannedTransferSourceId(event.target.value);
											setPlannedTransferDestinationId("");
											setPlannedTransferQuantity("");
										},
										disabled: !plannedProductId,
										className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 disabled:cursor-not-allowed disabled:bg-[#eef2f7]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: plannedProductId ? transferSourceBalances.length ? "Select stock location" : "No location has available stock" : "Select product first"
										}), transferSourceBalances.map((balance) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
											value: balance.location.id,
											children: [
												balance.location.code,
												" — ",
												balance.location.name,
												" — ",
												balance.quantity,
												" ",
												balance.product.unit,
												" available"
											]
										}, balance.location.id))]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-xs font-extrabold text-[#49617f]",
									children: ["Transfer to", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										name: "destinationLocationId",
										required: true,
										value: plannedTransferDestinationId,
										onChange: (event) => setPlannedTransferDestinationId(event.target.value),
										disabled: !plannedTransferSourceId,
										className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3 disabled:cursor-not-allowed disabled:bg-[#eef2f7]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: plannedTransferSourceId ? "Select destination" : "Select pick-from location first"
										}), snapshot?.locations.filter((location) => location.id !== plannedTransferSourceId).map((location) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
											value: location.id,
											children: [
												location.code,
												" — ",
												location.name
											]
										}, location.id))]
									})]
								}),
								selectedTransferSourceBalance && plannedTransferDestinationId && transferQuantity > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-[#bcd4f8] bg-white p-3 text-xs font-semibold text-[#49617f] md:col-span-2 xl:col-span-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-extrabold text-[#17345f]",
										children: "Transfer preview — total inventory stays the same"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2 grid gap-2 sm:grid-cols-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
												"Pick from: ",
												selectedTransferSourceBalance.location.name,
												" ",
												selectedTransferSourceBalance.quantity,
												" → ",
												selectedTransferSourceBalance.quantity - transferQuantity
											] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
												"Transfer to: ",
												snapshot?.locations.find((location) => location.id === plannedTransferDestinationId)?.name,
												" ",
												selectedTransferDestinationBalance?.quantity ?? 0,
												" → ",
												(selectedTransferDestinationBalance?.quantity ?? 0) + transferQuantity
											] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
												"Move: ",
												transferQuantity,
												" ",
												selectedTransferProduct?.unit ?? "unit"
											] })
										]
									})]
								})
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-xs font-extrabold text-[#49617f] md:col-span-2 xl:col-span-3",
								children: ["Instructions", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "description",
									maxLength: 500,
									placeholder: "Clear instructions for the executive",
									className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-end",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									disabled: !taskAssignees.length,
									className: "h-11 rounded-xl bg-[#155eef] px-5 text-sm font-extrabold text-white disabled:opacity-50",
									children: "Assign task"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: scheduleLocationCycleCounts,
						className: "mt-4 rounded-2xl border border-[#e0cbf5] bg-[#faf6ff] p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7257d6]",
										children: "Month-end cycle count"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "mt-1 text-sm font-extrabold text-[#17345f]",
										children: "Schedule the monthly multi-location count plan"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-xs text-[#8294ac]",
										children: "Use this section at month end. Choose one or more locations and the system creates a separate count task for every stocked item."
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-fit rounded-full bg-[#f2efff] px-3 py-1 text-[10px] font-extrabold text-[#6349c1]",
									children: "CYCLE_COUNT"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
								className: "mt-4 rounded-xl border border-[#d9c9f0] bg-white p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
										className: "px-2 text-xs font-extrabold text-[#49617f]",
										children: "Locations to count"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid gap-2 sm:grid-cols-2 lg:grid-cols-3",
										children: snapshot?.locations.map((location) => {
											const stockedItems = snapshot.balances.filter((balance) => balance.location.id === location.id && balance.quantity > 0).length;
											const selected = scheduledLocationIds.includes(location.id);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: `flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${selected ? "border-[#7257d6] bg-[#f6f1ff]" : "border-[#e2e9f3] hover:border-[#cbbbed]"}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: selected,
													onChange: () => setScheduledLocationIds((current) => selected ? current.filter((id) => id !== location.id) : [...current, location.id]),
													className: "h-4 w-4 accent-[#7257d6]"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "min-w-0",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "block text-xs font-extrabold text-[#29466f]",
														children: [
															location.code,
															" — ",
															location.name
														]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-[10px] font-semibold text-[#8294ac]",
														children: [
															stockedItems,
															" stocked item",
															stockedItems === 1 ? "" : "s"
														]
													})]
												})]
											}, location.id);
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 flex flex-wrap items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setScheduledLocationIds(snapshot?.locations.filter((location) => snapshot.balances.some((balance) => balance.location.id === location.id && balance.quantity > 0)).map((location) => location.id) ?? []),
												className: "rounded-lg border border-[#d9c9f0] px-3 py-1.5 text-[10px] font-extrabold text-[#6349c1]",
												children: "Select all stocked locations"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setScheduledLocationIds([]),
												className: "rounded-lg border border-[#e2e9f3] px-3 py-1.5 text-[10px] font-extrabold text-[#7186a3]",
												children: "Clear"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: `ml-auto rounded-full px-3 py-1 text-[10px] font-extrabold ${scheduledLocationIds.length > 0 ? "bg-[#f2efff] text-[#6349c1]" : "bg-[#eef2f7] text-[#7b8fa9]"}`,
												children: [
													scheduledLocationIds.length,
													" location",
													scheduledLocationIds.length === 1 ? "" : "s",
													" selected"
												]
											})
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "text-xs font-extrabold text-[#49617f]",
										children: [
											"Count period",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												name: "schedPeriod",
												type: "month",
												required: true,
												value: cycleCountPeriod,
												onChange: (event) => {
													setCycleCountPeriod(event.target.value);
													setCycleCountDueValue(monthEndDueValue(event.target.value));
												},
												className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mt-1 block text-[10px] font-semibold text-[#8294ac]",
												children: "Select the month being physically verified."
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "text-xs font-extrabold text-[#49617f]",
										children: ["Assign to", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											name: "schedAssigneeId",
											required: true,
											value: cycleCountAssigneeId,
											onChange: (event) => setCycleCountAssigneeId(event.target.value),
											className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "",
												disabled: true,
												children: "Select executive"
											}), taskAssignees.map((user) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
												value: user.id,
												children: [
													user.displayName,
													" — ",
													[user.shift, user.warehouseZone].filter(Boolean).join(" · ") || user.employeeId
												]
											}, user.id))]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "text-xs font-extrabold text-[#49617f]",
										children: [
											"Due date and time",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												name: "schedDueAt",
												type: "datetime-local",
												required: true,
												value: cycleCountDueValue,
												min: `${cycleCountPeriod}-01T00:00`,
												max: monthEndDueValue(cycleCountPeriod).replace("T17:00", "T23:59"),
												onChange: (event) => setCycleCountDueValue(event.target.value),
												className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mt-1 block text-[10px] font-semibold text-[#8294ac]",
												children: "Must be within the selected month."
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "text-xs font-extrabold text-[#49617f]",
										children: ["Priority", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
											name: "schedPriority",
											defaultValue: "MEDIUM",
											className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3",
											children: [
												"LOW",
												"MEDIUM",
												"HIGH",
												"URGENT"
											].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: value }, value))
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex h-11 items-center gap-3 self-end rounded-xl border border-[#d9c9f0] bg-white px-3 text-xs font-extrabold text-[#49617f]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: blindCycleCount,
											onChange: (event) => setBlindCycleCount(event.target.checked),
											className: "h-4 w-4 accent-[#7257d6]"
										}), " Blind count"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "text-xs font-extrabold text-[#49617f] xl:col-span-2",
										children: ["Instructions", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											name: "schedInstructions",
											value: cycleCountInstructions,
											onChange: (event) => setCycleCountInstructions(event.target.value),
											maxLength: 1e3,
											placeholder: "Optional instructions for the executive",
											className: "mt-2 h-11 w-full rounded-xl border border-[#d5e1f0] bg-white px-3"
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 rounded-xl border border-[#e0cbf5] bg-white p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-extrabold uppercase tracking-wider text-[#8a7bb0]",
									children: "Plan preview"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] font-extrabold uppercase tracking-wider text-[#8a7bb0]",
											children: "Period"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm font-black text-[#3f3470]",
											children: formatCountPeriod(cycleCountPeriod) || cycleCountPeriod
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] font-extrabold uppercase tracking-wider text-[#8a7bb0]",
											children: "Locations"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm font-black text-[#3f3470]",
											children: cycleCountPlanPreview.locations
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] font-extrabold uppercase tracking-wider text-[#8a7bb0]",
											children: "Different items"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm font-black text-[#3f3470]",
											children: cycleCountPlanPreview.items
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] font-extrabold uppercase tracking-wider text-[#8a7bb0]",
											children: "Tasks generated"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm font-black text-[#3f3470]",
											children: cycleCountPlanPreview.tasks
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] font-extrabold uppercase tracking-wider text-[#8a7bb0]",
											children: "Assigned executive"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm font-black text-[#3f3470]",
											children: taskAssignees.find((user) => user.id === cycleCountAssigneeId)?.displayName ?? "Not selected"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] font-extrabold uppercase tracking-wider text-[#8a7bb0]",
											children: "Due date"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm font-black text-[#3f3470]",
											children: cycleCountDueValue ? new Intl.DateTimeFormat("en", {
												day: "2-digit",
												month: "short",
												hour: "2-digit",
												minute: "2-digit"
											}).format(new Date(cycleCountDueValue)) : "Not set"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] font-extrabold uppercase tracking-wider text-[#8a7bb0]",
											children: "Blind count"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm font-black text-[#3f3470]",
											children: blindCycleCount ? "Yes — system quantity hidden" : "No"
										})] })
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8a7bb0]",
										children: ["Selected period: ", cycleCountPeriod]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setCycleCountDueValue(monthEndDueValue(cycleCountPeriod)),
										className: "rounded-lg border border-[#d9c9f0] bg-white px-3 py-2 text-[11px] font-extrabold text-[#6349c1] transition hover:bg-[#f2efff]",
										children: "Use month-end 5:00 PM"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										disabled: !taskAssignees.length || schedulingTasks || cycleCountPlanPreview.tasks === 0,
										className: "ml-auto h-11 rounded-xl bg-[#7257d6] px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(114,87,214,0.2)] disabled:cursor-wait disabled:opacity-50",
										children: schedulingTasks ? "Scheduling…" : `Schedule ${cycleCountPlanPreview.tasks} count tasks`
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						id: "manager-cycle-count-plans",
						className: "mt-6 scroll-mt-24 rounded-2xl border border-[#e0cbf5] bg-white p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7257d6]",
									children: "Month-End Cycle Count"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "mt-1 text-sm font-extrabold text-[#17345f]",
									children: "Cycle Count Plans"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-[#8294ac]",
									children: "Every generated multi-location count plan with live task and discrepancy status. Open a plan to see each task."
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "w-fit rounded-full bg-[#f2efff] px-3 py-1 text-[10px] font-extrabold text-[#6349c1]",
								children: [
									cycleCountPlans.length,
									" plan",
									cycleCountPlans.length === 1 ? "" : "s"
								]
							})]
						}), cycleCountPlans.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 rounded-xl border border-dashed border-[#d9c9f0] bg-[#faf7ff] px-5 py-8 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardCheck, {
									size: 22,
									className: "mx-auto text-[#a89ad6]"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm font-extrabold text-[#24466f]",
									children: "No cycle count plans yet"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-[#8294ac]",
									children: "Scheduled plans appear here with their task progress."
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 overflow-x-auto",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "min-w-full text-left",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
									className: "bg-[#faf6ff] text-[10px] uppercase tracking-[0.12em] text-[#8a7bb0]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [[
										"Plan",
										"Period",
										"Locations",
										"Assigned worker",
										"Total",
										"Open",
										"Completed",
										"Discrepancies",
										"Status",
										"Due date"
									].map((heading) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "whitespace-nowrap px-4 py-3 font-extrabold",
										children: heading
									}, heading)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-4 py-3" })] })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
									className: "divide-y divide-[#f0ebfb] text-xs",
									children: cycleCountPlans.map((plan) => {
										const open = openPlanId === plan.id;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
											className: "transition hover:bg-[#faf7ff]",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "whitespace-nowrap px-4 py-3.5 font-extrabold text-[#6349c1]",
													children: plan.planNumber
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "whitespace-nowrap px-4 py-3.5 font-bold text-[#29466f]",
													children: formatCountPeriod(plan.periodMonth)
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "whitespace-nowrap px-4 py-3.5 text-[#6c829f]",
													children: (plan.locations ?? []).map((location) => location.name).join(", ") || "—"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "whitespace-nowrap px-4 py-3.5 font-bold text-[#496482]",
													children: plan.assignedTo?.displayName ?? "—"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "whitespace-nowrap px-4 py-3.5 font-extrabold text-[#3f3470]",
													children: plan.totalTasks ?? 0
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "whitespace-nowrap px-4 py-3.5 font-bold text-[#155eef]",
													children: plan.openTasks ?? 0
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "whitespace-nowrap px-4 py-3.5 font-bold text-[#16865b]",
													children: plan.completedTasks ?? 0
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "whitespace-nowrap px-4 py-3.5",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: `rounded-full px-2.5 py-1 text-[10px] font-extrabold ${(plan.discrepancyCount ?? 0) > 0 ? "bg-[#fff1e3] text-[#c56c08]" : "bg-[#eef2f7] text-[#7b8fa9]"}`,
														children: plan.discrepancyCount ?? 0
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "whitespace-nowrap px-4 py-3.5",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: `rounded-full px-2.5 py-1 text-[10px] font-extrabold ${plan.status === "COMPLETED" ? "bg-[#eaf8f1] text-[#16865b]" : plan.status === "IN_PROGRESS" ? "bg-[#f2efff] text-[#6349c1]" : plan.status === "CANCELLED" ? "bg-[#eef2f7] text-[#7b8fa9]" : "bg-[#edf4ff] text-[#155eef]"}`,
														children: (plan.status ?? "OPEN").replaceAll("_", " ")
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "whitespace-nowrap px-4 py-3.5 text-[#6c829f]",
													children: plan.dueAt ? new Intl.DateTimeFormat("en", {
														day: "2-digit",
														month: "short",
														hour: "2-digit",
														minute: "2-digit"
													}).format(new Date(plan.dueAt)) : "—"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "whitespace-nowrap px-4 py-3.5",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: () => void openCycleCountPlan(plan.id),
														disabled: loadingPlanDetail && open,
														className: "rounded-lg border border-[#d9c9f0] bg-white px-3 py-1.5 text-[10px] font-extrabold text-[#6349c1] transition hover:bg-[#f2efff] disabled:opacity-50",
														children: loadingPlanDetail && open ? "Loading…" : open ? "Hide tasks" : "View tasks"
													})
												})
											]
										}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											colSpan: 11,
											className: "bg-[#faf7ff] px-4 py-4",
											children: loadingPlanDetail && !openPlanDetail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "px-3 py-6 text-center text-xs font-semibold text-[#8a7bb0]",
												children: "Loading plan tasks…"
											}) : openPlanDetail && openPlanDetail.id === plan.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlanTaskList, { plan: openPlanDetail }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "px-3 py-6 text-center text-xs font-semibold text-[#a73737]",
												children: "The plan tasks could not be loaded. Try again."
											})
										}) })] }, plan.id);
									})
								})]
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#155eef]",
									children: "Live workload"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "mt-1 text-sm font-extrabold text-[#17345f]",
									children: "Warehouse Executives working now"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs font-bold text-[#8295af]",
									children: [managerExecutives.reduce((sum, exec) => sum + exec.inProgress, 0), " in progress now"]
								})]
							}),
							managerExecutives.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 rounded-2xl border border-dashed border-[#d5e1f0] bg-[#fbfcfe] px-5 py-8 text-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-extrabold text-[#24466f]",
									children: "No executive work assigned yet"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-[#8294ac]",
									children: "Assign a task above and the executive's live workload appears here."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3",
								children: managerExecutives.map((exec) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
									className: "rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: `grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-extrabold ${exec.inProgress > 0 ? "bg-[#f2efff] text-[#6349c1]" : "bg-[#edf4ff] text-[#155eef]"}`,
													children: exec.assignee.displayName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm font-extrabold text-[#17345f]",
													children: exec.assignee.displayName
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-[11px] font-semibold text-[#8294ac]",
													children: [
														exec.open,
														" open · ",
														exec.inProgress,
														" in progress · ",
														exec.completed,
														" done"
													]
												})] })]
											}), exec.inProgress > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "inline-flex items-center gap-1.5 rounded-full bg-[#f2efff] px-2.5 py-1 text-[10px] font-extrabold text-[#6349c1]",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 animate-pulse rounded-full bg-[#7257d6]" }), "Working"]
											})]
										}),
										exec.currentTask && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-3 rounded-xl border border-[#e0cbf5] bg-[#faf6ff] px-3 py-2.5",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[9px] font-extrabold uppercase tracking-wider text-[#8a7bb0]",
													children: "Currently on"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-0.5 truncate text-xs font-extrabold text-[#3f3470]",
													children: exec.currentTask.title
												}),
												exec.currentTask.startedAt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "mt-0.5 text-[10px] font-semibold text-[#8379aa]",
													children: ["Started ", formatClock(exec.currentTask.startedAt)]
												}),
												exec.inProgress > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "mt-1 w-fit rounded-full bg-[#e9e1fb] px-2 py-0.5 text-[9px] font-extrabold text-[#6349c1]",
													children: [
														"+",
														exec.inProgress - 1,
														" more in progress"
													]
												})
											]
										}),
										exec.open === 0 && exec.inProgress === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-3 text-[11px] font-semibold text-[#8a9bb1]",
											children: exec.completed > 0 ? `${exec.completed} task${exec.completed === 1 ? "" : "s"} completed` : "Waiting for assignments."
										})
									]
								}, exec.assignee.id))
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									"aria-pressed": managerTaskView === "OPEN",
									onClick: () => setManagerTaskView("OPEN"),
									className: `rounded-xl px-4 py-2 text-xs font-extrabold ${managerTaskView === "OPEN" ? "bg-[#155eef] text-white shadow-[0_8px_20px_rgba(21,94,239,0.2)]" : "border border-[#dce5f1] bg-white text-[#7186a3]"}`,
									children: [
										"Open (",
										openTaskCount,
										")"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									"aria-pressed": managerTaskView === "COMPLETED",
									onClick: () => setManagerTaskView("COMPLETED"),
									className: `rounded-xl px-4 py-2 text-xs font-extrabold ${managerTaskView === "COMPLETED" ? "bg-[#16865b] text-white shadow-[0_8px_20px_rgba(22,134,91,0.2)]" : "border border-[#dce5f1] bg-white text-[#7186a3]"}`,
									children: [
										"Completed (",
										completedTaskCount,
										")"
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs font-bold text-[#8295af]",
								children: [
									openTaskCount,
									" open · ",
									completedTaskCount,
									" completed"
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 grid gap-3 md:grid-cols-2",
							children: [displayedManagerTasks.map((task) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start justify-between gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-wrap items-center gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "truncate font-extrabold text-[#17345f]",
														children: task.title
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "rounded-full bg-[#f2efff] px-2 py-0.5 text-[9px] font-extrabold text-[#6349c1]",
														children: taskTypeLabel(task.type)
													}),
													task.cycleCountPlan && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "rounded-full bg-[#e9f7ff] px-2 py-0.5 text-[9px] font-extrabold text-[#0e7490]",
														children: [
															task.cycleCountPlan.planNumber,
															" · ",
															task.cycleCountPlan.tasks?.filter((entry) => entry.status === "COMPLETED").length ?? 0,
															"/",
															task.cycleCountPlan.tasks?.length ?? 0
														]
													})
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-1 text-xs text-[#7b8fa9]",
												children: [
													task.assignedTo?.displayName ?? "Unassigned",
													" · ",
													task.type === "TRANSFER" ? `${task.quantity ?? 0} ${task.product?.unit ?? "unit"} · ${task.sourceLocation?.name ?? "Source missing"} → ${task.destinationLocation?.name ?? "Destination missing"}` : `${task.location?.name ?? "Any location"}${task.product ? ` · ${task.product.name}` : ""}`
												]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex shrink-0 items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: `inline-flex h-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${taskStatusTone(task.status)}`,
												children: [task.status === "IN_PROGRESS" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 animate-pulse rounded-full bg-[#7257d6]" }), task.status.replaceAll("_", " ")]
											}), (task.status === "OPEN" || task.status === "IN_PROGRESS") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												disabled: deletingTaskId === task.id,
												onClick: () => void handleCancelTask(task),
												"aria-label": `Cancel task ${task.title}`,
												className: "inline-flex items-center gap-1 rounded-lg border border-[#efb5b5] bg-white px-2.5 py-1.5 text-[10px] font-extrabold text-[#b83f3f] transition hover:bg-[#fff2f2] disabled:cursor-wait disabled:opacity-50",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 12 }),
													" ",
													deletingTaskId === task.id ? "Cancelling…" : "Cancel task"
												]
											})]
										})]
									}),
									task.status === "IN_PROGRESS" && task.startedAt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-2 text-[10px] font-bold text-[#6349c1]",
										children: ["Started ", formatClock(task.startedAt)]
									}),
									task.status === "COMPLETED" && task.completedAt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-2 text-[10px] font-bold text-[#16865b]",
										children: ["Completed ", formatClock(task.completedAt)]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 flex flex-wrap items-center gap-2",
										children: [task.priority !== "MEDIUM" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `rounded-full px-2 py-0.5 text-[9px] font-extrabold ${priorityTone(task.priority)}`,
											children: task.priority
										}), task.dueAt && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "rounded-full bg-[#fff5df] px-2 py-0.5 text-[9px] font-extrabold text-[#b36d0c]",
											children: formatTaskDue(task.dueAt)
										})]
									})
								]
							}, task.id)), displayedManagerTasks.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl border border-dashed border-[#d5e1f0] bg-[#fbfcfe] px-5 py-8 text-center md:col-span-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm font-extrabold text-[#24466f]",
									children: [
										"No ",
										managerTaskView === "OPEN" ? "open" : "completed",
										" tasks"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-[#8294ac]",
									children: managerTaskView === "OPEN" ? "Assigned tasks appear here while executives work on them." : "Completed tasks are kept here for review."
								})]
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				id: "manager-tx-tabbar",
				className: "mt-6 rounded-[24px] border border-[#d7e2f0] bg-white p-6 shadow-[0_14px_42px_rgba(16,45,82,0.06)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]",
							children: "Manager transaction tools"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-1 text-lg font-extrabold text-[#102a56]",
							children: "Transactions"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-[#8294ac]",
							children: "Review Warehouse Executive-confirmed stock changes, then trace every posted transaction in the controlled ledger."
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2 rounded-2xl border border-[#d5e1f0] bg-[#f4f8ff] p-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							"aria-pressed": transactionTab === "needsReview",
							onClick: () => setTransactionTab("needsReview"),
							className: `rounded-xl px-4 py-2 text-xs font-extrabold transition ${transactionTab === "needsReview" ? "bg-[#155eef] text-white shadow-[0_8px_20px_rgba(21,94,239,0.22)]" : "text-[#496482] hover:text-[#155eef]"}`,
							children: ["Needs review", pendingApprovals > 0 ? ` (${pendingApprovals})` : ""]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": transactionTab === "history",
							onClick: () => setTransactionTab("history"),
							className: `rounded-xl px-4 py-2 text-xs font-extrabold transition ${transactionTab === "history" ? "bg-[#155eef] text-white shadow-[0_8px_20px_rgba(21,94,239,0.22)]" : "text-[#496482] hover:text-[#155eef]"}`,
							children: "History"
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]",
				"data-tx-tab": "needsReview",
				"data-tx-tab-active": transactionTab === "needsReview" ? "true" : "false",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					id: "manager-approvals",
					className: "scroll-mt-24 rounded-[24px] border border-[#e0e8f3] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.055)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between border-b border-[#e9eef5] px-6 py-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#d47b08]",
								children: "Action required"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-1 text-lg font-extrabold text-[#102a56]",
								children: "Pending approvals"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "rounded-full bg-[#fff4df] px-3 py-1 text-xs font-extrabold text-[#b36d0c]",
								children: [pendingApprovals, " open"]
							})]
						}),
						managerMessage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-6 mt-5 rounded-xl bg-[#eef5ff] px-4 py-3 text-sm font-semibold text-[#244f86]",
							children: managerMessage
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "divide-y divide-[#edf1f6]",
							children: [pendingReviewTransactions.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "px-6 py-10 text-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
										size: 26,
										className: "mx-auto text-[#16865b]"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 text-sm font-extrabold text-[#24466f]",
										children: "No confirmed transactions need review"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-xs text-[#8093ab]",
										children: "New items requiring manager review will appear here."
									})
								]
							}), pendingReviewTransactions.map((transaction) => {
								const title = transaction.action.toLowerCase().replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
								const location = transaction.sourceLocation?.name ?? transaction.destinationLocation?.name ?? "Location unavailable";
								const countedLocationBalance = transaction.action === "CYCLE_COUNT" && transaction.sourceLocation ? snapshot?.balances.find((balance) => balance.product.id === transaction.product.id && balance.location.id === transaction.sourceLocation?.id) : void 0;
								const expectedAtCountedLocation = transaction.systemQuantityBefore ?? countedLocationBalance?.quantity ?? 0;
								const stockAtOtherLocations = transaction.action === "CYCLE_COUNT" && transaction.sourceLocation ? (snapshot?.balances ?? []).filter((balance) => balance.product.id === transaction.product.id && balance.location.id !== transaction.sourceLocation?.id && balance.quantity > 0) : [];
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "px-6 py-6",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-start gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff4df] text-[#d47b08]",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 19 })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-sm font-extrabold text-[#24466f]",
														children: title
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "mt-1 text-xs font-semibold text-[#8093ab]",
														children: [
															transaction.product.name,
															" · ",
															location
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8295af]",
														children: [
															"TX-",
															transaction.id.slice(0, 8).toUpperCase(),
															" · Warehouse Executive confirmed"
														]
													}),
													transaction.reviewReasons && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "mt-1.5 rounded-lg bg-[#fff4df] px-2.5 py-1.5 text-xs font-semibold text-[#b36d0c]",
														children: ["Flagged: ", transaction.reviewReasons.split("\n").join(" · ")]
													}),
													transaction.action === "CYCLE_COUNT" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "mt-2 rounded-xl border border-[#f2d39a] bg-[#fffbf3] px-3 py-2.5 text-xs text-[#72501d]",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "font-extrabold",
																children: [
																	"Location check: ",
																	location,
																	" has ",
																	expectedAtCountedLocation,
																	" ",
																	transaction.product.unit,
																	"; the executive counted ",
																	transaction.quantity,
																	"."
																]
															}),
															stockAtOtherLocations.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "mt-1 font-semibold",
																children: [
																	"This item is also recorded at ",
																	stockAtOtherLocations.map((balance) => `${balance.location.name} (${balance.quantity} ${transaction.product.unit})`).join(", "),
																	"."
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "mt-1 text-[#8a6a37]",
																children: "An exact count posts automatically only when it matches the stock recorded at the same location."
															})
														]
													}),
													(transaction._count?.evidence ?? 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "mt-2.5 flex flex-wrap items-center gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "inline-flex items-center gap-1.5 rounded-full bg-[#e0f7fb] px-2.5 py-1 text-[10px] font-extrabold text-[#0e7490]",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 12 }),
																" Photo evidence · ",
																transaction._count?.evidence
															]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransactionEvidence, {
															transactionId: transaction.id,
															evidenceCount: transaction._count?.evidence ?? 0
														})]
													})
												] })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-left sm:text-right",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-lg font-black text-[#17345f]",
													children: [
														transaction.quantity,
														" ",
														transaction.product.unit
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[10px] font-bold uppercase tracking-[0.12em] text-[#b36d0c]",
													children: "Manager decision required"
												})]
											})]
										}),
										transaction.action === "DAMAGE" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-5 border-t border-[#f0f3f8] pt-5",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													htmlFor: `damage-reason-${transaction.id}`,
													className: "text-xs font-extrabold text-[#24466f]",
													children: ["Adjustment reason ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[#c94b4b]",
														children: "*"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
													id: `damage-reason-${transaction.id}`,
													value: damageAdjustmentReasons[transaction.id] ?? "",
													onChange: (event) => setDamageAdjustmentReasons((current) => ({
														...current,
														[transaction.id]: event.target.value
													})),
													maxLength: 500,
													rows: 3,
													placeholder: "Example: Product was damaged during warehouse handling.",
													className: "mt-2 w-full resize-y rounded-xl border border-[#d5e1f0] bg-white px-3 py-2.5 text-xs font-semibold text-[#29466f] outline-none transition focus:border-[#155eef] focus:ring-2 focus:ring-[#155eef]/15"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-1 text-[11px] font-semibold text-[#8294ac]",
													children: "Required before damaged stock can be adjusted and posted."
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: `grid gap-2.5 ${transaction.action === "DAMAGE" ? "mt-3 sm:grid-cols-2" : "mt-5 border-t border-[#f0f3f8] pt-5 sm:grid-cols-3"}`,
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													disabled: reviewingId === transaction.id || transaction.action === "DAMAGE" && !damageAdjustmentReasons[transaction.id]?.trim(),
													onClick: () => void reviewTransaction(transaction, "approve"),
													className: "rounded-xl bg-[#16865b] px-4 py-3 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(22,134,91,0.22)] disabled:opacity-60",
													children: "Approve and post"
												}),
												transaction.action !== "DAMAGE" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													disabled: reviewingId === transaction.id,
													onClick: () => void reviewTransaction(transaction, "recount"),
													className: "rounded-xl border border-[#e0bd70] bg-[#fffaf0] px-4 py-2.5 text-xs font-extrabold text-[#b36d0c] disabled:opacity-60",
													children: "Request recount"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													disabled: reviewingId === transaction.id,
													onClick: () => void reviewTransaction(transaction, "reject"),
													className: "rounded-xl border border-[#efb5b5] bg-[#fff6f6] px-4 py-2.5 text-xs font-extrabold text-[#b83f3f] disabled:opacity-60",
													children: "Reject"
												})
											]
										})
									]
								}, transaction.id);
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-[24px] border border-[#e0e8f3] bg-white p-6 shadow-[0_14px_42px_rgba(16,45,82,0.055)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#16865b]",
								children: "Last 7 days"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-1 text-lg font-extrabold text-[#102a56]",
								children: "Stock movement"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRightLeft, {
								size: 21,
								className: "text-[#155eef]"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-6 flex h-44 items-end gap-2 rounded-2xl bg-[#f7f9fc] px-4 pb-3 pt-6",
							children: movementReport.days.map((day) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex h-full flex-1 flex-col justify-end gap-1 text-center",
								title: `${day.label}: received ${day.received}, shipped ${day.outgoing}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex h-[118px] items-end justify-center gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-2 rounded-t bg-[#58b68e]",
										style: { height: `${Math.max(day.received ? 5 : 0, day.received / movementReport.maximum * 100)}%` }
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-2 rounded-t bg-[#155eef]",
										style: { height: `${Math.max(day.outgoing ? 5 : 0, day.outgoing / movementReport.maximum * 100)}%` }
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[9px] font-bold text-[#8294ac]",
									children: day.label
								})]
							}, day.key))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid grid-cols-2 gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b9db4]",
								children: "Received"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xl font-extrabold text-[#16865b]",
								children: ["+", movementReport.receivedTotal.toLocaleString()]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b9db4]",
								children: "Shipped / used"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xl font-extrabold text-[#24466f]",
								children: ["-", movementReport.outgoingTotal.toLocaleString()]
							})] })]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "purchase-items",
				className: "mt-6 scroll-mt-6 rounded-[24px] border border-[#d7e2f0] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.06)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-4 border-b border-[#e9eef5] px-6 py-5 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#7257d6]",
								children: "Manager-only · low stock"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-1 text-lg font-extrabold text-[#102a56]",
								children: "Purchase Items"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-[#8294ac]",
								children: "Only products below their safety level are shown. Use the purchase quantity when preparing the order outside this system."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "rounded-full bg-[#fff2d9] px-3 py-1 text-[10px] font-extrabold text-[#aa690d]",
									children: [
										lowStockDraftCount,
										" low-stock item",
										lowStockDraftCount === 1 ? "" : "s"
									]
								})
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								setReorderActionId("refresh");
								setReorderMessage("");
								refreshReorderDrafts().then(setReorderDrafts).catch(() => setReorderMessage("The purchase items could not be refreshed.")).finally(() => setReorderActionId(null));
							},
							disabled: reorderActionId === "refresh",
							className: "rounded-xl border border-[#c8d6e8] px-4 py-2.5 text-xs font-extrabold text-[#496482] disabled:opacity-60",
							children: reorderActionId === "refresh" ? "Checking stock…" : "Refresh stock"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 border-b border-[#e9eef5] px-6 py-4 lg:flex-row lg:items-center lg:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "relative block w-full lg:max-w-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "sr-only",
									children: "Search purchase items"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
									size: 15,
									className: "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8597af]"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "search",
									value: purchaseQuery,
									onChange: (event) => setPurchaseQuery(event.target.value),
									placeholder: "Search item or SKU",
									className: "h-10 w-full rounded-xl border border-[#d5e1f0] bg-white pl-9 pr-3 text-sm font-semibold text-[#17345f] outline-none transition focus:border-[#155eef] focus:ring-2 focus:ring-[#155eef]/15"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center gap-1 rounded-xl border border-[#d5e1f0] bg-[#f4f8ff] p-1",
								children: [
									"ALL",
									"LOW",
									"OUT"
								].map((option) => {
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-pressed": purchaseFilter === option,
										onClick: () => setPurchaseFilter(option),
										className: `rounded-lg px-3 py-1.5 text-[11px] font-extrabold transition ${purchaseFilter === option ? "bg-[#155eef] text-white shadow-[0_6px_14px_rgba(21,94,239,0.22)]" : "text-[#496482] hover:text-[#155eef]"}`,
										children: {
											ALL: "All",
											LOW: "Low stock",
											OUT: "Out of stock"
										}[option]
									}, option);
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center gap-2 text-[11px] font-extrabold text-[#49617f]",
								children: ["Sort", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: purchaseSort,
									onChange: (event) => setPurchaseSort(event.target.value),
									className: "h-10 rounded-xl border border-[#d5e1f0] bg-white px-3 text-xs font-bold text-[#17345f] outline-none transition focus:border-[#155eef] focus:ring-2 focus:ring-[#155eef]/15",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "severity",
										children: "Shortage severity"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "name",
										children: "Item name A–Z"
									})]
								})]
							})]
						})]
					}),
					reorderMessage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-6 mt-5 rounded-xl bg-[#eef5ff] px-4 py-3 text-sm font-semibold text-[#244f86]",
						children: reorderMessage
					}),
					visibleReorderDrafts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-6 py-10 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PackageCheck, {
								size: 26,
								className: "mx-auto text-[#16865b]"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm font-extrabold text-[#24466f]",
								children: "No products currently require purchasing."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-[#8093ab]",
								children: "Every product is currently at or above its safety level."
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "min-w-full text-left",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
								className: "bg-[#f8fafc] text-[10px] uppercase tracking-[0.12em] text-[#8597af]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
									"Item",
									"SKU",
									"Available quantity",
									"Safety stock",
									"Purchase quantity",
									"Status"
								].map((heading) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "whitespace-nowrap px-5 py-3 font-extrabold",
									children: heading
								}, heading)) })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
								className: "divide-y divide-[#edf1f6] text-sm",
								children: visibleReorderDrafts.map((draft) => {
									const outOfStock = draft.currentStock <= 0;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "whitespace-nowrap px-5 py-4 font-extrabold text-[#24466f]",
											children: draft.product.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "whitespace-nowrap px-5 py-4 font-bold text-[#6c829f]",
											children: draft.product.sku
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "whitespace-nowrap px-5 py-4 font-extrabold text-[#c04b4b]",
											children: draft.currentStock
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "whitespace-nowrap px-5 py-4 text-[#6c829f]",
											children: draft.safetyStock
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "whitespace-nowrap px-5 py-4 font-extrabold text-[#7257d6]",
											children: draft.suggestedQuantity
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "whitespace-nowrap px-5 py-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${outOfStock ? "bg-[#ffecec] text-[#c04343]" : "bg-[#fff4df] text-[#b36d0c]"}`,
												children: outOfStock ? "Out of stock" : "Low stock"
											})
										})
									] }, draft.id);
								})
							})]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "manager-audit-history",
				className: "mt-6 scroll-mt-24 rounded-[24px] border border-[#d7e2f0] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.06)]",
				"data-tx-tab": "history",
				"data-tx-tab-active": transactionTab === "history" ? "true" : "false",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-4 border-b border-[#e9eef5] px-6 py-5 lg:flex-row lg:items-center lg:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]",
								children: "Controlled ledger"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-1 text-lg font-extrabold text-[#102a56]",
								children: "Inventory audit history"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-[#8294ac]",
								children: "All authorized stock transactions with creator, reviewer and references."
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									"aria-label": "Filter audit action",
									value: auditAction,
									onChange: (event) => setAuditAction(event.target.value),
									className: "h-10 rounded-xl border border-[#d5e1f0] bg-white px-3 text-xs font-bold text-[#496482]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "ALL",
										children: "All actions"
									}), [
										"RECEIVE",
										"SHIP",
										"TRANSFER",
										"CYCLE_COUNT",
										"DAMAGE"
									].map((action) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: action,
										children: action.replaceAll("_", " ")
									}, action))]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									"aria-label": "Filter audit status",
									value: auditStatus,
									onChange: (event) => setAuditStatus(event.target.value),
									className: "h-10 rounded-xl border border-[#d5e1f0] bg-white px-3 text-xs font-bold text-[#496482]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "ALL",
										children: "All statuses"
									}), [
										"PENDING",
										"RECOUNT_REQUESTED",
										"APPROVED",
										"REJECTED",
										"POSTED",
										"CANCELLED"
									].map((status) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: status,
										children: status.replaceAll("_", " ")
									}, status))]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: exportAuditHistory,
									disabled: !auditTransactions.length,
									className: "flex h-10 items-center gap-2 rounded-xl bg-[#155eef] px-4 text-xs font-extrabold text-white disabled:opacity-50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 15 }), " Export CSV"]
								})
							]
						})]
					}),
					selectedAuditTransaction && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `m-5 rounded-2xl border p-5 ${isStockAdjustment(selectedAuditTransaction) ? "border-[#efc36f] bg-[#fff9ec]" : "border-[#cfe0f7] bg-[#f7faff]"}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-base font-extrabold text-[#102a56]",
										children: "Transaction details"
									}), isStockAdjustment(selectedAuditTransaction) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "inline-flex items-center gap-1 rounded-full bg-[#f4a322] px-2.5 py-1 text-[10px] font-extrabold text-white",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, { size: 12 }), " Stock adjustment"]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-xs text-[#6c829f]",
									children: ["TX-", selectedAuditTransaction.id.slice(0, 8).toUpperCase()]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setSelectedAuditTransaction(null),
									"aria-label": "Close transaction details",
									className: "rounded-lg border border-[#d5e1f0] bg-white p-2 text-[#66809f] transition hover:text-[#155eef]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
								className: "mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
								children: [
									["Date and time", new Intl.DateTimeFormat("en", {
										dateStyle: "medium",
										timeStyle: "short"
									}).format(new Date(selectedAuditTransaction.createdAt))],
									["Action", selectedAuditTransaction.action.replaceAll("_", " ")],
									["Status", selectedAuditTransaction.status.replaceAll("_", " ")],
									["Product", `${selectedAuditTransaction.product.name} (${selectedAuditTransaction.product.sku})`],
									["Quantity", `${selectedAuditTransaction.quantity} ${selectedAuditTransaction.product.unit}`],
									["From location", selectedAuditTransaction.sourceLocation?.name ?? "Not applicable"],
									["To location", selectedAuditTransaction.destinationLocation?.name ?? "Not applicable"],
									["Reference", selectedAuditTransaction.referenceNumber ?? "Not provided"],
									["Created by", selectedAuditTransaction.createdBy?.displayName ?? "System"],
									["Reviewed by", selectedAuditTransaction.approvedBy?.displayName ?? "Not reviewed"],
									["Previous system quantity", selectedAuditTransaction.systemQuantityBefore ?? "Not recorded"],
									["Difference", selectedAuditTransaction.discrepancyDifference ?? "Not applicable"]
								].map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-white/80 bg-white/75 p-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8294ac]",
										children: label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "mt-1 break-words text-xs font-bold text-[#24466f]",
										children: value
									})]
								}, String(label)))
							}),
							isStockAdjustment(selectedAuditTransaction) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 rounded-xl border border-[#efc36f] bg-white p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#a8670d]",
									children: "Adjustment reason"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm font-bold text-[#704a12]",
									children: selectedAdjustmentReason
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 grid gap-4 lg:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-[#e1e8f1] bg-white p-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8294ac]",
										children: "Audit notes"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 whitespace-pre-wrap text-xs leading-5 text-[#496482]",
										children: selectedAuditTransaction.notes ?? "No audit notes recorded."
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-[#e1e8f1] bg-white p-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8294ac]",
										children: "Voice transcript"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 whitespace-pre-wrap text-xs leading-5 text-[#496482]",
										children: selectedAuditTransaction.transcript ?? "No voice transcript attached."
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransactionEvidence, {
									transactionId: selectedAuditTransaction.id,
									evidenceCount: selectedAuditTransaction._count?.evidence ?? 0,
									inline: true
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "min-w-full text-left",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
								className: "bg-[#f8fafc] text-[10px] uppercase tracking-[0.12em] text-[#8597af]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
									"Date",
									"Transaction",
									"Action",
									"Product",
									"Quantity",
									"Location",
									"Created by",
									"Status",
									"Details",
									"Cancel"
								].map((heading) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "whitespace-nowrap px-5 py-3 font-extrabold",
									children: heading
								}, heading)) })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
								className: "divide-y divide-[#edf1f6] text-xs",
								children: [auditTransactions.map((transaction) => {
									const adjustment = isStockAdjustment(transaction);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										tabIndex: 0,
										role: "button",
										"aria-label": `View transaction TX-${transaction.id.slice(0, 8).toUpperCase()}`,
										onClick: () => setSelectedAuditTransaction(transaction),
										onKeyDown: (event) => {
											if (event.key === "Enter" || event.key === " ") {
												event.preventDefault();
												setSelectedAuditTransaction(transaction);
											}
										},
										className: `cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#155eef] ${adjustment ? "bg-[#fff8e9] hover:bg-[#fff1d2]" : "hover:bg-[#f7faff]"}`,
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: `whitespace-nowrap px-5 py-4 text-[#6c829f] ${adjustment ? "border-l-4 border-[#e49a20]" : ""}`,
												children: new Intl.DateTimeFormat("en", {
													day: "2-digit",
													month: "short",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit"
												}).format(new Date(transaction.createdAt))
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "whitespace-nowrap px-5 py-4 font-extrabold text-[#155eef]",
												children: ["TX-", transaction.id.slice(0, 8).toUpperCase()]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "whitespace-nowrap px-5 py-4 font-bold text-[#496482]",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-col items-start gap-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: transaction.action.replaceAll("_", " ") }), adjustment && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "inline-flex items-center gap-1 rounded-full bg-[#f4a322] px-2 py-0.5 text-[9px] font-extrabold text-white",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, { size: 10 }), " Adjusted stock"]
													})]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "whitespace-nowrap px-5 py-4 font-extrabold text-[#24466f]",
												children: transaction.product.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "whitespace-nowrap px-5 py-4 font-bold text-[#29466f]",
												children: [
													transaction.quantity,
													" ",
													transaction.product.unit
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "whitespace-nowrap px-5 py-4 text-[#6c829f]",
												children: transaction.sourceLocation?.name ?? transaction.destinationLocation?.name ?? "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "whitespace-nowrap px-5 py-4 text-[#496482]",
												children: transaction.createdBy?.displayName ?? "System"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "whitespace-nowrap px-5 py-4",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: `rounded-full px-2.5 py-1 text-[10px] font-extrabold ${transaction.status === "POSTED" ? "bg-[#eaf8f1] text-[#16865b]" : transaction.status === "REJECTED" ? "bg-[#fff0f0] text-[#b83b3b]" : transaction.status === "CANCELLED" ? "bg-[#eef2f7] text-[#7b8fa9]" : "bg-[#fff5df] text-[#a8670d]"}`,
													children: transaction.status.replaceAll("_", " ")
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "whitespace-nowrap px-5 py-4",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "inline-flex items-center gap-2 font-extrabold text-[#155eef]",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 14 }),
														" View",
														(transaction._count?.evidence ?? 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "inline-flex items-center gap-1 rounded-full bg-[#e0f7fb] px-1.5 py-0.5 text-[9px] font-extrabold text-[#0e7490]",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 10 }),
																" ",
																transaction._count?.evidence
															]
														})
													]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "whitespace-nowrap px-5 py-4",
												children: [
													"PENDING",
													"RECOUNT_REQUESTED",
													"APPROVED"
												].includes(transaction.status) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													disabled: cancellingTransactionId === transaction.id,
													onClick: (event) => {
														event.stopPropagation();
														handleCancelManagerTransaction(transaction);
													},
													className: "rounded-lg border border-[#efb5b5] px-2.5 py-1.5 text-[10px] font-extrabold text-[#b83f3f] transition hover:bg-[#fff2f2] disabled:opacity-50",
													children: cancellingTransactionId === transaction.id ? "Cancelling…" : "Cancel"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[#d3dbe6]",
													children: "—"
												})
											})
										]
									}, transaction.id);
								}), !auditTransactions.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									colSpan: 10,
									className: "px-6 py-10 text-center text-sm font-semibold text-[#7f92aa]",
									children: "No audit records match the selected filters."
								}) })]
							})]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdministratorDashboard, {
				managerMode: true,
				page
			})
		]
	});
}
function PlanTaskList({ plan }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-[#e0cbf5] bg-white p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2 border-b border-[#f0ebfb] pb-3 sm:flex-row sm:items-start sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-extrabold text-[#3f3470]",
					children: plan.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-0.5 text-[10px] font-bold text-[#8a7bb0]",
					children: [
						plan.planNumber,
						" · Count period ",
						formatCountPeriod(plan.periodMonth),
						plan.blindCount ? " · Blind count" : ""
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `w-fit rounded-full px-2.5 py-1 text-[10px] font-extrabold ${plan.status === "COMPLETED" ? "bg-[#eaf8f1] text-[#16865b]" : "bg-[#edf4ff] text-[#155eef]"}`,
					children: (plan.status ?? "OPEN").replaceAll("_", " ")
				})]
			}),
			plan.instructions && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 rounded-lg bg-[#faf6ff] px-3 py-2 text-[11px] font-semibold leading-5 text-[#5a4696]",
				children: ["Instructions: ", plan.instructions]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3",
				children: plan.tasks.map((task) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-xl border border-[#e9e2f7] bg-[#faf7ff] p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-xs font-extrabold text-[#29466f]",
								children: task.product?.name ?? task.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold ${taskStatusTone(task.status)}`,
								children: task.status.replaceAll("_", " ")
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-[10px] font-semibold text-[#7b8fa9]",
							children: task.location?.name ?? "Location missing"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap items-center gap-2",
							children: [task.priority !== "MEDIUM" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `rounded-full px-2 py-0.5 text-[9px] font-extrabold ${priorityTone(task.priority)}`,
								children: task.priority
							}), task.dueAt && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full bg-[#fff5df] px-2 py-0.5 text-[9px] font-extrabold text-[#b36d0c]",
								children: formatTaskDue(task.dueAt)
							})]
						}),
						task.discrepancies.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 space-y-1",
							children: task.discrepancies.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "rounded-lg bg-[#fff1e3] px-2.5 py-1.5 text-[10px] font-bold text-[#c56c08]",
								children: [
									entry.caseNumber,
									" · ",
									entry.status.replaceAll("_", " "),
									" · counted ",
									entry.countedQuantity,
									" vs expected ",
									entry.expectedQuantity
								]
							}, entry.id))
						})
					]
				}, task.id))
			})
		]
	});
}
function InventoryApp() {
	const [role, setRole] = (0, import_react.useState)("worker");
	const [activePage, setActivePage] = (0, import_react.useState)("Overview");
	const [mobileOpen, setMobileOpen] = (0, import_react.useState)(false);
	const [authReady, setAuthReady] = (0, import_react.useState)(false);
	const [authLoading, setAuthLoading] = (0, import_react.useState)(false);
	const [authError, setAuthError] = (0, import_react.useState)("");
	const [sessionBlocked, setSessionBlocked] = (0, import_react.useState)(false);
	const [pendingApprovals, setPendingApprovals] = (0, import_react.useState)(0);
	const [pendingWorkerTasks, setPendingWorkerTasks] = (0, import_react.useState)(0);
	const localAuth = useLocalAuth();
	const { ready: localAuthReady, user, provider, error: localAuthError } = localAuth;
	const loggedIn = Boolean(user) && !sessionBlocked;
	const displayName = user?.displayName ?? "Inventory user";
	const offlineOwnerId = user ? offlineOwnerForUser(user) : void 0;
	const legacyOfflineOwnerIds = provider === "keycloak" && keycloak.subject ? [keycloak.subject] : [];
	const { isOnline, pendingSyncCount, syncState, setPendingSyncCount, setSyncState } = useNetworkStatus();
	const visiblePage = role === "manager" ? resolveManagerPage(activePage) : activePage;
	const showingWorkerInterface = role === "worker";
	useOfflineSync(loggedIn, showingWorkerInterface, isOnline, pendingSyncCount, syncState, setPendingSyncCount, setSyncState, offlineOwnerId, legacyOfflineOwnerIds);
	(0, import_react.useEffect)(() => {
		if (!localAuthReady) return;
		let active = true;
		let refreshTimer;
		if (user) {
			setRole(workspaceForUser(user));
			setSessionBlocked(false);
			setAuthReady(true);
			return () => {
				active = false;
			};
		}
		initializeKeycloak().then(async (authenticated) => {
			if (!active) return;
			if (authenticated) try {
				setInventoryAccessToken(keycloak.token, "keycloak");
				const canonicalUser = await fetchAuthenticatedUser();
				if (!active) return;
				localAuth.adoptExternalSession(canonicalUser);
				const requestedRole = sessionStorage.getItem("nirka_requested_role") ?? workspaceForUser(canonicalUser);
				setRole(requestedRole);
				if (userCanUseWorkspace(canonicalUser, requestedRole)) {
					setSessionBlocked(false);
					setAuthError("");
				} else {
					setSessionBlocked(true);
					setAuthError(`This account does not have ${formatRoleLabel(requestedRole)} access. Choose the ${formatRoleLabel(workspaceForUser(canonicalUser))} workspace.`);
				}
				refreshTimer = window.setInterval(() => {
					keycloak.updateToken(60).then(() => setInventoryAccessToken(keycloak.token, "keycloak")).catch(() => {
						setInventoryAccessToken();
						localAuth.clearSession();
						setSessionBlocked(false);
						setAuthError("Your secure session expired. Please sign in again.");
					});
				}, 3e4);
			} catch {
				setInventoryAccessToken();
				setAuthError("The authenticated user profile is unavailable. Please use another sign-in method.");
			}
			setAuthReady(true);
		}).catch(() => {
			if (!active) return;
			setAuthError("Local sign-in is unavailable and legacy sign-in could not be checked.");
			setAuthReady(true);
		});
		return () => {
			active = false;
			if (refreshTimer) window.clearInterval(refreshTimer);
		};
	}, [localAuthReady]);
	async function beginLocalLogin(identifier, password) {
		setAuthError("");
		localAuth.clearError();
		sessionStorage.setItem("nirka_requested_role", role);
		try {
			const authenticatedUser = await localAuth.login(identifier, password);
			if (!userCanUseWorkspace(authenticatedUser, role)) {
				await localAuth.logout();
				setSessionBlocked(true);
				setAuthError(`This account does not have ${formatRoleLabel(role)} access. Choose the ${formatRoleLabel(workspaceForUser(authenticatedUser))} workspace.`);
				return;
			}
			setRole(workspaceForUser(authenticatedUser));
			setSessionBlocked(false);
			setAuthError("");
		} catch (cause) {
			setAuthError(cause instanceof Error ? cause.message : "Invalid credentials.");
		}
	}
	async function beginLegacyLogin(identifier) {
		setAuthLoading(true);
		setAuthError("");
		sessionStorage.setItem("nirka_requested_role", role);
		try {
			if (keycloak.authenticated && keycloak.token) {
				setInventoryAccessToken(keycloak.token, "keycloak");
				const canonicalUser = await fetchAuthenticatedUser();
				localAuth.adoptExternalSession(canonicalUser);
				if (!userCanUseWorkspace(canonicalUser, role)) {
					setSessionBlocked(true);
					setAuthError(`This account does not have ${formatRoleLabel(role)} access. Choose the ${formatRoleLabel(workspaceForUser(canonicalUser))} workspace.`);
				} else {
					setRole(workspaceForUser(canonicalUser));
					setSessionBlocked(false);
				}
			} else await keycloak.login({
				redirectUri: window.location.origin,
				loginHint: identifier || void 0
			});
		} catch {
			setInventoryAccessToken();
			setAuthError("Legacy sign-in could not be started. Please try local sign-in or try again.");
		} finally {
			setAuthLoading(false);
		}
	}
	async function signOut() {
		const wasKeycloak = provider === "keycloak";
		if (wasKeycloak) {
			setInventoryAccessToken();
			localAuth.clearSession();
		} else await localAuth.logout();
		setSessionBlocked(false);
		setActivePage("Overview");
		sessionStorage.removeItem("nirka_requested_role");
		if (wasKeycloak && keycloak.authenticated) keycloak.logout({ redirectUri: window.location.origin });
	}
	if (!authReady) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingState, {});
	if (!loggedIn) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthenticationPage, {
		role,
		setRole: (nextRole) => {
			setRole(nextRole);
			setActivePage("Overview");
		},
		onLogin: (identifier, password) => void beginLocalLogin(identifier, password),
		onLegacyLogin: (identifier) => void beginLegacyLogin(identifier),
		authError: authError || localAuthError,
		isLoading: authLoading || localAuth.loading
	});
	if (provider === "local" && user?.mustChangePassword) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChangePasswordPage, {
		displayName,
		onSubmit: (currentPassword, newPassword) => {
			localAuth.changePassword(currentPassword, newPassword).then((updatedUser) => {
				setRole(workspaceForUser(updatedUser));
				setAuthError("");
			}).catch((cause) => {
				setAuthError(cause instanceof Error ? cause.message : "Password change failed.");
			});
		},
		authError: authError || localAuthError,
		isLoading: localAuth.loading
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: `app-shell min-h-screen bg-transparent text-[#17345f] ${showingWorkerInterface ? "worker-mobile-app pb-28 lg:pb-0" : ""}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppSidebar, {
				role,
				displayName,
				activePage: visiblePage,
				onNavigate: setActivePage,
				mobileOpen,
				close: () => setMobileOpen(false),
				pendingApprovals: role === "manager" ? pendingApprovals : 0,
				pendingWorkerTasks: role === "worker" ? pendingWorkerTasks : 0
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lg:pl-[254px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: `app-header sticky top-0 z-20 flex h-[76px] items-center justify-between gap-3 px-4 sm:px-7 ${showingWorkerInterface ? "worker-mobile-header" : ""}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 items-center gap-3",
						children: [
							role !== "worker" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setMobileOpen(true),
								"aria-label": "Open navigation",
								className: "rounded-xl border border-[#dce5f1] p-2.5 text-[#55708f] lg:hidden",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { size: 19 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "brand-mark grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#2874ff] to-[#1048b8] text-white shadow-[0_10px_30px_rgba(21,94,239,0.28)]",
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeaderPageIcon, {
									role,
									page: visiblePage
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#8497b0]",
									children: [
										"Central Warehouse",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "inline-block h-1 w-1 rounded-full bg-[#c2cfe1]",
											"aria-hidden": "true"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "hidden sm:inline",
											children: roleLabel(role)
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
									className: "flex items-center gap-2 text-base font-extrabold tracking-[-0.02em] text-[#102a56]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "truncate",
										children: visiblePage
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `status-live-dot ${isOnline ? "" : "offline"}`,
										"aria-hidden": "true",
										title: isOnline ? "System online" : "Offline — updates saved on device"
									})]
								})]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 sm:gap-3",
						children: [
							role === "administrator" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "hidden items-center gap-2 rounded-xl border border-[#d9e8e1] bg-[#f3fbf7] px-3 py-2 text-xs font-extrabold text-[#267054] sm:flex",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { size: 16 }), "Secure administration"]
							}) : role === "manager" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InventorySearch, {
								role,
								onNavigate: setActivePage
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotificationsBell, {
								role,
								onNavigate: setActivePage
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "hidden items-center gap-2.5 rounded-2xl border border-[#e3eaf4] bg-white/75 py-1.5 pl-1.5 pr-4 shadow-[0_6px_18px_rgba(18,48,88,0.06)] md:flex",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#2874ff] to-[#1048b8] text-[11px] font-extrabold text-white",
									children: (displayName || role).split(" ").map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "leading-tight",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "max-w-[150px] truncate text-xs font-extrabold text-[#17345f]",
										children: displayName || role
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-semibold text-[#8295af]",
										children: roleLabel(role)
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Log out",
								onClick: signOut,
								className: "rounded-xl border border-[#dce5f1] p-2.5 text-[#6f84a3] transition hover:bg-[#f5f8fc] hover:text-[#29466f]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { size: 18 })
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `dashboard-stage px-4 py-6 sm:px-7 sm:py-7 ${showingWorkerInterface ? "worker-mobile-stage" : ""}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `dashboard-welcome mb-6 flex flex-col gap-2 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${showingWorkerInterface ? "worker-mobile-status" : ""}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm font-semibold text-[#667e9e]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-extrabold text-[#17345f]",
										children: visiblePage
									}),
									" · ",
									pageDescription(role, visiblePage)
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								"aria-live": "polite",
								className: `flex items-center gap-2 text-xs font-semibold ${isOnline ? "text-[#778ba7]" : "text-[#a46009]"}`,
								children: [
									isOnline && syncState !== "syncing" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "status-live-dot",
										"aria-hidden": "true"
									}),
									isOnline ? syncState === "syncing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudUpload, {
										size: 15,
										className: "text-[#155eef]"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wifi, {
										size: 15,
										className: "text-[#20ad76]"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WifiOff, {
										size: 15,
										className: "text-[#d47b08]"
									}),
									!isOnline ? `Offline \u00B7 ${pendingSyncCount} saved update${pendingSyncCount === 1 ? "" : "s"}` : syncState === "syncing" ? `Synchronizing ${pendingSyncCount} saved update${pendingSyncCount === 1 ? "" : "s"}\u2026` : pendingSyncCount > 0 ? `${pendingSyncCount} update${pendingSyncCount === 1 ? "" : "s"} waiting to synchronize` : syncState === "complete" ? "Saved updates synchronized" : "System online · Updated just now"
								]
							})]
						}),
						showingWorkerInterface && (!isOnline || pendingSyncCount > 0 || syncState === "error") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							role: "status",
							className: `mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${!isOnline ? "border-[#f0ce8e] bg-[#fff8ea] text-[#875810]" : syncState === "error" ? "border-[#efb5b5] bg-[#fff4f4] text-[#a73737]" : "border-[#b9d0f8] bg-[#f2f6ff] text-[#244f86]"}`,
							children: [!isOnline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WifiOff, {
								size: 18,
								className: "mt-0.5 shrink-0"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudUpload, {
								size: 18,
								className: "mt-0.5 shrink-0"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: !isOnline ? "Offline mode is active. A confirmation for an already prepared proposal will be saved on this device; inventory will not change until synchronization succeeds." : syncState === "error" ? "Saved updates are still protected on this device. Synchronization will retry automatically while the app remains signed in." : `${pendingSyncCount} confirmed update${pendingSyncCount === 1 ? " is" : "s are"} saved on this device and waiting to synchronize.` })]
						}),
						showingWorkerInterface ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExecutiveDashboard, {
							page: visiblePage,
							onNavigate: setActivePage,
							isOnline,
							pendingSyncCount,
							syncState,
							onSignOut: signOut,
							onPendingTaskCountChange: setPendingWorkerTasks,
							displayName,
							offlineOwnerId
						}) : role === "manager" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ManagerDashboard, {
							page: visiblePage,
							onNavigate: setActivePage,
							onPendingApprovalsChange: setPendingApprovals
						}, visiblePage) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdministratorDashboard, {
							page: visiblePage,
							onNavigate: setActivePage,
							displayName
						})
					]
				})]
			}),
			showingWorkerInterface && visiblePage !== "Voice entry" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloatingVoiceAssistant, {
				active: visiblePage === "Voice entry",
				onOpen: () => {
					setActivePage("Voice entry");
					window.scrollTo({
						top: 0,
						behavior: "smooth"
					});
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedBackground, {}),
			showingWorkerInterface && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkerToolDock, {
				activePage: visiblePage,
				onNavigate: setActivePage,
				pendingTaskCount: pendingWorkerTasks
			})
		]
	});
}
//#endregion
export { migrateOfflineInventoryOwner as a, synchronizeOfflineInventoryUpdates as c, InventoryApp as default, countOfflineInventoryUpdates as n, offlineQueueChangedEvent as s };

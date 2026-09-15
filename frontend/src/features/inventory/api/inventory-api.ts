import type { InventoryTransaction, LowStockItem } from "../types";
import { keycloak } from "../auth/keycloak";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
let accessToken: string | null = null;
let authProvider: "local" | "keycloak" | null = null;
let tokenRefreshPromise: Promise<void> | null = null;
let localRefreshPromise: Promise<LocalAuthResponse> | null = null;
let authFailureHandler: (() => void) | null = null;
let csrfToken: string | null = null;
let csrfBootstrapPromise: Promise<string> | null = null;

export function setInventoryAccessToken(
  token?: string,
  provider?: "local" | "keycloak",
) {
  accessToken = token ?? null;
  if (provider) authProvider = provider;
  if (!token) authProvider = null;
}

export function getInventoryAuthProvider() {
  return authProvider;
}

export function setInventoryAuthFailureHandler(handler?: () => void) {
  authFailureHandler = handler ?? null;
}

function headersWithJson(init?: RequestInit, csrf?: string) {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (csrf) headers.set("x-csrf-token", csrf);
  return headers;
}

async function readApiError(response: Response) {
  const payload = await response.json().catch(() => null) as
    | { message?: string | string[] }
    | null;
  return Array.isArray(payload?.message)
    ? payload.message.join(" ")
    : payload?.message;
}

async function bootstrapCsrfToken(force = false): Promise<string> {
  if (!force && csrfToken) return csrfToken;
  if (csrfBootstrapPromise) return csrfBootstrapPromise;

  csrfBootstrapPromise = fetch(`${API_BASE_URL}/auth/csrf`, {
    method: "GET",
    credentials: "include",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          (await readApiError(response)) ||
            `CSRF bootstrap failed with status ${response.status}.`,
        );
      }
      const payload = await response.json() as { csrfToken?: unknown };
      if (typeof payload.csrfToken !== "string" || payload.csrfToken.length < 16) {
        throw new Error("CSRF bootstrap returned an invalid token.");
      }
      csrfToken = payload.csrfToken;
      return payload.csrfToken;
    })
    .finally(() => {
      csrfBootstrapPromise = null;
    });
  return csrfBootstrapPromise;
}

async function publicAuthRequest<T>(
  path: string,
  init: RequestInit,
  options: { csrfRequired?: boolean } = {},
): Promise<T> {
  const csrfRequired = options.csrfRequired ?? false;
  let csrfRetried = false;
  const perform = async () => {
    const token = csrfRequired ? await bootstrapCsrfToken() : undefined;
    return fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: headersWithJson(init, token),
    });
  };

  let response = await perform();
  if (response.status === 403 && csrfRequired && !csrfRetried) {
    csrfRetried = true;
    csrfToken = null;
    await bootstrapCsrfToken(true);
    response = await perform();
  }
  if (!response.ok) {
    throw new Error(
      (await readApiError(response)) ||
        `Authentication request failed with status ${response.status}.`,
    );
  }
  return response.status === 204
    ? (undefined as T)
    : response.json() as Promise<T>;
}

async function refreshLocalAccessToken() {
  if (!localRefreshPromise) {
    localRefreshPromise = publicAuthRequest<LocalAuthResponse>(
      "/auth/refresh",
      { method: "POST" },
      { csrfRequired: true },
    )
      .then((result) => {
        setInventoryAccessToken(result.accessToken, "local");
        return result;
      })
      .finally(() => {
        localRefreshPromise = null;
      });
  }
  return localRefreshPromise;
}

export function refreshLocalSession() {
  return refreshLocalAccessToken();
}

/** Refresh the active provider's session. Local refresh is single-flight so
 * concurrent startup/API calls cannot rotate the same cookie twice. */
async function refreshAccessToken(force = false): Promise<void> {
  if (!force && accessToken) {
    if (authProvider === "local") return;
    if (authProvider === "keycloak" && !keycloak.isTokenExpired(60)) return;
  }

  if (authProvider === "local") {
    await refreshLocalAccessToken();
    return;
  }

  if (authProvider !== "keycloak" || !keycloak.authenticated || !keycloak.refreshToken) {
    return;
  }

  if (!tokenRefreshPromise) {
    tokenRefreshPromise = keycloak
      .updateToken(60)
      .then(() => {
        accessToken = keycloak.token ?? null;
      })
      .finally(() => {
        tokenRefreshPromise = null;
      });
  }
  await tokenRefreshPromise;
  if (!accessToken && keycloak.token) accessToken = keycloak.token;
}

/**
 * Run one authenticated fetch, retrying once after a 401 with a freshly
 * refreshed access token. All API calls go through this so an expired token
 * can never fail a request that the user is still entitled to make.
 */
async function withAuthRetry(
  url: string,
  init?: RequestInit,
  options: { csrfRequired?: boolean } = {},
): Promise<Response> {
  await refreshAccessToken();
  const csrfRequired = options.csrfRequired ?? false;
  let csrfRetried = false;
  const perform = async (token: string | null) => {
    const currentCsrfToken = csrfRequired
      ? await bootstrapCsrfToken()
      : undefined;
    return fetch(url, {
      ...init,
      credentials: csrfRequired ? "include" : init?.credentials,
      headers: (() => {
        const headers = new Headers(init?.headers);
        if (token) headers.set("Authorization", `Bearer ${token}`);
        else headers.delete("Authorization");
        if (currentCsrfToken) headers.set("x-csrf-token", currentCsrfToken);
        return headers;
      })(),
    });
  };
  const performWithCsrfRecovery = async (token: string | null) => {
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
    // The access token expired mid-flight; reacquire it safely and retry the
    // exact same request once. If the refresh grant itself was rejected (the
    // session is genuinely expired), surface that state instead of sending a
    // stale token a second time.
    let refreshSucceeded = true;
    try {
      await refreshAccessToken(true);
    } catch {
      refreshSucceeded = false;
    }
    if (!refreshSucceeded || !accessToken) {
      setInventoryAccessToken();
      authFailureHandler?.();
      throw new Error(
        "Your secure session expired. Please sign in again.",
      );
    }
    response = await performWithCsrfRecovery(accessToken);
    if (response.status === 401) {
      setInventoryAccessToken();
      authFailureHandler?.();
      throw new Error(
        "Your secure session expired. Please sign in again.",
      );
    }
  }
  return response;
}

export interface ApiLocation {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  active?: boolean;
}

export interface LocationInput { code: string; name: string; description?: string; active?: boolean; }

export interface ApiProduct {
  id: string;
  sku: string;
  name: string;
  unit: string;
  safetyStock: number;
  reorderQuantity: number;
  controlled?: boolean;
}

export interface ProductInput {
  sku: string;
  name: string;
  unit: string;
  safetyStock: number;
  reorderQuantity: number;
  controlled?: boolean;
}
export interface ApiCycleCountPlan {
  id: string;
  planNumber: string;
  title: string;
  periodMonth: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueAt?: string | null;
  blindCount: boolean;
  instructions?: string | null;
  assignedToId: string;
  createdAt: string;
  assignedTo?: { id: string; employeeId: string; displayName: string };
  locations?: Array<{ id: string; code: string; name: string }>;
  totalTasks?: number;
  openTasks?: number;
  inProgressTasks?: number;
  completedTasks?: number;
  cancelledTasks?: number;
  discrepancyCount?: number;
  status?: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "EMPTY";
  tasks?: Array<{ id: string; status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" }>;
}

export interface ApiCycleCountPlanTask {
  id: string;
  type: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  title: string;
  description?: string | null;
  dueAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  product?: ApiProduct | null;
  location?: ApiLocation | null;
  assignedTo?: { id: string; employeeId: string; displayName: string } | null;
  discrepancies: Array<{
    id: string;
    caseNumber: string;
    status: string;
    expectedQuantity: number;
    countedQuantity: number;
  }>;
}

export interface ApiCycleCountPlanDetail extends ApiCycleCountPlan {
  instructions?: string | null;
  tasks: ApiCycleCountPlanTask[];
}
export interface ApiInventoryTask { id:string; type:string; priority:"LOW"|"MEDIUM"|"HIGH"|"URGENT"; status:"OPEN"|"IN_PROGRESS"|"COMPLETED"|"CANCELLED"; title:string; description?:string|null; dueAt?:string|null; createdAt:string; startedAt?:string|null; completedAt?:string|null; quantity?:number|null; product?:ApiProduct|null; location?:ApiLocation|null; sourceLocation?:ApiLocation|null; destinationLocation?:ApiLocation|null; assignedTo?:{id:string;employeeId:string;displayName:string}|null; cycleCountPlan?:ApiCycleCountPlan|null; sourceTransactionId?:string|null; preparedBy?:{id:string;employeeId:string;displayName:string}|null; discrepancies?: Array<{ id:string; caseNumber:string; expectedQuantity:number; countedQuantity:number; differenceQuantity:number; status:string; managerNotes?:string|null }> | null; reservationId?:string|null; shipmentReference?:string|null; reservation?:{request?:{referenceNumber?:string|null}|null}|null; }
export interface ApiTaskAssignee { id:string; employeeId:string; displayName:string; shift?:string|null; warehouseZone?:string|null; openTaskCount?: number; }

export interface ApiBalance {
  id: string;
  quantity: number;
  reservedQuantity: number;
  product: ApiProduct;
  location: ApiLocation;
}

export interface OpeningBalanceInput {
  productId: string;
  locationId: string;
  quantity: number;
  effectiveDate: string;
  reason: string;
}

export interface ApiTransaction {
  id: string;
  action: string;
  status: string;
  quantity: number;
  createdAt: string;
  confirmedAt?: string | null;
  approvedAt?: string | null;
  postedAt?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
  reviewNotes?: string | null;
  reviewReasons?: string | null;
  systemQuantityBefore?: number | null;
  systemQuantityAfter?: number | null;
  discrepancyDifference?: number | null;
  discrepancyPercentage?: number | null;
  significantDiscrepancy?: boolean;
  product: ApiProduct;
  sourceLocation?: ApiLocation | null;
  destinationLocation?: ApiLocation | null;
  sourceLocationSource?: string | null;
  destinationLocationSource?: string | null;
  createdBy?: { displayName: string } | null;
  approvedBy?: { displayName: string } | null;
  transcript?: string | null;
  /** Number of attached photo-evidence files (for the manager badge). */
  _count?: { evidence?: number };
}

export interface TransactionConfirmationResult {
  outcome: "POSTED" | "PENDING_REVIEW";
  idempotent: boolean;
  transaction: ApiTransaction;
}

export interface TransactionReviewResult {
  outcome: "POSTED" | "REJECTED" | "RECOUNT_REQUESTED" | "CANCELLED";
  idempotent: boolean;
  transaction: ApiTransaction;
}

export interface SpeechTranscription {
  evidenceId: string;
  storageKey: string;
  text: string;
  language: string;
  languageProbability: number;
  duration: number;
  model: string;
  segments: Array<{ start: number; end: number; text: string }>;
}

export type InventoryExtractionAction =
  | "RECEIVE"
  | "SHIP"
  | "TRANSFER"
  | "CYCLE_COUNT"
  | "DAMAGE";

export interface InventoryExtractionContext {
  action?: InventoryExtractionAction;
  productSku?: string;
  productName?: string;
  sourceLocationCode?: string;
  destinationLocationCode?: string;
}

export interface InventoryExtraction {
  transcript: string;
  evidenceId: string | null;
  model: string;
  readyForConfirmation: boolean;
  requiresManagerReview: boolean;
  confidence: number;
  missingFields: string[];
  lowConfidenceFields: string[];
  clarificationQuestions: string[];
  fields: {
    action:
      | "RECEIVE"
      | "SHIP"
      | "TRANSFER"
      | "CYCLE_COUNT"
      | "DAMAGE"
      | null;
    product: ApiProduct | null;
    quantity: number | null;
    sourceLocation: ApiLocation | null;
    destinationLocation: ApiLocation | null;
    condition: "GOOD" | "DAMAGED" | "HOLD";
    referenceNumber: string | null;
    notes: string | null;
  };
  fieldConfidence: {
    action: number;
    product: number;
    quantity: number;
    sourceLocation: number;
    destinationLocation: number;
    condition: number;
    referenceNumber: number;
  };
  sourceLocationSource?: string | null;
  destinationLocationSource?: string | null;
  safetyNotice: string;
}

export interface InventorySnapshot {
  products: ApiProduct[];
  locations: ApiLocation[];
  balances: ApiBalance[];
  transactions: ApiTransaction[];
}

export interface ApiDiscrepancy {
  id: string;
  caseNumber: string;
  transactionId: string;
  expectedQuantity: number;
  countedQuantity: number;
  differenceQuantity: number;
  differencePercentage: number;
  severity: "NONE" | "MINOR" | "MEDIUM" | "MAJOR" | "CRITICAL";
  severityRule?: string | null;
  status: "OPEN" | "AWAITING_REVIEW" | "RECOUNT_REQUESTED" | "APPROVED" | "REJECTED" | "RESOLVED_AS_TRANSFER" | "CLOSED";
  reasonCode: string;
  workerNotes?: string | null;
  managerNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  product: ApiProduct;
  location: ApiLocation;
  transaction?: ApiTransaction | null;
  worker?: { id: string; employeeId: string; displayName: string } | null;
  assignedManager?: { id: string; employeeId: string; displayName: string } | null;
  recountTask?: { id: string; title: string; status: string; dueAt?: string | null } | null;
  resolutionTransaction?: { id: string; action: string; status: string; postedAt?: string | null } | null;
  resolvedBy?: { id: string; employeeId: string; displayName: string } | null;
  evidence?: ApiEvidence[] | null;
}

export interface ApiDiscrepancySummary {
  total: number;
  awaitingReview: number;
  criticalOpen: number;
  resolvedToday: number;
  missingQuantity: number;
  extraQuantity: number;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface ApiNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  linkType?: string | null;
  linkId?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface ApiEvidence {
  id: string;
  discrepancyId?: string | null;
  transactionId?: string | null;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploadedBy?: { id: string; employeeId: string; displayName: string } | null;
}

export interface ApiDiscrepancyAuditEvent {
  id: string;
  caseNumber: string;
  action: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  expectedQuantity?: number | null;
  countedQuantity?: number | null;
  differenceQuantity?: number | null;
  severityRule?: string | null;
  previousStock?: number | null;
  newStock?: number | null;
  reason?: string | null;
  transactionId?: string | null;
  evidenceId?: string | null;
  rawTranscript?: string | null;
  aiValues?: string | null;
  createdAt: string;
  actorWorker?: { displayName?: string; employeeId?: string } | null;
  actorManager?: { displayName?: string; employeeId?: string } | null;
}

export interface ApiDiscrepancyReports {
  differenceSplit: {
    positive: { cases: number; units: number };
    negative: { cases: number; units: number };
  };
  severityDistribution: Record<string, number>;
  byProduct: Array<{ productId: string; name: string; sku: string; cases: number; netDifference: number }>;
  byLocation: Array<{ locationId: string; name: string; cases: number }>;
  byWorker: Array<{ workerId: string; name: string; employeeId: string; cases: number }>;
  repeatedProducts: Array<{ productId: string; name: string; sku: string; cases: number }>;
  repeatedLocations: Array<{ locationId: string; name: string; cases: number }>;
  averageResolutionHours: number | null;
  recountFrequency: number;
  approvedAdjustmentQuantity: number;
  stockAccuracyTrend: Array<{ month: string; cycleCounts: number; discrepancies: number; accuracy: number | null }>;
  generatedAt: string;
}

export interface ApiReorderDraft {
  id: string;
  currentStock: number;
  safetyStock: number;
  suggestedQuantity: number;
  status: "DRAFT" | "APPROVED" | "CANCELLED";
  createdAt: string;
  product: ApiProduct;
  location: ApiLocation;
}
export type ServiceHealthStatus = "healthy" | "degraded" | "unavailable";
export interface ApiSystemHealth { status: "healthy" | "degraded"; checkedAt: string; services: Array<{ key: string; name: string; status: ServiceHealthStatus; detail: string }>; }
export type ApiAuthProvider = "local" | "keycloak";
export type ApiUserRole = "WORKER" | "MANAGER" | "ADMINISTRATOR";
export interface ApiAuthenticatedUser {
  id: string;
  employeeId: string;
  email: string;
  displayName: string;
  role: ApiUserRole;
  shift?: string | null;
  warehouseZone?: string | null;
  active: boolean;
  lastLoginAt?: string | null;
  mustChangePassword: boolean;
  localAuthEnabled: boolean;
  authProvider: ApiAuthProvider;
}
export interface LocalAuthResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: ApiAuthenticatedUser;
}
export interface ApiSystemUser { id: string; employeeId: string; email: string; displayName: string; role: ApiUserRole; shift?: string | null; warehouseZone?: string | null; active: boolean; lastLoginAt?: string | null; mustChangePassword?: boolean; localAuthEnabled?: boolean; compatibilitySync?: "synchronized" | "pending" | "failed" | "not_configured"; createdAt: string; updatedAt: string; _count: { createdTransactions: number; assignedTasks: number }; }
export interface ApiUserAccessAudit { id: string; action: string; actorUsername: string; actorEmail?: string | null; targetUserId: string; targetEmployeeId: string; targetDisplayName: string; details?: string | null; createdAt: string; }
export interface CreateSystemUserInput {
  employeeId: string;
  displayName: string;
  email: string;
  role: "WORKER" | "MANAGER";
  shift?: string;
  warehouseZone?: string;
  temporaryPassword: string;
}
export type UpdateSystemUserInput = Omit<CreateSystemUserInput, "temporaryPassword">;

export function loginLocal(identifier: string, password: string) {
  return publicAuthRequest<LocalAuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  }).then((result) => {
    setInventoryAccessToken(result.accessToken, "local");
    return result;
  });
}

export async function logoutLocal() {
  try {
    await publicAuthRequest<void>("/auth/logout", {
      method: "POST",
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    }, { csrfRequired: true });
  } finally {
    setInventoryAccessToken();
  }
}

export function changeLocalPassword(currentPassword: string, newPassword: string) {
  return request<LocalAuthResponse>("/auth/change-password", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ currentPassword, newPassword }),
  }, { csrfRequired: true }).then((result) => {
    setInventoryAccessToken(result.accessToken, "local");
    return result;
  });
}

export function fetchAuthenticatedUser() {
  return request<ApiAuthenticatedUser>("/auth/me");
}

async function request<T>(
  path: string,
  init?: RequestInit,
  options: { csrfRequired?: boolean } = {},
): Promise<T> {
  const response = await withAuthRetry(`${API_BASE_URL}${path}`, {
    ...init,
    headers: headersWithJson(init),
  }, options);

  if (!response.ok) {
    const message = await readApiError(response);
    throw new Error(message || `Inventory API request failed with status ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

export async function fetchInventorySnapshot(): Promise<InventorySnapshot> {
  const [products, locations, balances, transactions] = await Promise.all([
    request<ApiProduct[]>("/inventory/products"),
    request<ApiLocation[]>("/inventory/locations"),
    request<ApiBalance[]>("/inventory/balances"),
    request<ApiTransaction[]>("/inventory/transactions"),
  ]);

  return { products, locations, balances, transactions };
}
export function fetchDetailedSystemHealth() { return request<ApiSystemHealth>("/health/detailed"); }
export function fetchSystemUsers() { return request<ApiSystemUser[]>("/auth/users"); }
export function fetchUserAccessAudit() { return request<ApiUserAccessAudit[]>("/auth/user-audit"); }
export function createSystemUser(input: CreateSystemUserInput) {
  return request<ApiSystemUser>("/auth/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
export function updateSystemUserStatus(id: string, active: boolean) {
  return request<ApiSystemUser>(`/auth/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}
export function updateSystemUser(id: string, input: UpdateSystemUserInput) {
  return request<ApiSystemUser>(`/auth/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
export function resetSystemUserPassword(id: string, temporaryPassword: string) {
  return request<{ updated: boolean; userId: string }>(
    `/auth/users/${id}/reset-password`,
    { method: "POST", body: JSON.stringify({ temporaryPassword }) },
  );
}

export function createInventoryProduct(input: ProductInput) {
  return request<ApiProduct>("/inventory/products", { method: "POST", body: JSON.stringify(input) });
}

export function updateInventoryProduct(id: string, input: Partial<ProductInput>) {
  return request<ApiProduct>(`/inventory/products/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteInventoryProduct(id: string, administratorOverride = false) {
  const endpoint = administratorOverride
    ? `/inventory/products/${id}/administrator-override`
    : `/inventory/products/${id}`;
  return request<ApiProduct>(endpoint, { method: "DELETE" });
}

export function createLocation(input: LocationInput) { return request<ApiLocation>("/inventory/locations", { method: "POST", body: JSON.stringify(input) }); }
export function updateLocation(id: string, input: Partial<LocationInput>) { return request<ApiLocation>(`/inventory/locations/${id}`, { method: "PATCH", body: JSON.stringify(input) }); }
export function deleteLocation(id: string) { return request<{ deleted: boolean; id: string }>(`/inventory/locations/${id}`, { method: "DELETE" }); }
export function removeDefaultInventoryData() {
  return request<{ cleared: boolean; counts: Record<string, number> }>("/inventory/default-data", { method: "DELETE" });
}
export function createOpeningBalance(input: OpeningBalanceInput) { return request<{ balance: ApiBalance; transaction: ApiTransaction }>("/inventory/opening-balances", { method: "POST", body: JSON.stringify(input) }); }
export function adjustInventoryBalance(input: { balanceId: string; quantity: number; reason: string }) { return request<{ balance: ApiBalance; transaction: ApiTransaction }>("/inventory/balance-adjustments", { method: "POST", body: JSON.stringify(input) }); }
export function fetchDiscrepancies(query: {
  page?: number;
  pageSize?: number;
  status?: string;
  severity?: string;
  difference?: "POSITIVE" | "NEGATIVE";
  productId?: string;
  locationId?: string;
  workerId?: string;
  from?: string;
  to?: string;
  sort?: string;
  order?: "asc" | "desc";
  view?: "OPEN" | "AWAITING_RECOUNT" | "HIGH_PRIORITY" | "RESOLVED_TODAY" | "MISSING" | "EXTRA";
} = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return request<{ items: ApiDiscrepancy[]; total: number; page: number; pageSize: number; hasMore: boolean }>(
    `/discrepancies${qs ? `?${qs}` : ""}`,
  );
}

export function fetchDiscrepancySummary() {
  return request<ApiDiscrepancySummary>("/discrepancies/summary");
}

export function fetchDiscrepancy(id: string) {
  return request<ApiDiscrepancy>(`/discrepancies/${id}`);
}

export function fetchDiscrepancyAudit(id: string) {
  return request<ApiDiscrepancyAuditEvent[]>(`/discrepancies/${id}/audit`);
}

export function fetchDiscrepancyReports() {
  return request<ApiDiscrepancyReports>("/discrepancies/reports");
}

export function fetchDiscrepancyEvidence(id: string) {
  return request<ApiEvidence[]>(
    `/discrepancies/${id}/evidence`,
  );
}

/** List photo evidence attached to one transaction (manager, administrator
 * or the transaction creator). The response never contains the storage path. */
export function fetchTransactionEvidence(transactionId: string) {
  return request<ApiEvidence[]>(
    `/transactions/${transactionId}/evidence`,
  );
}

async function uploadEvidenceRequest(path: string, file: Blob | File, filename?: string) {
  const form = new FormData();
  form.append("photo", file, filename ?? "evidence.jpg");
  const response = await withAuthRetry(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string | string[] } | null;
    const message = Array.isArray(payload?.message) ? payload.message.join(" ") : payload?.message;
    throw new Error(message || `Evidence upload failed with status ${response.status}.`);
  }
  return response.json() as Promise<ApiEvidence>;
}

export function uploadDiscrepancyEvidence(id: string, file: Blob | File, filename?: string) {
  return uploadEvidenceRequest(`/discrepancies/${id}/evidence`, file, filename);
}

export function uploadTransactionEvidence(id: string, file: Blob | File, filename?: string) {
  return uploadEvidenceRequest(`/transactions/${id}/evidence`, file, filename);
}

/** Download an evidence photo as a browser object URL (auth header cannot be
 * sent on a plain <img>, so we fetch and revoke later). */
export async function fetchEvidenceObjectUrl(evidenceId: string) {
  const response = await withAuthRetry(
    `${API_BASE_URL}/evidence/${evidenceId}/file`,
  );
  if (!response.ok) {
    throw new Error(`Evidence download failed with status ${response.status}.`);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/** Export the currently filtered discrepancy list as a CSV file download. */
export async function downloadDiscrepancyCsv(query: {
  status?: string;
  severity?: string;
  difference?: string;
  productId?: string;
  locationId?: string;
  workerId?: string;
  from?: string;
  to?: string;
} = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  const response = await withAuthRetry(
    `${API_BASE_URL}/discrepancies/export.csv${qs ? `?${qs}` : ""}`,
  );
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message ?? `CSV export failed with status ${response.status}.`);
  }
  const csv = await response.text();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `discrepancies-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return csv;
}

export function approveDiscrepancy(id: string, note: string) {
  return request<ApiDiscrepancy>(`/discrepancies/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export function requestDiscrepancyRecount(id: string, instructions: string, assignedWorkerId?: string) {
  return request<ApiDiscrepancy>(`/discrepancies/${id}/request-recount`, {
    method: "POST",
    body: JSON.stringify({ instructions, ...(assignedWorkerId ? { assignedWorkerId } : {}) }),
  });
}

export function rejectDiscrepancy(id: string, reason: string) {
  return request<ApiDiscrepancy>(`/discrepancies/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function resolveDiscrepancyTransfer(id: string, input: { sourceLocationId: string; destinationLocationId: string; note: string }) {
  return request<ApiDiscrepancy>(`/discrepancies/${id}/resolve-transfer`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchNotifications() {
  return request<ApiNotification[]>("/notifications");
}

export function fetchUnreadNotificationCount() {
  return request<number>("/notifications/unread-count");
}

export function markNotificationRead(id: string) {
  return request<{ updated: boolean; id: string }>(`/notifications/${id}/read`, {
    method: "POST",
  });
}

export function markAllNotificationsRead() {
  return request<{ updated: number }>("/notifications/read-all", { method: "POST" });
}

export function fetchInventoryTasks(){return request<ApiInventoryTask[]>("/tasks");}
export function fetchTaskAssignees(){return request<ApiTaskAssignee[]>("/tasks/assignees");}
export function createInventoryTask(input:{type:string;priority:string;title:string;description?:string;dueAt?:string;assignedToId:string;productId?:string;locationId?:string;quantity?:number;sourceLocationId?:string;destinationLocationId?:string}){return request<ApiInventoryTask>("/tasks",{method:"POST",body:JSON.stringify(input)});}
export function createCycleCountPlan(input:{periodMonth:string;locationIds:string[];assignedToId:string;priority:string;dueAt?:string;blindCount:boolean;instructions?:string}){return request<ApiCycleCountPlan & {tasks:ApiInventoryTask[];createdTasks:number;skippedDuplicates:number;selectedLocations:number;idempotent?:boolean}>("/tasks/cycle-count-plans",{method:"POST",body:JSON.stringify(input)});}
export function fetchCycleCountPlans(){return request<ApiCycleCountPlan[]>("/tasks/cycle-count-plans");}
export function fetchCycleCountPlan(id:string){return request<ApiCycleCountPlanDetail>(`/tasks/cycle-count-plans/${id}`);}
export function deleteInventoryTask(id:string){return request<ApiInventoryTask>(`/tasks/${id}`,{method:"DELETE"});}
export function startInventoryTask(id:string){return request<ApiInventoryTask>(`/tasks/${id}/start`,{method:"POST"});}
export function completeInventoryTask(id:string){return request<ApiInventoryTask>(`/tasks/${id}/complete`,{method:"POST"});}
export function reassignInventoryTask(id: string, workerId: string) {
  return request<{ idempotent: boolean; task: ApiInventoryTask }>(`/tasks/${id}/assign`, { method: "POST", body: JSON.stringify({ workerId }) });
}

export function fetchReorderDrafts() {
  return request<ApiReorderDraft[]>("/inventory/reorder-drafts");
}

export function refreshReorderDrafts() {
  return request<ApiReorderDraft[]>("/inventory/reorder-drafts/refresh", {
    method: "POST",
  });
}

export function createPendingReceive(input: {
  productId: string;
  destinationLocationId: string;
  quantity: number;
}) {
  return request<ApiTransaction>("/inventory/transactions", {
    method: "POST",
    body: JSON.stringify({
      action: "RECEIVE",
      productId: input.productId,
      destinationLocationId: input.destinationLocationId,
      quantity: input.quantity,
      condition: "GOOD",
      referenceNumber: "RECEIPT-1001",
      notes: "Created from the worker confirmation screen.",
      clientRequestId: `web-${crypto.randomUUID()}`,
    }),
  });
}

export function createPendingInventoryTransaction(
  extraction: InventoryExtraction,
  clientRequestId: string,
  recountTaskId?: string | null,
  taskId?: string | null,
) {
  const { fields } = extraction;
  if (!fields.action || !fields.product || fields.quantity === null) {
    throw new Error("The AI proposal is not complete.");
  }
  return request<ApiTransaction>("/inventory/transactions", {
    method: "POST",
    body: JSON.stringify({
      action: fields.action,
      productId: fields.product.id,
      quantity: fields.quantity,
      condition: fields.condition,
      sourceLocationId: fields.sourceLocation?.id,
      destinationLocationId: fields.destinationLocation?.id,
      sourceLocationSource: extraction.sourceLocationSource ?? undefined,
      destinationLocationSource: extraction.destinationLocationSource ?? undefined,
      referenceNumber: fields.referenceNumber ?? undefined,
      notes: fields.notes ?? undefined,
      transcript: extraction.transcript,
      evidenceId: extraction.evidenceId ?? undefined,
      clientRequestId,
      recountTaskId: recountTaskId ?? undefined,
      taskId: taskId ?? undefined,
    }),
  });
}

export function confirmInventoryTransaction(transactionId: string) {
  return request<TransactionConfirmationResult>(
    `/inventory/transactions/${transactionId}/confirm`,
    { method: "POST" },
  );
}

function reviewInventoryTransaction(
  transactionId: string,
  decision: "approve" | "reject" | "request-recount",
  note?: string,
) {
  return request<TransactionReviewResult>(
    `/inventory/transactions/${transactionId}/${decision}`,
    {
      method: "POST",
      body: JSON.stringify({ note: note?.trim() || undefined }),
    },
  );
}

export function approveInventoryTransaction(
  transactionId: string,
  note?: string,
) {
  return reviewInventoryTransaction(transactionId, "approve", note);
}

export function rejectInventoryTransaction(
  transactionId: string,
  note?: string,
) {
  return reviewInventoryTransaction(transactionId, "reject", note);
}

export function cancelInventoryTransaction(
  transactionId: string,
  note?: string,
) {
  return request<TransactionReviewResult>(
    `/inventory/transactions/${transactionId}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({ note: note?.trim() || undefined }),
    },
  );
}

export function requestInventoryRecount(
  transactionId: string,
  note?: string,
) {
  return reviewInventoryTransaction(
    transactionId,
    "request-recount",
    note,
  );
}

export async function transcribeAudio(
  audio: Blob,
  options?: { language?: string },
) {
  const form = new FormData();
  const extension = audio.type.includes("ogg") ? "ogg" : "webm";
  form.append("audio", audio, `warehouse-recording.${extension}`);
  if (options?.language) form.append("language", options.language);

  const response = await withAuthRetry(`${API_BASE_URL}/speech/transcribe`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Speech transcription failed with status ${response.status}.`);
  }

  return response.json() as Promise<SpeechTranscription>;
}

export function extractInventoryDetails(input: {
  transcript: string;
  evidenceId?: string;
  context?: InventoryExtractionContext;
}) {
  return request<InventoryExtraction>("/ai/extract-inventory", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function mapTransactions(
  transactions: ApiTransaction[],
  limit = 8,
  includeDate = false,
): InventoryTransaction[] {
  return transactions.slice(0, limit).map((transaction) => {
    const incoming = transaction.action === "RECEIVE";
    const count = transaction.action === "CYCLE_COUNT";
    const formattedAction = transaction.action
      .toLowerCase()
      .replaceAll("_", " ")
      .replace(/^\w/, (letter) => letter.toUpperCase());

    return {
      id: `TX-${transaction.id.slice(0, 8).toUpperCase()}`,
      type: formattedAction,
      item: transaction.product.name,
      quantity: count
        ? String(transaction.quantity)
        : `${incoming ? "+" : "-"}${transaction.quantity}`,
      time: new Intl.DateTimeFormat("en", includeDate
        ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
        : { hour: "2-digit", minute: "2-digit" }
      ).format(new Date(transaction.createdAt)),
      status:
        transaction.status === "POSTED"
          ? "Posted"
          : transaction.status === "REJECTED"
            ? "Rejected"
            : transaction.status === "CANCELLED"
              ? "Cancelled"
            : transaction.status === "RECOUNT_REQUESTED"
              ? "Recount requested"
          : transaction.status === "APPROVED"
            ? "Approved"
            : transaction.status === "PENDING"
              // PENDING here always means confirmed + awaiting manager review
              // (transient unconfirmed PENDING records are excluded by the backend)
              ? "Awaiting review"
            : "Pending",
    };
  });
}

export function mapLowStock(balances: ApiBalance[]): LowStockItem[] {
  const products = new Map<
    string,
    { item: string; code: string; available: number; threshold: number }
  >();

  for (const balance of balances) {
    const current = products.get(balance.product.id) ?? {
      item: balance.product.name,
      code: balance.product.sku,
      available: 0,
      threshold: balance.product.safetyStock,
    };
    current.available += Math.max(0, balance.quantity);
    products.set(balance.product.id, current);
  }

  return Array.from(products.values())
    .filter((product) => product.available < product.threshold)
    .map((product) => {
      const criticalLevel = Math.max(1, Math.floor(product.threshold / 2));
      return {
        ...product,
        status: product.available <= criticalLevel ? "Critical" : "Low",
      };
    });
}

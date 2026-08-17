import type { InventoryTransaction, LowStockItem } from "../types";
import { keycloak } from "../auth/keycloak";

const API_BASE_URL = "http://localhost:4000/api";
let accessToken: string | null = null;
let tokenRefreshPromise: Promise<void> | null = null;

export function setInventoryAccessToken(token?: string) {
  accessToken = token ?? null;
}

/**
 * Keycloak access tokens are short-lived (default ~5 minutes). The app
 * refreshes them periodically, but a long-running voice update can outlive
 * the token and a request can land exactly on the expiry boundary, producing
 * an occasional HTTP 401. This helper reacquires the access token through
 * Keycloak's refresh-token grant before a request when it is missing or near
 * expiry, and is also used to retry once after a real 401. Authentication is
 * never weakened or bypassed: a rejected refresh grant surfaces the
 * expired-session state instead of silently retrying forever.
 */
async function refreshAccessToken(): Promise<void> {
  if (accessToken && !keycloak.isTokenExpired(60)) return;
  if (!keycloak.authenticated || !keycloak.refreshToken) return;
  if (!tokenRefreshPromise) {
    tokenRefreshPromise = keycloak
      .updateToken(60)
      .then(() => {
        // updateToken(60) resolves without refreshing when the token still
        // has more than 60 seconds left; always publish the current token.
        accessToken = keycloak.token ?? null;
      })
      .catch(() => {
        // A transient refresh failure must not clear a still-valid token;
        // the caller decides whether the session is really expired.
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
): Promise<Response> {
  await refreshAccessToken();
  const perform = (token: string | null) =>
    fetch(url, {
      ...init,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  let response = await perform(accessToken);
  if (response.status === 401) {
    // The access token expired mid-flight; reacquire it safely and retry the
    // exact same request once. If the refresh grant itself was rejected (the
    // session is genuinely expired), surface that state instead of sending a
    // stale token a second time.
    await refreshAccessToken();
    let sessionStillValid = false;
    try {
      sessionStillValid = Boolean(
        keycloak.authenticated &&
          keycloak.token &&
          !keycloak.isTokenExpired(0),
      );
    } catch {
      sessionStillValid = false;
    }
    if (!sessionStillValid) {
      setInventoryAccessToken();
      throw new Error(
        "Your secure session expired. Please sign in again.",
      );
    }
    response = await perform(accessToken);
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
  supplierName?: string | null;
  supplierEmail?: string | null;
  supplierId?: string | null;
  supplier?: ApiSupplier | null;
  controlled?: boolean;
}

export interface ProductInput {
  sku: string;
  name: string;
  unit: string;
  safetyStock: number;
  reorderQuantity: number;
  supplierName?: string;
  supplierEmail?: string;
  supplierId?: string;
  controlled?: boolean;
}

export interface ApiSupplier {
  id: string; code: string; name: string; contactName?: string | null; email?: string | null;
  phone?: string | null; address?: string | null; leadTimeDays: number;
  minimumOrderQuantity: number; active: boolean;
}
export interface ApiCycleCountPlan { id:string; planNumber:string; title:string; periodMonth:string; priority:"LOW"|"MEDIUM"|"HIGH"|"URGENT"; dueAt?:string|null; blindCount:boolean; assignedToId:string; createdAt:string; tasks?:Array<{id:string;status:"OPEN"|"IN_PROGRESS"|"COMPLETED"|"CANCELLED"}>; }
export interface ApiInventoryTask { id:string; type:string; priority:"LOW"|"MEDIUM"|"HIGH"|"URGENT"; status:"OPEN"|"IN_PROGRESS"|"COMPLETED"|"CANCELLED"; title:string; description?:string|null; dueAt?:string|null; createdAt:string; startedAt?:string|null; completedAt?:string|null; quantity?:number|null; product?:ApiProduct|null; location?:ApiLocation|null; sourceLocation?:ApiLocation|null; destinationLocation?:ApiLocation|null; assignedTo?:{id:string;employeeId:string;displayName:string}|null; cycleCountPlan?:ApiCycleCountPlan|null; sourceTransactionId?:string|null; reservationId?:string|null; shipmentReference?:string|null; preparedBy?:{id:string;employeeId:string;displayName:string}|null; reservation?:{ id:string; reservationNumber:string; request?:{ referenceNumber:string; requestedFor:string } }|null; discrepancies?: Array<{ id:string; caseNumber:string; expectedQuantity:number; countedQuantity:number; differenceQuantity:number; status:string; managerNotes?:string|null }> | null; }
export interface ApiTaskAssignee { id:string; employeeId:string; displayName:string; shift?:string|null; warehouseZone?:string|null; openTaskCount?: number; }

export type ShipmentAssignmentMode = "AUTO" | "MANUAL" | "UNASSIGNED";

export type SupplierInput = Omit<ApiSupplier, "id" | "active"> & { active?: boolean };

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
  reservedQuantity: number;
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
export interface ApiReservationAuditEvent { id: string; action: string; details?: string | null; createdAt: string; actor: { displayName: string }; }
export interface ApiStockRequestLine {
  id: string;
  requiredQuantity: number;
  reservedQuantity: number;
  shippedQuantity: number;
  product: ApiProduct;
}
export interface ApiReservationAllocation {
  id: string;
  quantity: number;
  shippedQuantity: number;
  releasedQuantity: number;
  product: ApiProduct;
  location: ApiLocation;
}
export interface ApiStockReservation {
  id: string;
  reservationNumber: string;
  status: "ACTIVE" | "PARTIALLY_SHIPPED" | "COMPLETED" | "RELEASED" | "CANCELLED" | "EXPIRED";
  releaseReason?: string | null;
  createdAt: string;
  allocations: ApiReservationAllocation[];
  auditEvents?: ApiReservationAuditEvent[];
  shipmentTasks?: ApiInventoryTask[];
}
export interface ApiStockRequest {
  id: string;
  requestNumber: string;
  requestType: string;
  referenceNumber: string;
  requestedFor: string;
  requiredDate: string;
  notes?: string | null;
  status: "CONFIRMED" | "PARTIALLY_RESERVED" | "FULLY_RESERVED" | "PARTIALLY_FULFILLED" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  createdAt: string;
  lines: ApiStockRequestLine[];
  reservations: ApiStockReservation[];
  auditEvents?: ApiReservationAuditEvent[];
}
export type ServiceHealthStatus = "healthy" | "degraded" | "unavailable";
export interface ApiSystemHealth { status: "healthy" | "degraded"; checkedAt: string; services: Array<{ key: string; name: string; status: ServiceHealthStatus; detail: string }>; }
export interface ApiSystemUser { id: string; employeeId: string; email: string; displayName: string; role: "WORKER" | "MANAGER" | "ADMINISTRATOR"; shift?: string | null; warehouseZone?: string | null; active: boolean; lastLoginAt?: string | null; createdAt: string; updatedAt: string; _count: { createdTransactions: number; assignedTasks: number }; }
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await withAuthRetry(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string | string[] } | null;
    const message = Array.isArray(payload?.message) ? payload.message.join(" ") : payload?.message;
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
export function fetchStockRequests() { return request<ApiStockRequest[]>("/reservations/stock-requests"); }
export function fetchStockReservations() { return request<ApiStockReservation[]>("/reservations"); }
export function createStockRequest(input: {
  requestType: string;
  /** Optional external customer reference. The backend always generates the internal REQ number. */
  referenceNumber?: string;
  requestedFor: string;
  requiredDate: string;
  notes?: string;
  lines: Array<{ productId: string; requiredQuantity: number }>;
}) {
  return request<ApiStockRequest>("/reservations/stock-requests", { method: "POST", body: JSON.stringify(input) });
}
export function reserveRecommendedStock(requestId: string) {
  return request<ApiStockRequest>(`/reservations/stock-requests/${requestId}/reserve-recommended`, { method: "POST" });
}
export function releaseStockReservation(reservationId: string, reason: string) {
  return request<{ id: string; status: string; cancelledShipmentTasks?: number }>(`/reservations/${reservationId}/release`, { method: "POST", body: JSON.stringify({ reason }) });
}
export function fulfilStockReservation(reservationId: string, reason: string) {
  return request<{ id: string; status: string; fulfilledQuantity: number }>(`/reservations/${reservationId}/fulfil`, { method: "POST", body: JSON.stringify({ reason }) });
}
export function prepareReservationShipment(
  reservationId: string,
  input: {
    allocationId: string;
    quantity: number;
    assignmentMode: ShipmentAssignmentMode;
    assignedToId?: string;
    dueAt?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    instructions?: string;
    /** Optional external courier / delivery-note / tracking reference. The system-generated SHIP reference is never replaced. */
    externalReference?: string;
  },
) {
  return request<{ idempotent: boolean; task: ApiInventoryTask; reservation: ApiStockReservation }>(`/reservations/${reservationId}/shipments`, { method: "POST", body: JSON.stringify(input) });
}
export function cancelStockRequest(requestId: string, reason: string) {
  return request<{ id: string; status: string }>(`/reservations/stock-requests/${requestId}/cancel`, { method: "POST", body: JSON.stringify({ reason }) });
}
export function expireDueStockRequests() {
  return request<{ expiredRequests: number }>("/reservations/expire-due", { method: "POST" });
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

export function fetchSuppliers() { return request<ApiSupplier[]>("/suppliers"); }
export function createSupplier(input: SupplierInput) { return request<ApiSupplier>("/suppliers", { method: "POST", body: JSON.stringify(input) }); }
export function updateSupplier(id: string, input: Partial<SupplierInput>) { return request<ApiSupplier>(`/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(input) }); }
export function deleteSupplier(id: string) { return request<ApiSupplier>(`/suppliers/${id}`, { method: "DELETE" }); }
export function createLocation(input: LocationInput) { return request<ApiLocation>("/inventory/locations", { method: "POST", body: JSON.stringify(input) }); }
export function updateLocation(id: string, input: Partial<LocationInput>) { return request<ApiLocation>(`/inventory/locations/${id}`, { method: "PATCH", body: JSON.stringify(input) }); }
export function deleteLocation(id: string) { return request<{ deleted: boolean; id: string }>(`/inventory/locations/${id}`, { method: "DELETE" }); }
export function removeDefaultInventoryData() {
  return request<{ cleared: boolean; counts: Record<string, number> }>("/inventory/default-data", { method: "DELETE" });
}
export function createOpeningBalance(input: OpeningBalanceInput) { return request<{ balance: ApiBalance; transaction: ApiTransaction }>("/inventory/opening-balances", { method: "POST", body: JSON.stringify(input) }); }
export function adjustInventoryBalance(input: { balanceId: string; quantity: number; reservedQuantity: number; reason: string }) { return request<{ balance: ApiBalance; transaction: ApiTransaction }>("/inventory/balance-adjustments", { method: "POST", body: JSON.stringify(input) }); }
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
export function createCycleCountPlan(input:{periodMonth:string;locationIds:string[];assignedToId:string;priority:string;dueAt?:string;blindCount:boolean}){return request<ApiCycleCountPlan & {tasks:ApiInventoryTask[];createdTasks:number;skippedDuplicates:number;selectedLocations:number}>("/tasks/cycle-count-plans",{method:"POST",body:JSON.stringify(input)});}
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
      referenceNumber: "SUPPLIER-X",
      notes: "Created from the worker confirmation screen.",
      clientRequestId: `web-${crypto.randomUUID()}`,
    }),
  });
}

export function createPendingInventoryTransaction(
  extraction: InventoryExtraction,
  clientRequestId: string,
  recountTaskId?: string | null,
  shipmentTaskId?: string | null,
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
      taskId: shipmentTaskId ?? undefined,
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
    current.available += Math.max(
      0,
      balance.quantity - balance.reservedQuantity,
    );
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

import type { InventoryTransaction, LowStockItem } from "../types";

const API_BASE_URL = "http://localhost:4000/api";
let accessToken: string | null = null;

export function setInventoryAccessToken(token?: string) {
  accessToken = token ?? null;
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
export interface ApiInventoryTask { id:string; type:string; priority:"LOW"|"MEDIUM"|"HIGH"|"URGENT"; status:"OPEN"|"IN_PROGRESS"|"COMPLETED"|"CANCELLED"; title:string; description?:string|null; dueAt?:string|null; createdAt:string; startedAt?:string|null; completedAt?:string|null; product?:ApiProduct|null; location?:ApiLocation|null; assignedTo?:{id:string;employeeId:string;displayName:string}|null; }
export interface ApiTaskAssignee { id:string; employeeId:string; displayName:string; }

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
  discrepancyDifference?: number | null;
  discrepancyPercentage?: number | null;
  significantDiscrepancy?: boolean;
  product: ApiProduct;
  sourceLocation?: ApiLocation | null;
  destinationLocation?: ApiLocation | null;
  createdBy?: { displayName: string } | null;
  approvedBy?: { displayName: string } | null;
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
      | "USE"
      | "TRANSFER"
      | "CYCLE_COUNT"
      | "DAMAGE"
      | "LOSS"
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
  safetyNotice: string;
}

export interface InventorySnapshot {
  products: ApiProduct[];
  locations: ApiLocation[];
  balances: ApiBalance[];
  transactions: ApiTransaction[];
}

export interface ApiReorderDraft {
  id: string;
  activeKey?: string | null;
  currentStock: number;
  safetyStock: number;
  suggestedQuantity: number;
  status: "DRAFT" | "APPROVED" | "SENT" | "CANCELLED";
  emailStatus: "NOT_QUEUED" | "QUEUED" | "SENT" | "FAILED";
  reviewNotes?: string | null;
  approvedAt?: string | null;
  emailQueuedAt?: string | null;
  emailSentAt?: string | null;
  emailAttempts: number;
  emailError?: string | null;
  createdAt: string;
  product: ApiProduct;
  location: ApiLocation;
  approvedBy?: { displayName: string } | null;
  receivingTask?: ApiInventoryTask | null;
}
export interface ApiSystemHealth { status: "healthy" | "degraded"; checkedAt: string; services: Array<{ key: string; name: string; healthy: boolean; detail: string }>; }
export interface ApiSystemUser { id: string; employeeId: string; email: string; displayName: string; role: "WORKER" | "MANAGER" | "ADMINISTRATOR"; active: boolean; lastLoginAt?: string | null; createdAt: string; updatedAt: string; _count: { createdTransactions: number; assignedTasks: number }; }
export interface ApiUserAccessAudit { id: string; action: string; actorUsername: string; actorEmail?: string | null; targetUserId: string; targetEmployeeId: string; targetDisplayName: string; details?: string | null; createdAt: string; }
export interface CreateSystemUserInput {
  employeeId: string;
  displayName: string;
  email: string;
  role: "WORKER" | "MANAGER";
  temporaryPassword: string;
}
export type UpdateSystemUserInput = Omit<CreateSystemUserInput, "temporaryPassword">;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
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

export function deleteInventoryProduct(id: string) {
  return request<ApiProduct>(`/inventory/products/${id}`, { method: "DELETE" });
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
export function fetchInventoryTasks(){return request<ApiInventoryTask[]>("/tasks");}
export function fetchTaskAssignees(){return request<ApiTaskAssignee[]>("/tasks/assignees");}
export function createInventoryTask(input:{type:string;priority:string;title:string;description?:string;dueAt?:string;assignedToId:string;productId?:string;locationId?:string}){return request<ApiInventoryTask>("/tasks",{method:"POST",body:JSON.stringify(input)});}
export function startInventoryTask(id:string){return request<ApiInventoryTask>(`/tasks/${id}/start`,{method:"POST"});}
export function completeInventoryTask(id:string){return request<ApiInventoryTask>(`/tasks/${id}/complete`,{method:"POST"});}

export function fetchReorderDrafts() {
  return request<ApiReorderDraft[]>("/inventory/reorder-drafts");
}

export function refreshReorderDrafts() {
  return request<ApiReorderDraft[]>("/inventory/reorder-drafts/refresh", {
    method: "POST",
  });
}

function reviewReorderDraft(
  draftId: string,
  action: "approve" | "cancel",
  note?: string,
  quantity?: number,
) {
  return request<ApiReorderDraft>(
    `/inventory/reorder-drafts/${draftId}/${action}`,
    {
      method: "POST",
      body: JSON.stringify({
        note: note?.trim() || undefined,
        quantity,
      }),
    },
  );
}

export function approveReorderDraft(
  draftId: string,
  note?: string,
  quantity?: number,
) {
  return reviewReorderDraft(draftId, "approve", note, quantity);
}

export function cancelReorderDraft(draftId: string, note?: string) {
  return reviewReorderDraft(draftId, "cancel", note);
}

export function queueReorderEmail(draftId: string) {
  return request<ApiReorderDraft>(
    `/inventory/reorder-drafts/${draftId}/queue-email`,
    { method: "POST" },
  );
}

export function retryReorderEmail(draftId: string) {
  return request<ApiReorderDraft>(
    `/inventory/reorder-drafts/${draftId}/retry-email`,
    { method: "POST" },
  );
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
      referenceNumber: fields.referenceNumber ?? undefined,
      notes: fields.notes ?? undefined,
      transcript: extraction.transcript,
      evidenceId: extraction.evidenceId ?? undefined,
      clientRequestId,
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

  const response = await fetch(`${API_BASE_URL}/speech/transcribe`, {
    method: "POST",
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
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
            : transaction.status === "RECOUNT_REQUESTED"
              ? "Recount requested"
          : transaction.status === "APPROVED"
            ? "Approved"
            : "Pending",
    };
  });
}

export function mapLowStock(balances: ApiBalance[]): LowStockItem[] {
  return balances
    .filter(
      (balance) =>
        balance.quantity - balance.reservedQuantity < balance.product.safetyStock,
    )
    .map((balance) => {
      const available = balance.quantity - balance.reservedQuantity;
      const criticalLevel = Math.max(1, Math.floor(balance.product.safetyStock / 2));

      return {
        item: balance.product.name,
        code: balance.product.sku,
        available,
        threshold: balance.product.safetyStock,
        status: available <= criticalLevel ? "Critical" : "Low",
      };
    });
}

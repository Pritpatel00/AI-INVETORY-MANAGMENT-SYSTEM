import {
  confirmInventoryTransaction,
  createPendingInventoryTransaction,
  type InventoryExtraction,
} from "../api/inventory-api";

const databaseName = "nirka-inventory-offline";
const databaseVersion = 1;
const storeName = "pending-updates";

export const offlineQueueChangedEvent = "nirka-offline-queue-changed";

export interface OfflineInventoryUpdate {
  id: string;
  ownerId: string;
  clientRequestId: string;
  extraction: InventoryExtraction;
  queuedAt: string;
  attempts: number;
  lastError?: string;
}

export interface OfflineSyncResult {
  synced: number;
  remaining: number;
  lastError?: string;
}

function openOfflineDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        const store = database.createObjectStore(storeName, { keyPath: "id" });
        store.createIndex("ownerId", "ownerId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Offline storage could not be opened."));
  });
}

function waitForRequest<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Offline storage request failed."));
  });
}

function waitForTransaction(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Offline storage update failed."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Offline storage update stopped."));
  });
}

function announceQueueChange() {
  window.dispatchEvent(new Event(offlineQueueChangedEvent));
}

export async function listOfflineInventoryUpdates(ownerId: string) {
  const database = await openOfflineDatabase();
  try {
    const transaction = database.transaction(storeName, "readonly");
    const completion = waitForTransaction(transaction);
    const request = transaction
      .objectStore(storeName)
      .index("ownerId")
      .getAll(ownerId);
    const records = await waitForRequest(
      request as IDBRequest<OfflineInventoryUpdate[]>,
    );
    await completion;
    return records.sort((left, right) =>
      left.queuedAt.localeCompare(right.queuedAt),
    );
  } finally {
    database.close();
  }
}

export async function countOfflineInventoryUpdates(ownerId: string) {
  return (await listOfflineInventoryUpdates(ownerId)).length;
}

export async function enqueueOfflineInventoryUpdate(input: {
  ownerId: string;
  clientRequestId: string;
  extraction: InventoryExtraction;
}) {
  const database = await openOfflineDatabase();
  const update: OfflineInventoryUpdate = {
    id: input.clientRequestId,
    ownerId: input.ownerId,
    clientRequestId: input.clientRequestId,
    extraction: input.extraction,
    queuedAt: new Date().toISOString(),
    attempts: 0,
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

async function removeOfflineInventoryUpdate(id: string) {
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

async function recordOfflineSyncFailure(
  update: OfflineInventoryUpdate,
  error: unknown,
) {
  const database = await openOfflineDatabase();
  const message =
    error instanceof Error
      ? error.message.slice(0, 300)
      : "Synchronization failed.";
  try {
    const transaction = database.transaction(storeName, "readwrite");
    const completion = waitForTransaction(transaction);
    transaction.objectStore(storeName).put({
      ...update,
      attempts: update.attempts + 1,
      lastError: message,
    } satisfies OfflineInventoryUpdate);
    await completion;
  } finally {
    database.close();
  }
  return message;
}

export async function synchronizeOfflineInventoryUpdates(
  ownerId: string,
): Promise<OfflineSyncResult> {
  const updates = await listOfflineInventoryUpdates(ownerId);
  let synced = 0;
  let lastError: string | undefined;

  for (const update of updates) {
    try {
      const transaction = await createPendingInventoryTransaction(
        update.extraction,
        update.clientRequestId,
      );
      await confirmInventoryTransaction(transaction.id);
      await removeOfflineInventoryUpdate(update.id);
      synced += 1;
    } catch (error) {
      lastError = await recordOfflineSyncFailure(update, error);
      break;
    }
  }

  const remaining = await countOfflineInventoryUpdates(ownerId);
  announceQueueChange();
  return { synced, remaining, lastError };
}

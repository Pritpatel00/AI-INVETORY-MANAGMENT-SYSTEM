import { useEffect, useState } from "react";

export interface NetworkStatusState {
  isOnline: boolean;
  pendingSyncCount: number;
  syncState: "idle" | "syncing" | "complete" | "error";
  setPendingSyncCount: (count: number) => void;
  setSyncState: (state: "idle" | "syncing" | "complete" | "error") => void;
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "complete" | "error">("idle");

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if ("serviceWorker" in navigator) {
      if (import.meta.env.PROD) {
        navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      } else {
        navigator.serviceWorker
          .getRegistrations()
          .then((registrations) =>
            Promise.all(registrations.map((r) => r.unregister())),
          )
          .then(() => caches.keys())
          .then((keys) =>
            Promise.all(
              keys
                .filter((key) => key.startsWith("nirka-inventory-shell-"))
                .map((key) => caches.delete(key)),
            ),
          )
          .catch(() => undefined);
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, pendingSyncCount, syncState, setPendingSyncCount, setSyncState };
}

export function useOfflineSync(
  loggedIn: boolean,
  showingWorkerInterface: boolean,
  isOnline: boolean,
  pendingSyncCount: number,
  syncState: "idle" | "syncing" | "complete" | "error",
  setPendingSyncCount: (count: number) => void,
  setSyncState: (state: "idle" | "syncing" | "complete" | "error") => void,
  ownerId?: string,
  legacyOwnerIds: string[] = [],
) {
  useEffect(() => {
    if (!loggedIn || !showingWorkerInterface || !ownerId) {
      setPendingSyncCount(0);
      setSyncState("idle");
      return;
    }

    let active = true;
    let syncing = false;

    const refreshAndSynchronize = async () => {
      try {
        const {
          countOfflineInventoryUpdates,
          migrateOfflineInventoryOwner,
          synchronizeOfflineInventoryUpdates,
        } = await import("../offline/offline-queue");
        await migrateOfflineInventoryOwner(ownerId.slice("nirka-user:".length), legacyOwnerIds);
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
      const { offlineQueueChangedEvent } = await import("../offline/offline-queue");
      const handleQueueChange = () => void refreshAndSynchronize();
      window.addEventListener(offlineQueueChangedEvent, handleQueueChange);
      const timer = window.setInterval(() => {
        if (navigator.onLine) void refreshAndSynchronize();
      }, 30_000);
      void refreshAndSynchronize();

      return () => {
        active = false;
        window.clearInterval(timer);
        window.removeEventListener(offlineQueueChangedEvent, handleQueueChange);
      };
    };

    const cleanup = setup();
    return () => { void cleanup.then((fn) => fn()); };
  }, [isOnline, loggedIn, showingWorkerInterface, ownerId, legacyOwnerIds.join(","), setPendingSyncCount, setSyncState]);
}

import type { InventoryTransaction, LowStockItem } from "../types";

// Fresh-start build: no demonstration transactions or low-stock placeholders.
// The worker and manager screens render live data from the inventory API and
// show empty states until the first real transaction is created.
export const recentTransactions: InventoryTransaction[] = [];

export const lowStock: LowStockItem[] = [];

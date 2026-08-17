import type { Role } from "../types";
import type { InventoryExtraction } from "../api/inventory-api";

export function formatAction(action: InventoryExtraction["fields"]["action"]) {
  if (!action) return "";
  return action
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

export function taskTypeLabel(type: string) {
  const labels: Record<string, string> = {
    RECOUNT: "Recount",
    CYCLE_COUNT: "Cycle count",
    RECEIVE: "Receive",
    PICK: "Pick",
    SHIP: "Ship",
    USE: "Use",
    TRANSFER: "Transfer",
    STOCK_VERIFY: "Stock verify",
    DAMAGE_INSPECTION: "Damage inspection",
    DAMAGE: "Damage",
    LOSS: "Loss",
  };
  return labels[type] ?? type.replaceAll("_", " ");
}

export function formatTaskDue(dueAt?: string | null) {
  if (!dueAt) return "";
  const date = new Date(dueAt);
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, now))
    return `Due today · ${new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(date)}`;
  if (sameDay(date, tomorrow))
    return `Due tomorrow · ${new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(date)}`;
  return `Due ${new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(date)}`;
}

export function defaultDueDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(17, 0, 0, 0);
  return date;
}

export function formatDateTimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function defaultTaskDue() {
  return formatDateTimeLocal(defaultDueDate(0));
}

export function dueDateOffset(days: number) {
  return formatDateTimeLocal(defaultDueDate(days));
}

export function formatClock(iso?: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function priorityTone(priority: string) {
  if (priority === "URGENT" || priority === "HIGH") return "bg-[#fff1e3] text-[#c56c08]";
  if (priority === "LOW") return "bg-[#eef2f7] text-[#6c829f]";
  return "bg-[#edf4ff] text-[#155eef]";
}

export function taskStatusTone(status: string) {
  if (status === "COMPLETED") return "bg-[#eaf8f1] text-[#16865b]";
  if (status === "CANCELLED") return "bg-[#eef2f7] text-[#7b8fa9]";
  if (status === "IN_PROGRESS") return "bg-[#f2efff] text-[#6349c1]";
  return "bg-[#edf4ff] text-[#155eef]";
}

export function formatRoleLabel(role: Role) {
  if (role === "administrator") return "Administrator";
  if (role === "manager") return "Manager";
  return "Warehouse Executive";
}

export function roleLabel(role: Role) {
  return role === "worker"
    ? "Warehouse Executive"
    : role === "manager"
      ? "Inventory Manager"
      : "System Administrator";
}

export function formatClarificationValue(field: string, result: InventoryExtraction) {
  if (field === "action") return formatAction(result.fields.action);
  if (field === "product" && result.fields.product) {
    return `${result.fields.product.name} (${result.fields.product.sku})`;
  }
  if (field === "quantity" && result.fields.quantity !== null) {
    const unit = result.fields.product?.unit ?? "unit";
    return `${result.fields.quantity} ${unit}${result.fields.quantity === 1 ? "" : "s"}`;
  }
  if (field === "sourceLocation") return result.fields.sourceLocation?.name ?? "";
  if (field === "destinationLocation") return result.fields.destinationLocation?.name ?? "";
  return "";
}

export function clarificationRetryHelp(field: string) {
  if (field === "action") return "Please say Receive, Ship, Use, Transfer, Cycle count, Damage, or Loss.";
  if (field === "product") return "Please say the item name or SKU clearly.";
  if (field === "quantity") return "Please say only the number of units.";
  return "Please say the warehouse location clearly.";
}

export const pageDescriptions: Record<Role, Record<string, string>> = {
  worker: {
    Overview: "See today\u2019s work, stock activity and anything that needs your attention.",
    "My transactions": "See every inventory transaction included in today\u2019s total.",
    "Cycle counts": "Review every physical count submitted today and its current status.",
    "Posted today": "See the validated inventory updates successfully posted today.",
    "Voice entry": "Record one clear inventory action and review it before stock changes.",
    "Task queue": "Complete the warehouse work assigned to you by a manager.",
    "My history": "Review your submitted, posted and pending inventory updates.",
    Settings: "Check your microphone, speaker and Warehouse Executive access.",
  },
  manager: {
    Overview: "Monitor approvals, stock accuracy, low-stock risks and daily priorities.",
    Discrepancies: "Review physical-count differences, approve adjustments, request recounts and export manager reports.",
    Reservations: "Create stock requests and protect available quantity for confirmed demand.",
    Transactions: "Review pending stock changes, then search and export the complete authorized inventory ledger.",
    "Purchase Items": "View only the items below their safety level and the quantity that should be purchased.",
    "Task planning": "Assign clear daily warehouse work to available executives.",
    Catalog: "Maintain product units, safety stock and reorder settings.",
    Locations: "Manage warehouses, receiving areas, zones, shelves and bins used in inventory movements.",
  },
  administrator: {
    Overview: "See user access, item availability and the health of essential services.",
    Items: "Search, track and edit every item from one clear workspace.",
    "Audit transactions": "Review the complete read-only inventory ledger, stock adjustments and audit evidence.",
    "User access": "Create accounts, update roles and control active user access.",
    "System health": "Check the live availability of database, identity, AI and supporting services.",
  },
};

export function pageDescription(role: Role, page: string) {
  return pageDescriptions[role][page] ?? pageDescriptions[role].Overview;
}

export function resolveManagerPage(page: string) {
  if (page === "Approvals" || page === "Audit history") return "Transactions";
  if (page === "Suppliers") return "Catalog";
  if (page === "Products & rules" || page === "Opening stock" || page === "Audit controls") return "Catalog";
  return page;
}

export const STOCK_OUT_ACTIONS = new Set(["SHIP", "USE", "TRANSFER"]);

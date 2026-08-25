export type Role = "worker" | "manager" | "administrator";

export type VoiceState =
  | "idle"
  | "recording"
  | "transcribing"
  | "review"
  | "extracting"
  | "extracted";

export interface InventoryTransaction {
  id: string;
  type: string;
  item: string;
  quantity: string;
  time: string;
  status:
    | "Posted"
    | "Approved"
    | "Pending"
    | "Rejected"
    | "Cancelled"
    | "Recount requested"
    | "Awaiting review";
}

export interface LowStockItem {
  item: string;
  code: string;
  available: number;
  threshold: number;
  status: "Critical" | "Low";
}

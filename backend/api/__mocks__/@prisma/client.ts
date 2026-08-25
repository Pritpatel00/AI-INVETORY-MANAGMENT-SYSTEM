/**
 * Minimal Prisma client mock for Jest tests.
 * Only the InventoryAction enum is needed by the rules engine tests.
 */
export const InventoryAction = {
  RECEIVE: "RECEIVE",
  SHIP: "SHIP",
  USE: "USE",
  TRANSFER: "TRANSFER",
  CYCLE_COUNT: "CYCLE_COUNT",
  DAMAGE: "DAMAGE",
  LOSS: "LOSS",
} as const;

export type InventoryAction = (typeof InventoryAction)[keyof typeof InventoryAction];

export const LocationSource = {
  SPOKEN: "SPOKEN",
  RECEIVING_DEFAULT: "RECEIVING_DEFAULT",
  WORKER_ZONE: "WORKER_ZONE",
  CLARIFIED: "CLARIFIED",
} as const;

export type LocationSource = (typeof LocationSource)[keyof typeof LocationSource];

export const DiscrepancySeverity = {
  NONE: "NONE",
  MINOR: "MINOR",
  MEDIUM: "MEDIUM",
  MAJOR: "MAJOR",
  CRITICAL: "CRITICAL",
} as const;

export type DiscrepancySeverity = (typeof DiscrepancySeverity)[keyof typeof DiscrepancySeverity];

export const DiscrepancyStatus = {
  OPEN: "OPEN",
  AWAITING_REVIEW: "AWAITING_REVIEW",
  RECOUNT_REQUESTED: "RECOUNT_REQUESTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  RESOLVED_AS_TRANSFER: "RESOLVED_AS_TRANSFER",
  CLOSED: "CLOSED",
} as const;

export type DiscrepancyStatus = (typeof DiscrepancyStatus)[keyof typeof DiscrepancyStatus];

export const NotificationType = {
  NEW_DISCREPANCY: "NEW_DISCREPANCY",
  MAJOR_CRITICAL_DISCREPANCY: "MAJOR_CRITICAL_DISCREPANCY",
  RECOUNT_ASSIGNED: "RECOUNT_ASSIGNED",
  RECOUNT_COMPLETED: "RECOUNT_COMPLETED",
  DISCREPANCY_APPROVED: "DISCREPANCY_APPROVED",
  DISCREPANCY_REJECTED: "DISCREPANCY_REJECTED",
  RESOLVED_AS_TRANSFER: "RESOLVED_AS_TRANSFER",
  SHIPMENT_TASK_ASSIGNED: "SHIPMENT_TASK_ASSIGNED",
  SHIPMENT_PREPARED: "SHIPMENT_PREPARED",
  SHIPMENT_COMPLETED: "SHIPMENT_COMPLETED",
  SHIPMENT_CANCELLED: "SHIPMENT_CANCELLED",
  CYCLE_COUNT_PLAN_ASSIGNED: "CYCLE_COUNT_PLAN_ASSIGNED",
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const UserRole = {
  WORKER: "WORKER",
  MANAGER: "MANAGER",
  ADMINISTRATOR: "ADMINISTRATOR",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const DiscrepancyReason = {
  COUNT_DIFFERENCE: "COUNT_DIFFERENCE",
  UNRECORDED_RECEIPT: "UNRECORDED_RECEIPT",
  UNRECORDED_SHIPMENT: "UNRECORDED_SHIPMENT",
  WRONG_LOCATION: "WRONG_LOCATION",
  DAMAGE: "DAMAGE",
  LOSS: "LOSS",
  COUNTING_ERROR: "COUNTING_ERROR",
  SYSTEM_ERROR: "SYSTEM_ERROR",
  OTHER: "OTHER",
} as const;

export type DiscrepancyReason = (typeof DiscrepancyReason)[keyof typeof DiscrepancyReason];

export const DiscrepancyAuditAction = {
  CASE_CREATED: "CASE_CREATED",
  WORKER_CONFIRMED: "WORKER_CONFIRMED",
  REVIEW_OPENED: "REVIEW_OPENED",
  RECOUNT_REQUESTED: "RECOUNT_REQUESTED",
  RECOUNT_COMPLETED: "RECOUNT_COMPLETED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  RESOLVED_AS_TRANSFER: "RESOLVED_AS_TRANSFER",
  PHOTO_UPLOADED: "PHOTO_UPLOADED",
  CASE_CLOSED: "CASE_CLOSED",
} as const;

export type DiscrepancyAuditAction = (typeof DiscrepancyAuditAction)[keyof typeof DiscrepancyAuditAction];

export const TransactionStatus = {
  PENDING: "PENDING",
  RECOUNT_REQUESTED: "RECOUNT_REQUESTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  POSTED: "POSTED",
  CANCELLED: "CANCELLED",
} as const;

export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

export const ReorderStatus = {
  DRAFT: "DRAFT",
  APPROVED: "APPROVED",
  CANCELLED: "CANCELLED",
} as const;

export type ReorderStatus = (typeof ReorderStatus)[keyof typeof ReorderStatus];

export const StockCondition = {
  GOOD: "GOOD",
  DAMAGED: "DAMAGED",
  HOLD: "HOLD",
} as const;

export type StockCondition = (typeof StockCondition)[keyof typeof StockCondition];

export const TaskType = {
  RECOUNT: "RECOUNT",
  CYCLE_COUNT: "CYCLE_COUNT",
  RECEIVE: "RECEIVE",
  PICK: "PICK",
  SHIP: "SHIP",
  TRANSFER: "TRANSFER",
  STOCK_VERIFY: "STOCK_VERIFY",
  DAMAGE_INSPECTION: "DAMAGE_INSPECTION",
} as const;

export type TaskType = (typeof TaskType)[keyof typeof TaskType];

export const TaskPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TaskStatus = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export class PrismaClient {
  $on() {}
  $connect() {}
  $disconnect() {}
}

export class Prisma {
  static TransactionIsolationLevel = {};
  static PrismaClientKnownRequestError = class extends Error {
    code: string;
    constructor(
      message: string,
      params: { code: string; clientVersion: string },
    ) {
      super(message);
      this.code = params.code;
    }
  };
}

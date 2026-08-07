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

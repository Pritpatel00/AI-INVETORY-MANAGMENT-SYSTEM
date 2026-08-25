import {
  InventoryAction,
  TransactionStatus,
  UserRole,
} from "@prisma/client";

import type { AuthenticatedUser } from "../auth/auth-user";
import { DiscrepancyAuditService } from "../discrepancies/discrepancy-audit.service";
import { DiscrepancyRulesService } from "../discrepancies/discrepancy-rules.service";
import { DiscrepanciesService } from "../discrepancies/discrepancies.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { TasksService } from "../tasks/tasks.service";
import { InventoryService } from "./inventory.service";
import { InventoryRulesEngine } from "./rules/inventory-rules.engine";

const managerActor: AuthenticatedUser = {
  subject: "manager-subject",
  username: "manager-001",
  email: "manager@example.com",
  roles: ["manager"],
};

describe("InventoryService legacy automatic-transaction approval compatibility", () => {
  test.each([
    {
      label: "transfer",
      action: InventoryAction.TRANSFER,
      quantity: 100,
      sourceLocationId: "packing-id",
      expectedPacking: 0,
      expectedStorage: 100,
    },
    {
      label: "receive",
      action: InventoryAction.RECEIVE,
      quantity: 5,
      sourceLocationId: null,
      expectedPacking: 100,
      expectedStorage: 5,
    },
  ])(
    "posts a legacy pending $label after an explicit manager decision",
    async ({ action, quantity, sourceLocationId, expectedPacking, expectedStorage }) => {
    const manager = {
      id: "manager-id",
      employeeId: "MANAGER-001",
      email: managerActor.email,
      displayName: "Inventory Manager",
      role: UserRole.MANAGER,
    };
    const product = {
      id: "product-id",
      sku: "ITEM-104",
      name: "Helmet",
      unit: "unit",
      active: true,
      safetyStock: 0,
      reorderQuantity: 0,
      controlled: false,
    };
    const transaction = {
      id: `${action.toLowerCase()}-id`,
      action,
      status: TransactionStatus.PENDING,
      quantity,
      productId: product.id,
      sourceLocationId,
      destinationLocationId: "storage-id",
      createdById: "worker-id",
      confirmedAt: new Date(),
      postedAt: null as Date | null,
      approvedAt: null as Date | null,
      approvedById: null as string | null,
      reviewReasons: "Quantity 100 deviates significantly from the recent average.",
      product,
      sourceLocation: { id: "packing-id", code: "L002", name: "Packing" },
      destinationLocation: { id: "storage-id", code: "L004", name: "Storage 1" },
      createdBy: { id: "worker-id", displayName: "Warehouse Executive" },
      approvedBy: null,
    };
    const quantities = new Map([
      ["packing-id", 100],
      ["storage-id", 0],
    ]);
    const inventoryBalance = {
      findUnique: jest.fn(async ({ where }) => {
        const locationId = where.productId_locationId.locationId as string;
        return {
          quantity: quantities.get(locationId) ?? 0,
        };
      }),
      findMany: jest.fn(async () =>
        Array.from(quantities, ([locationId, quantity]) => ({
          locationId,
          quantity,
        })),
      ),
      update: jest.fn(async ({ where, data }) => {
        const locationId = where.productId_locationId.locationId as string;
        quantities.set(
          locationId,
          (quantities.get(locationId) ?? 0) - data.quantity.decrement,
        );
        return {};
      }),
      upsert: jest.fn(async ({ where, update, create }) => {
        const locationId = where.productId_locationId.locationId as string;
        quantities.set(
          locationId,
          quantities.has(locationId)
            ? (quantities.get(locationId) ?? 0) + update.quantity.increment
            : create.quantity,
        );
        return {};
      }),
    };
    const inventoryTransaction = {
      findUnique: jest.fn(async () => transaction),
      findUniqueOrThrow: jest.fn(async () => transaction),
      update: jest.fn(async ({ data }) => {
        Object.assign(transaction, data);
        return transaction;
      }),
    };
    const database = {
      $executeRawUnsafe: jest.fn(async () => 1),
      user: {
        findUnique: jest.fn(async () => manager),
        create: jest.fn(),
      },
      inventoryTransaction,
      inventoryBalance,
      product: {
        findUnique: jest.fn(async () => ({
          active: true,
          safetyStock: 0,
          reorderQuantity: 0,
        })),
      },
      reorderDraft: {
        findUnique: jest.fn(async () => null),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(async () => ({ count: 0 })),
      },
    };
    const prisma = {
      ...database,
      $transaction: jest.fn(async (operation: (client: typeof database) => unknown) =>
        operation(database),
      ),
    };
    const service = new InventoryService(
      prisma as unknown as PrismaService,
      new InventoryRulesEngine(),
      {} as TasksService,
      new DiscrepancyRulesService(),
      {} as DiscrepanciesService,
      {} as DiscrepancyAuditService,
      {} as NotificationsService,
    );

    const result = await service.approveTransaction(
      transaction.id,
      { note: `Approved legacy ${action.toLowerCase()}.` },
      managerActor,
    );

    expect(result.outcome).toBe("POSTED");
    expect(quantities.get("packing-id")).toBe(expectedPacking);
    expect(quantities.get("storage-id")).toBe(expectedStorage);
    expect(transaction.status).toBe(TransactionStatus.POSTED);
    },
  );
});

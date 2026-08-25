import {
  InventoryAction,
  TaskStatus,
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

const workerActor: AuthenticatedUser = {
  subject: "worker-subject",
  username: "worker-001",
  email: "worker@example.com",
  roles: ["worker"],
};

type MovementCase = {
  action: InventoryAction;
  quantity: number;
  sourceLocationId: string | null;
  destinationLocationId: string | null;
  expectedPacking: number;
  expectedStorage: number;
};

function createAssignedTaskFixture(input: MovementCase) {
  const worker = {
    id: "worker-id",
    employeeId: "WORKER-001",
    email: workerActor.email,
    displayName: "Warehouse Executive",
    role: UserRole.WORKER,
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
    id: `${input.action.toLowerCase()}-transaction-id`,
    taskId: "assigned-task-id",
    task: null,
    action: input.action,
    status: TransactionStatus.PENDING,
    quantity: input.quantity,
    productId: product.id,
    sourceLocationId: input.sourceLocationId,
    destinationLocationId: input.destinationLocationId,
    createdById: worker.id,
    confirmedAt: null as Date | null,
    postedAt: null as Date | null,
    approvedAt: null as Date | null,
    approvedById: null as string | null,
    reviewReasons: null as string | null,
    notes: "Assigned inventory task.",
    transcript: "Assigned inventory task.",
    product,
    sourceLocation: input.sourceLocationId
      ? { id: "packing-id", code: "L002", name: "Packing" }
      : null,
    destinationLocation: input.destinationLocationId
      ? { id: "storage-id", code: "L004", name: "Storage 1" }
      : null,
    createdBy: worker,
    approvedBy: null,
    _count: { evidence: 0 },
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
      const quantity =
        (quantities.get(locationId) ?? 0) - data.quantity.decrement;
      quantities.set(locationId, quantity);
      return { quantity };
    }),
    upsert: jest.fn(async ({ where, update, create }) => {
      const locationId = where.productId_locationId.locationId as string;
      const quantity = quantities.has(locationId)
        ? (quantities.get(locationId) ?? 0) + update.quantity.increment
        : create.quantity;
      quantities.set(locationId, quantity);
      return { quantity };
    }),
  };
  const inventoryTransaction = {
    findUnique: jest.fn(async () => transaction),
    findUniqueOrThrow: jest.fn(async () => transaction),
    findMany: jest.fn(async () => []),
    update: jest.fn(async ({ data }) => {
      Object.assign(transaction, data);
      return transaction;
    }),
  };
  const inventoryTask = {
    updateMany: jest.fn(async () => ({ count: 1 })),
  };
  const database = {
    $executeRawUnsafe: jest.fn(async () => 1),
    user: {
      findUnique: jest.fn(async () => worker),
      create: jest.fn(),
    },
    inventoryTransaction,
    inventoryBalance,
    inventoryTask,
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
    $transaction: jest.fn(
      async (operation: (client: typeof database) => unknown) =>
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

  return {
    service,
    transaction,
    inventoryTask,
    quantities,
  };
}

describe("InventoryService assigned task completion", () => {
  test.each<MovementCase>([
    {
      action: InventoryAction.RECEIVE,
      quantity: 5,
      sourceLocationId: null,
      destinationLocationId: "storage-id",
      expectedPacking: 100,
      expectedStorage: 5,
    },
    {
      action: InventoryAction.SHIP,
      quantity: 5,
      sourceLocationId: "packing-id",
      destinationLocationId: null,
      expectedPacking: 95,
      expectedStorage: 0,
    },
    {
      action: InventoryAction.TRANSFER,
      quantity: 20,
      sourceLocationId: "packing-id",
      destinationLocationId: "storage-id",
      expectedPacking: 80,
      expectedStorage: 20,
    },
  ])(
    "posts $action and closes its assigned worker task atomically",
    async (input) => {
      const fixture = createAssignedTaskFixture(input);

      const result = await fixture.service.confirmTransaction(
        fixture.transaction.id,
        workerActor,
      );

      expect(result.outcome).toBe("POSTED");
      expect(fixture.transaction.status).toBe(TransactionStatus.POSTED);
      expect(fixture.quantities.get("packing-id")).toBe(
        input.expectedPacking,
      );
      expect(fixture.quantities.get("storage-id")).toBe(
        input.expectedStorage,
      );
      expect(fixture.inventoryTask.updateMany).toHaveBeenCalledWith({
        where: {
          id: "assigned-task-id",
          status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
        },
        data: {
          status: TaskStatus.COMPLETED,
          completedAt: expect.any(Date),
        },
      });
    },
  );
});

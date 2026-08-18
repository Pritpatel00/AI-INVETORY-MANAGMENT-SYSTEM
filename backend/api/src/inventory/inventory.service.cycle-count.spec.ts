import {
  DiscrepancyStatus,
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
import { ReservationsService } from "../reservations/reservations.service";
import { InventoryService } from "./inventory.service";
import { InventoryRulesEngine } from "./rules/inventory-rules.engine";

const actor: AuthenticatedUser = {
  subject: "worker-subject",
  username: "worker-001",
  email: "worker@example.com",
  roles: ["worker"],
};

function createService(
  expectedQuantity: number,
  countedQuantity: number,
  recountTaskId: string | null = null,
  taskId: string | null = null,
) {
  const user = {
    id: "worker-id",
    employeeId: "WORKER-001",
    email: actor.email,
    displayName: "Warehouse Executive",
    role: UserRole.WORKER,
  };
  const product = {
    id: "product-id",
    sku: "ITEM-104",
    name: "Helmet",
    unit: "unit",
    active: true,
    safetyStock: 20,
    reorderQuantity: 50,
    controlled: false,
  };
  const sourceLocation = {
    id: "storage-1-id",
    code: "L004",
    name: "Storage 1",
    active: true,
  };
  const transaction = {
    id: "transaction-id",
    action: InventoryAction.CYCLE_COUNT,
    status: TransactionStatus.PENDING,
    quantity: countedQuantity,
    productId: product.id,
    sourceLocationId: sourceLocation.id,
    destinationLocationId: null,
    createdById: user.id,
    confirmedAt: null,
    postedAt: null,
    reviewReasons: null,
    notes: null,
    transcript: "Cycle count Helmet",
    recountTaskId,
    taskId,
    product,
    sourceLocation,
    destinationLocation: null,
    createdBy: user,
    approvedBy: null,
  };

  const inventoryTransaction = {
    findUnique: jest.fn().mockImplementation(() => Promise.resolve(transaction)),
    findUniqueOrThrow: jest
      .fn()
      .mockImplementation(() => Promise.resolve(transaction)),
    update: jest.fn().mockImplementation(({ data }) => {
      Object.assign(transaction, data);
      return Promise.resolve(transaction);
    }),
  };
  const inventoryBalance = {
    findUnique: jest.fn().mockResolvedValue({
      quantity: expectedQuantity,
      reservedQuantity: 0,
    }),
    findMany: jest.fn().mockResolvedValue([
      {
        locationId: "location-id",
        quantity: expectedQuantity,
        reservedQuantity: 0,
      },
    ]),
    upsert: jest.fn().mockResolvedValue({}),
  };
  const discrepancy = {
    findUnique: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({}),
  };
  const inventoryTask = {
    findUnique: jest.fn().mockResolvedValue(
      recountTaskId
        ? {
            id: recountTaskId,
            discrepancies: [
              {
                id: "discrepancy-id",
                caseNumber: "DSC-20260811-0001",
                status: DiscrepancyStatus.RECOUNT_REQUESTED,
              },
            ],
          }
        : null,
    ),
    update: jest.fn().mockResolvedValue({}),
  };
  const database = {
    $executeRawUnsafe: jest.fn().mockResolvedValue(1),
    user: {
      findUnique: jest.fn().mockResolvedValue(user),
      create: jest.fn(),
    },
    inventoryTransaction,
    inventoryBalance,
    discrepancy,
    inventoryTask,
    product: {
      findUnique: jest.fn().mockResolvedValue({
        active: true,
        safetyStock: product.safetyStock,
        reorderQuantity: product.reorderQuantity,
        supplier: null,
      }),
    },
    reorderDraft: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };
  const prisma = {
    ...database,
    $transaction: jest.fn(async (operation: unknown) => {
      if (typeof operation === "function") {
        return operation(database);
      }
      return operation;
    }),
  };
  const discrepancies = {
    createForCycleCount: jest.fn().mockResolvedValue({ id: "case-id" }),
  };
  const auditService = {
    write: jest.fn().mockResolvedValue({}),
  };
  const notifications = {
    createForManagers: jest.fn().mockResolvedValue(undefined),
  };

  const service = new InventoryService(
    prisma as unknown as PrismaService,
    new InventoryRulesEngine(),
    {} as TasksService,
    new DiscrepancyRulesService(),
    discrepancies as unknown as DiscrepanciesService,
    auditService as unknown as DiscrepancyAuditService,
    notifications as unknown as NotificationsService,
    {} as ReservationsService,
  );

  return {
    service,
    transaction,
    inventoryBalance,
    discrepancies,
    discrepancy,
    inventoryTask,
    auditService,
    notifications,
  };
}

describe("InventoryService cycle-count confirmation", () => {
  test("posts automatically when the count matches stock at the same location", async () => {
    const context = createService(100, 100);

    const result = await context.service.confirmTransaction(
      context.transaction.id,
      actor,
    );

    expect(result.outcome).toBe("POSTED");
    expect(context.transaction.status).toBe(TransactionStatus.POSTED);
    expect(context.inventoryBalance.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { quantity: 100 } }),
    );
    expect(context.discrepancies.createForCycleCount).not.toHaveBeenCalled();
  });

  test("keeps the transaction pending when the same-location stock differs", async () => {
    const context = createService(0, 100);

    const result = await context.service.confirmTransaction(
      context.transaction.id,
      actor,
    );

    expect(result.outcome).toBe("PENDING_REVIEW");
    expect(context.transaction.status).toBe(TransactionStatus.PENDING);
    expect(context.transaction.reviewReasons).toContain(
      "expected 0, counted 100",
    );
    expect(context.discrepancies.createForCycleCount).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        expectedQuantity: 0,
        countedQuantity: 100,
        locationId: "storage-1-id",
      }),
    );
    expect(context.inventoryBalance.upsert).not.toHaveBeenCalled();
  });

  test("closes the original discrepancy when a linked recount matches system stock", async () => {
    const context = createService(100, 100, "recount-task-id");

    const result = await context.service.confirmTransaction(
      context.transaction.id,
      actor,
    );

    expect(result.outcome).toBe("POSTED");
    expect(context.inventoryTask.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "recount-task-id" },
        data: expect.objectContaining({ status: "COMPLETED" }),
      }),
    );
    expect(context.discrepancy.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "discrepancy-id" },
        data: expect.objectContaining({ status: DiscrepancyStatus.CLOSED }),
      }),
    );
    expect(context.auditService.write).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: "RECOUNT_COMPLETED" }),
    );
    expect(context.notifications.createForManagers).toHaveBeenCalled();
    expect(context.discrepancies.createForCycleCount).not.toHaveBeenCalled();
  });

  test("a non-matching recount completes the worker task but returns the case to manager review", async () => {
    const context = createService(100, 80, "recount-task-id");

    const result = await context.service.confirmTransaction(
      context.transaction.id,
      actor,
    );

    expect(result.outcome).toBe("PENDING_REVIEW");
    // The recount task is completed in both paths so it leaves the worker queue.
    expect(context.inventoryTask.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "recount-task-id" },
        data: expect.objectContaining({ status: "COMPLETED" }),
      }),
    );
    // The original case returns to review with the recount numbers — it is
    // never duplicated and never closed while the count still differs.
    expect(context.discrepancy.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "discrepancy-id" },
        data: expect.objectContaining({
          status: DiscrepancyStatus.AWAITING_REVIEW,
          countedQuantity: 80,
        }),
      }),
    );
    expect(context.auditService.write).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: "RECOUNT_COMPLETED" }),
    );
    expect(context.inventoryBalance.upsert).not.toHaveBeenCalled();
    expect(context.discrepancies.createForCycleCount).not.toHaveBeenCalled();
  });

  test("a matching recount never creates a duplicate discrepancy or a second recount task", async () => {
    const context = createService(100, 100, "recount-task-id");

    await context.service.confirmTransaction(context.transaction.id, actor);

    // Exactly one task completion is recorded (the original linked task).
    expect(context.inventoryTask.update).toHaveBeenCalledTimes(1);
    expect(context.inventoryTask.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "recount-task-id" } }),
    );
    // No new discrepancy case is created for the matching recount.
    expect(context.discrepancies.createForCycleCount).not.toHaveBeenCalled();
    expect(context.discrepancy.update).toHaveBeenCalledTimes(1);
  });

  test("completes the linked Month-End Cycle Count task when the count matches", async () => {
    const context = createService(100, 100, null, "count-task-id");

    const result = await context.service.confirmTransaction(
      context.transaction.id,
      actor,
    );

    expect(result.outcome).toBe("POSTED");
    // The assigned cycle-count task is completed atomically with the posted
    // count so it leaves the worker's open-task queue.
    expect(context.inventoryTask.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "count-task-id" },
        data: expect.objectContaining({ status: "COMPLETED" }),
      }),
    );
    expect(context.discrepancies.createForCycleCount).not.toHaveBeenCalled();
  });

  test("completes the linked task and creates a discrepancy when the count differs", async () => {
    const context = createService(0, 100, null, "count-task-id");

    const result = await context.service.confirmTransaction(
      context.transaction.id,
      actor,
    );

    expect(result.outcome).toBe("PENDING_REVIEW");
    // The count is finished even though it goes to manager review, so the
    // task disappears from the worker queue while the case waits for review.
    expect(context.inventoryTask.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "count-task-id" },
        data: expect.objectContaining({ status: "COMPLETED" }),
      }),
    );
    expect(context.discrepancies.createForCycleCount).toHaveBeenCalled();
    expect(context.inventoryBalance.upsert).not.toHaveBeenCalled();
  });
});

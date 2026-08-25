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

function createDamageReviewFixture() {
  const manager = {
    id: "manager-id",
    employeeId: "MANAGER-001",
    email: managerActor.email,
    displayName: "Inventory Manager",
    role: UserRole.MANAGER,
  };
  const product = {
    id: "product-id",
    sku: "ITEM-108",
    name: "Cable",
    unit: "unit",
    active: true,
    safetyStock: 0,
    reorderQuantity: 0,
    controlled: false,
  };
  const transaction = {
    id: "damage-id",
    taskId: "damage-task-id",
    task: null,
    action: InventoryAction.DAMAGE,
    status: TransactionStatus.PENDING,
    quantity: 3,
    productId: product.id,
    sourceLocationId: "storage-id",
    destinationLocationId: null,
    createdById: "worker-id",
    confirmedAt: new Date(),
    postedAt: null as Date | null,
    approvedAt: null as Date | null,
    approvedById: null as string | null,
    reviewReasons: "Action DAMAGE always requires manager review.",
    reviewNotes: null as string | null,
    notes: "Worker reported damaged packaging.",
    product,
    sourceLocation: { id: "storage-id", code: "L004", name: "Storage 1" },
    destinationLocation: null,
    createdBy: { id: "worker-id", displayName: "Warehouse Executive" },
    approvedBy: null,
    _count: { evidence: 1 },
  };
  let quantity = 20;
  const inventoryBalance = {
    findUnique: jest.fn(async () => ({ quantity })),
    findMany: jest.fn(async () => [
      { locationId: "storage-id", quantity },
    ]),
    update: jest.fn(async ({ data }) => {
      quantity -= data.quantity.decrement;
      return { quantity };
    }),
    upsert: jest.fn(),
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
    inventoryTask,
  };
  const prisma = {
    ...database,
    $transaction: jest.fn(
      async (operation: (client: typeof database) => unknown) =>
        operation(database),
    ),
  };
  const tasks = {
    createRecountTask: jest.fn(),
  } as unknown as TasksService;
  const service = new InventoryService(
    prisma as unknown as PrismaService,
    new InventoryRulesEngine(),
    tasks,
    new DiscrepancyRulesService(),
    {} as DiscrepanciesService,
    {} as DiscrepancyAuditService,
    {} as NotificationsService,
  );

  return {
    service,
    transaction,
    inventoryBalance,
    inventoryTransaction,
    inventoryTask,
    tasks,
    getQuantity: () => quantity,
  };
}

describe("InventoryService damage review", () => {
  it("requires an adjustment reason before posting damaged stock", async () => {
    const fixture = createDamageReviewFixture();

    await expect(
      fixture.service.approveTransaction(
        fixture.transaction.id,
        { note: "   " },
        managerActor,
      ),
    ).rejects.toThrow(
      "An adjustment reason is required before damaged stock can be posted.",
    );

    expect(fixture.getQuantity()).toBe(20);
    expect(fixture.inventoryBalance.update).not.toHaveBeenCalled();
    expect(fixture.inventoryTransaction.update).not.toHaveBeenCalled();
  });

  it("posts damaged stock with the adjustment reason in the audit record", async () => {
    const fixture = createDamageReviewFixture();

    const result = await fixture.service.approveTransaction(
      fixture.transaction.id,
      { note: "Packaging crushed during handling." },
      managerActor,
    );

    expect(result.outcome).toBe("POSTED");
    expect(fixture.getQuantity()).toBe(17);
    expect(fixture.transaction.status).toBe(TransactionStatus.POSTED);
    expect(fixture.transaction.reviewNotes).toBe(
      "Packaging crushed during handling.",
    );
    expect(fixture.transaction.notes).toContain(
      "Adjustment Reason: Packaging crushed during handling.",
    );
  });

  it("closes the assigned worker task when damage enters manager review", async () => {
    const fixture = createDamageReviewFixture();

    const result = await fixture.service.confirmTransaction(
      fixture.transaction.id,
      managerActor,
    );

    expect(result.outcome).toBe("PENDING_REVIEW");
    expect(fixture.inventoryTransaction.update).toHaveBeenCalled();
    expect(fixture.inventoryBalance.update).not.toHaveBeenCalled();
    expect(fixture.inventoryTask.updateMany).toHaveBeenCalledWith({
      where: {
        id: "damage-task-id",
        status: { in: expect.any(Array) },
      },
      data: {
        status: expect.any(String),
        completedAt: expect.any(Date),
      },
    });
  });

  it("does not allow a recount for damaged stock", async () => {
    const fixture = createDamageReviewFixture();

    await expect(
      fixture.service.requestRecount(
        fixture.transaction.id,
        { note: "Please recount." },
        managerActor,
      ),
    ).rejects.toThrow(
      "Damage transactions cannot be sent for recount.",
    );

    expect(fixture.tasks.createRecountTask).not.toHaveBeenCalled();
    expect(fixture.transaction.status).toBe(TransactionStatus.PENDING);
  });
});

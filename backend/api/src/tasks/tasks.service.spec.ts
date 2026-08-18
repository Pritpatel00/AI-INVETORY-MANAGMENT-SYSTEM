import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { TaskPriority, TaskStatus, TaskType, UserRole } from "@prisma/client";

import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { TasksService } from "./tasks.service";

const managerActor = {
  subject: "manager-subject",
  username: "manager1",
  email: "manager@example.com",
  roles: ["manager"],
};

function createService(prisma: PrismaService) {
  return new TasksService(prisma, undefined as never, undefined as never);
}

function createPrismaMock(available = 90) {
  const inventoryTaskCreate = jest.fn(async ({ data }: { data: object }) => ({
    id: "task-transfer-1",
    ...data,
  }));
  const inventoryBalanceFindUnique = jest.fn(async () => ({
    quantity: available + 10,
    reservedQuantity: 10,
  }));
  const locations = new Map([
    ["loc-source", { id: "loc-source", name: "Storage", active: true }],
    ["loc-destination", { id: "loc-destination", name: "Dispatch", active: true }],
  ]);
  const prisma = {
    user: {
      findFirst: jest.fn(async () => ({
        id: "worker-1",
        role: UserRole.WORKER,
        active: true,
      })),
    },
    product: {
      findFirst: jest.fn(async () => ({
        id: "product-1",
        name: "Helmet",
        active: true,
      })),
    },
    location: {
      findFirst: jest.fn(async ({ where }: { where: { id: string } }) =>
        locations.get(where.id) ?? null,
      ),
    },
    inventoryBalance: {
      findUnique: inventoryBalanceFindUnique,
      update: jest.fn(),
      upsert: jest.fn(),
    },
    inventoryTask: {
      create: inventoryTaskCreate,
      findFirst: jest.fn(async () => null),
    },
  };
  return {
    prisma: prisma as unknown as PrismaService,
    inventoryTaskCreate,
    inventoryBalanceFindUnique,
    inventoryBalanceUpdate: prisma.inventoryBalance.update,
    inventoryBalanceUpsert: prisma.inventoryBalance.upsert,
  };
}

const transferInput = {
  type: TaskType.TRANSFER,
  priority: TaskPriority.MEDIUM,
  title: "Move Helmet to Dispatch",
  assignedToId: "worker-1",
  productId: "product-1",
  quantity: 20,
  sourceLocationId: "loc-source",
  destinationLocationId: "loc-destination",
};

describe("TasksService transfer assignments", () => {
  it("creates an assignment without changing inventory", async () => {
    const mock = createPrismaMock();
    const service = createService(mock.prisma);

    await service.create(transferInput);

    expect(mock.inventoryBalanceFindUnique).toHaveBeenCalledWith({
      where: {
        productId_locationId: {
          productId: "product-1",
          locationId: "loc-source",
        },
      },
    });
    expect(mock.inventoryTaskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          quantity: 20,
          sourceLocationId: "loc-source",
          destinationLocationId: "loc-destination",
          locationId: null,
        }),
      }),
    );
    expect(mock.inventoryBalanceUpdate).not.toHaveBeenCalled();
    expect(mock.inventoryBalanceUpsert).not.toHaveBeenCalled();
  });

  it("rejects a quantity above available source stock", async () => {
    const mock = createPrismaMock(10);
    const service = createService(mock.prisma);

    await expect(
      service.create({ ...transferInput, quantity: 20 }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(mock.inventoryTaskCreate).not.toHaveBeenCalled();
  });

  it("rejects the same source and destination", async () => {
    const mock = createPrismaMock();
    const service = createService(mock.prisma);

    await expect(
      service.create({
        ...transferInput,
        destinationLocationId: "loc-source",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mock.inventoryTaskCreate).not.toHaveBeenCalled();
  });
});

describe("TasksService shipment reassignment", () => {
  function reassignmentService(worker: { id: string; displayName: string } | null, taskOverrides: Record<string, unknown> = {}) {
    const inventoryTaskUpdate = jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "task-1",
      status: TaskStatus.OPEN,
      shipmentReference: "SHIP-001",
      ...data,
    }));
    const auditCreate = jest.fn();
    const notificationCreate = jest.fn();
    const prisma = {
      user: {
        findUnique: jest.fn(async () => ({ id: "manager-1", displayName: "Manager" })),
        findFirst: jest.fn(async () => worker),
      },
      inventoryTask: {
        findUnique: jest.fn(async () => ({
          id: "task-1",
          status: TaskStatus.OPEN,
          title: "Ship Cable",
          shipmentReference: "SHIP-001",
          reservation: { id: "reservation-1", stockRequestId: "request-1" },
          ...taskOverrides,
        })),
        update: inventoryTaskUpdate,
        findUniqueOrThrow: jest.fn(async () => ({ id: "task-1", status: TaskStatus.OPEN })),
      },
      reservationAuditEvent: { create: auditCreate },
    } as unknown as PrismaService;
    const notifications = { createForUser: notificationCreate } as unknown as NotificationsService;
    const service = new TasksService(prisma, undefined as never, notifications);
    return { service, inventoryTaskUpdate, auditCreate, notificationCreate };
  }

  it("reassigns an open shipment task to another active executive and notifies them", async () => {
    const { service, inventoryTaskUpdate, auditCreate, notificationCreate } = reassignmentService({
      id: "worker-2",
      displayName: "Worker Two",
    });

    const result = await service.reassign("task-1", "worker-2", managerActor);

    expect(inventoryTaskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "task-1" },
        data: expect.objectContaining({ assignedToId: "worker-2" }),
      }),
    );
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "SHIPMENT_REASSIGNED" }),
      }),
    );
    expect(notificationCreate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userId: "worker-2", type: "SHIPMENT_TASK_ASSIGNED" }),
    );
    expect(result.idempotent).toBe(false);
  });

  it("rejects an inactive or non-worker reassignment target", async () => {
    const { service, inventoryTaskUpdate } = reassignmentService(null);

    await expect(service.reassign("task-1", "manager-1", managerActor)).rejects.toBeInstanceOf(NotFoundException);
    expect(inventoryTaskUpdate).not.toHaveBeenCalled();
  });

  it("is idempotent when the task is already assigned to the same worker", async () => {
    const { service, inventoryTaskUpdate, notificationCreate } = reassignmentService(
      { id: "worker-2", displayName: "Worker Two" },
      { assignedToId: "worker-2", reservation: null },
    );

    const result = await service.reassign("task-1", "worker-2", managerActor);

    expect(result.idempotent).toBe(true);
    expect(inventoryTaskUpdate).not.toHaveBeenCalled();
    expect(notificationCreate).not.toHaveBeenCalled();
  });
});

interface PlanBalance {
  productId: string;
  locationId: string;
  quantity: number;
  product: { name: string };
  location: { name: string; code: string };
}

/** A future month-end 5:00 PM due date that stays valid whenever the suite runs. */
function futureMonthEnd(offsetMonths = 1) {
  const now = new Date();
  const targetMonth = now.getMonth() + offsetMonths;
  const year = now.getFullYear() + Math.floor(targetMonth / 12);
  const month = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const periodMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
  return {
    periodMonth,
    dueAt: `${periodMonth}-${String(lastDay).padStart(2, "0")}T17:00:00.000Z`,
  };
}

function planPrismaMock(overrides: {
  worker?: { id: string; employeeId: string; displayName: string; role: UserRole; active: boolean } | null;
  locations?: Array<{ id: string; name: string }>;
  balances?: PlanBalance[];
  existingTasks?: Array<{ productId: string; locationId: string }>;
  createdTasks?: Array<{ id: string; productId: string; locationId: string; status: TaskStatus }>;
  existingPlan?: Record<string, unknown> | null;
  plans?: Array<Record<string, unknown>>;
  discrepancies?: Array<{ transaction: { taskId: string } | null }>;
} = {}) {
  const createMany = jest.fn(async ({ data }: { data: unknown[] }) => ({ count: data.length }));
  const createPlan = jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: "plan-1", ...data }));
  const notificationCreate = jest.fn(async () => ({}));
  const prisma = {
    cycleCountPlan: {
      findUnique: jest.fn(async () => overrides.existingPlan ?? null),
      findMany: jest.fn(async () => overrides.plans ?? []),
    },
    user: {
      findFirst: jest.fn(async () =>
        "worker" in overrides
          ? overrides.worker
          : { id: "worker-1", employeeId: "W1", displayName: "Worker One", role: UserRole.WORKER, active: true },
      ),
    },
    location: {
      findMany: jest.fn(async () =>
        overrides.locations ?? [{ id: "loc-1", name: "Storage 1" }],
      ),
    },
    inventoryBalance: {
      findMany: jest.fn(async () =>
        overrides.balances ?? [
          { productId: "product-1", locationId: "loc-1", quantity: 10, product: { name: "Cable" }, location: { name: "Storage 1", code: "L001" } },
        ],
      ),
    },
    inventoryTask: { findMany: jest.fn(async () => overrides.existingTasks ?? []) },
    discrepancy: { findMany: jest.fn(async () => overrides.discrepancies ?? []) },
    $transaction: jest.fn(async (callback: (database: unknown) => Promise<unknown>) =>
      callback({
        cycleCountPlan: { create: createPlan },
        inventoryTask: {
          createMany,
          findMany: jest.fn(async () => overrides.createdTasks ?? []),
        },
        notification: { create: notificationCreate },
      }),
    ),
  } as unknown as PrismaService;
  const notifications = { createForUser: jest.fn(async () => ({})) } as unknown as NotificationsService;
  const service = new TasksService(prisma, undefined as never, notifications);
  return { prisma, service, createMany, createPlan, notificationCreate, notifications };
}

describe("TasksService cycle-count plans", () => {
  it("creates one task per stocked item and location in one transaction", async () => {
    const { service, createMany, notifications } = planPrismaMock({
      locations: [{ id: "loc-1", name: "Storage 1" }, { id: "loc-2", name: "Storage 2" }],
      balances: [
        { productId: "product-1", locationId: "loc-1", quantity: 10, product: { name: "Cable" }, location: { name: "Storage 1", code: "L001" } },
        { productId: "product-2", locationId: "loc-1", quantity: 20, product: { name: "Helmet" }, location: { name: "Storage 1", code: "L001" } },
        { productId: "product-3", locationId: "loc-2", quantity: 30, product: { name: "Box" }, location: { name: "Storage 2", code: "L002" } },
      ],
      createdTasks: [
        { id: "task-1", productId: "product-1", locationId: "loc-1", status: TaskStatus.OPEN },
        { id: "task-2", productId: "product-2", locationId: "loc-1", status: TaskStatus.OPEN },
        { id: "task-3", productId: "product-3", locationId: "loc-2", status: TaskStatus.OPEN },
      ],
    });
    const { periodMonth, dueAt } = futureMonthEnd();

    const result = await service.createCycleCountPlan({
      periodMonth,
      locationIds: ["loc-1", "loc-2"],
      assignedToId: "worker-1",
      priority: TaskPriority.MEDIUM,
      blindCount: true,
      dueAt,
      instructions: "Use the red scanner.",
    });

    expect(result.createdTasks).toBe(3);
    expect(result.selectedLocations).toBe(2);
    expect(result.idempotent).toBe(false);
    expect(result.instructions).toBe("Use the red scanner.");
    expect(createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ productId: "product-1", locationId: "loc-1", cycleCountPlanId: "plan-1", periodMonth }),
          expect.objectContaining({ productId: "product-2", locationId: "loc-1", cycleCountPlanId: "plan-1", periodMonth }),
          expect.objectContaining({ productId: "product-3", locationId: "loc-2", cycleCountPlanId: "plan-1", periodMonth }),
        ]),
      }),
    );
    // The assigned Warehouse Executive is notified about the new plan.
    expect(notifications.createForUser).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: "worker-1",
        type: "CYCLE_COUNT_PLAN_ASSIGNED",
      }),
    );
  });

  it("stores a deterministic request key on the plan and notifies the assigned worker", async () => {
    const { service, createPlan, notifications } = planPrismaMock({
      createdTasks: [{ id: "task-1", productId: "product-1", locationId: "loc-1", status: TaskStatus.OPEN }],
    });
    const { periodMonth, dueAt } = futureMonthEnd();

    const result = await service.createCycleCountPlan({
      periodMonth,
      locationIds: ["loc-1"],
      assignedToId: "worker-1",
      priority: TaskPriority.MEDIUM,
      dueAt,
      blindCount: true,
    });

    expect(createPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          periodMonth,
          requestKey: expect.any(String),
        }),
      }),
    );
    expect(notifications.createForUser).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: "worker-1",
        type: "CYCLE_COUNT_PLAN_ASSIGNED",
        linkType: "task",
        linkId: "plan-1",
      }),
    );
    expect(result.idempotent).toBe(false);
  });

  it("only queries stocked items and never generates tasks for zero quantity", async () => {
    const { service, prisma, createMany } = planPrismaMock({
      balances: [
        { productId: "product-1", locationId: "loc-1", quantity: 10, product: { name: "Cable" }, location: { name: "Storage 1", code: "L001" } },
      ],
      createdTasks: [{ id: "task-1", productId: "product-1", locationId: "loc-1", status: TaskStatus.OPEN }],
    });
    const { periodMonth } = futureMonthEnd();

    const result = await service.createCycleCountPlan({
      periodMonth,
      locationIds: ["loc-1"],
      assignedToId: "worker-1",
      priority: TaskPriority.MEDIUM,
    });

    // The balance query is scoped to on-hand quantity greater than zero, so a
    // zero-quantity item-location record can never produce a task.
    expect(prisma.inventoryBalance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ quantity: { gt: 0 } }),
      }),
    );
    expect(result.createdTasks).toBe(1);
    const data = createMany.mock.calls[0][0] as { data: Array<{ productId: string }> };
    expect(data.data).toHaveLength(1);
    expect(data.data[0].productId).toBe("product-1");
  });

  it("rejects a selected location with no stocked items", async () => {
    const { service } = planPrismaMock({
      locations: [{ id: "loc-1", name: "Storage 1" }, { id: "loc-2", name: "Empty Storage" }],
      balances: [
        { productId: "product-1", locationId: "loc-1", quantity: 10, product: { name: "Cable" }, location: { name: "Storage 1", code: "L001" } },
      ],
    });
    const { periodMonth } = futureMonthEnd();

    await expect(
      service.createCycleCountPlan({
        periodMonth,
        locationIds: ["loc-1", "loc-2"],
        assignedToId: "worker-1",
        priority: TaskPriority.MEDIUM,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("skips item-location pairs that already have a task for the same period", async () => {
    const { service } = planPrismaMock({
      balances: [
        { productId: "product-1", locationId: "loc-1", quantity: 10, product: { name: "Cable" }, location: { name: "Storage 1", code: "L001" } },
        { productId: "product-2", locationId: "loc-1", quantity: 20, product: { name: "Helmet" }, location: { name: "Storage 1", code: "L001" } },
      ],
      existingTasks: [{ productId: "product-1", locationId: "loc-1" }],
      createdTasks: [{ id: "task-2", productId: "product-2", locationId: "loc-1", status: TaskStatus.OPEN }],
    });
    const { periodMonth } = futureMonthEnd();

    const result = await service.createCycleCountPlan({
      periodMonth,
      locationIds: ["loc-1"],
      assignedToId: "worker-1",
      priority: TaskPriority.HIGH,
    });

    expect(result.createdTasks).toBe(1);
    expect(result.skippedDuplicates).toBe(1);
  });

  it("returns the existing plan unchanged when the exact same request repeats", async () => {
    const existingPlan = {
      id: "plan-existing",
      planNumber: "CC-20260818-1234-ABCD",
      title: "September 2026 cycle count — Storage 1",
      periodMonth: "2026-09",
      priority: TaskPriority.MEDIUM,
      dueAt: null,
      blindCount: true,
      assignedToId: "worker-1",
      createdAt: new Date("2026-08-18T00:00:00.000Z"),
      assignedTo: { id: "worker-1", employeeId: "W1", displayName: "Worker One" },
      tasks: [{ id: "task-1", productId: "product-1", locationId: "loc-1", status: TaskStatus.OPEN }],
    };
    const { service } = planPrismaMock({ existingPlan });

    const result = await service.createCycleCountPlan({
      periodMonth: "2026-09",
      locationIds: ["loc-1"],
      assignedToId: "worker-1",
      priority: TaskPriority.MEDIUM,
      blindCount: true,
    });

    expect(result.idempotent).toBe(true);
    expect(result.id).toBe("plan-existing");
    expect(result.createdTasks).toBe(1);
  });

  it("rejects an inactive or non-worker assignee", async () => {
    const { service } = planPrismaMock({ worker: null });
    const { periodMonth } = futureMonthEnd();

    await expect(
      service.createCycleCountPlan({
        periodMonth,
        locationIds: ["loc-1"],
        assignedToId: "manager-1",
        priority: TaskPriority.MEDIUM,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects a due date outside the selected monthly count period", async () => {
    const { service } = planPrismaMock();

    await expect(service.createCycleCountPlan({
      periodMonth: "2026-08",
      locationIds: ["loc-1"],
      assignedToId: "worker-1",
      priority: TaskPriority.MEDIUM,
      dueAt: "2026-09-01T17:00:00.000Z",
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects a past due date", async () => {
    const { service } = planPrismaMock();

    await expect(service.createCycleCountPlan({
      periodMonth: "2020-01",
      locationIds: ["loc-1"],
      assignedToId: "worker-1",
      priority: TaskPriority.MEDIUM,
      dueAt: "2020-01-15T17:00:00.000Z",
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it("builds blind-count task descriptions carrying the instructions", async () => {
    const { service, createMany } = planPrismaMock({
      createdTasks: [{ id: "task-1", productId: "product-1", locationId: "loc-1", status: TaskStatus.OPEN }],
    });
    const { periodMonth } = futureMonthEnd();

    await service.createCycleCountPlan({
      periodMonth,
      locationIds: ["loc-1"],
      assignedToId: "worker-1",
      priority: TaskPriority.MEDIUM,
      blindCount: true,
      instructions: "Count twice.",
    });

    const data = createMany.mock.calls[0][0] as { data: Array<{ description: string }> };
    expect(data.data[0].description).toContain("Blind count");
    expect(data.data[0].description).toContain("Instructions: Count twice.");
  });

  it("lists plans with task statistics and discrepancy counts", async () => {
    const { service } = planPrismaMock({
      plans: [
        {
          id: "plan-1",
          planNumber: "CC-0001",
          title: "September 2026 cycle count",
          periodMonth: "2026-09",
          priority: TaskPriority.MEDIUM,
          dueAt: null,
          blindCount: true,
          assignedToId: "worker-1",
          createdAt: new Date(),
          assignedTo: { id: "worker-1", employeeId: "W1", displayName: "Worker One" },
          tasks: [
            { id: "task-1", status: TaskStatus.OPEN, location: { id: "loc-1", code: "L001", name: "Storage 1" } },
            { id: "task-2", status: TaskStatus.COMPLETED, location: { id: "loc-1", code: "L001", name: "Storage 1" } },
            { id: "task-3", status: TaskStatus.COMPLETED, location: { id: "loc-2", code: "L002", name: "Storage 2" } },
          ],
        },
      ],
      discrepancies: [
        { transaction: { taskId: "task-1" } },
        { transaction: { taskId: "task-1" } },
      ],
    });

    const plans = await service.listCycleCountPlans();

    expect(plans).toHaveLength(1);
    const plan = plans[0];
    expect(plan.totalTasks).toBe(3);
    expect(plan.openTasks).toBe(1);
    expect(plan.completedTasks).toBe(2);
    expect(plan.discrepancyCount).toBe(2);
    expect(plan.status).toBe("OPEN");
    expect(plan.locations).toHaveLength(2);
  });

  it("returns one plan with every generated task and linked discrepancies", async () => {
    const { service } = planPrismaMock({
      plans: [],
      discrepancies: [
        { transaction: { taskId: "task-1" } },
        { transaction: { taskId: "task-1" } },
      ],
    });
    // getCycleCountPlan uses findUnique (not the mock's findMany override).
    const plan = {
      id: "plan-1",
      planNumber: "CC-0001",
      title: "September 2026 cycle count",
      periodMonth: "2026-09",
      priority: TaskPriority.MEDIUM,
      dueAt: null,
      blindCount: false,
      assignedToId: "worker-1",
      createdAt: new Date(),
      assignedTo: { id: "worker-1", employeeId: "W1", displayName: "Worker One" },
      tasks: [
        { id: "task-1", status: TaskStatus.COMPLETED, product: { id: "product-1", name: "Cable" }, location: { id: "loc-1", code: "L001", name: "Storage 1" }, assignedTo: { id: "worker-1", employeeId: "W1", displayName: "Worker One" } },
      ],
    };
    (service as unknown as { prisma: { cycleCountPlan: { findUnique: jest.Mock } } }).prisma.cycleCountPlan.findUnique.mockResolvedValue(plan);
    (service as unknown as { prisma: { discrepancy: { findMany: jest.Mock } } }).prisma.discrepancy.findMany.mockResolvedValue([
      { id: "case-1", caseNumber: "DSC-1", status: "OPEN", expectedQuantity: 10, countedQuantity: 8, transaction: { taskId: "task-1" } },
      { id: "case-2", caseNumber: "DSC-2", status: "CLOSED", expectedQuantity: 10, countedQuantity: 9, transaction: { taskId: "task-1" } },
    ]);

    const result = await service.getCycleCountPlan("plan-1");

    expect(result.planNumber).toBe("CC-0001");
    expect(result.totalTasks).toBe(1);
    expect(result.completedTasks).toBe(1);
    expect(result.status).toBe("COMPLETED");
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].discrepancies).toHaveLength(2);
    expect(result.discrepancyCount).toBe(2);
  });
});

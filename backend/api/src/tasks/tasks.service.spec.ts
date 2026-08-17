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

describe("TasksService cycle-count plans", () => {
  it("creates one task per stocked item and location in one transaction", async () => {
    const createPlan = jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: "plan-1", ...data }));
    const createMany = jest.fn(async ({ data }: { data: unknown[] }) => ({ count: data.length }));
    const createdTasks = [
      { id: "task-1", productId: "product-1", locationId: "loc-1" },
      { id: "task-2", productId: "product-2", locationId: "loc-2" },
    ];
    const prisma = {
      user: { findFirst: jest.fn(async () => ({ id: "worker-1", role: UserRole.WORKER, active: true })) },
      location: { findMany: jest.fn(async () => [{ id: "loc-1", name: "Dispatch" }, { id: "loc-2", name: "Packing" }]) },
      inventoryBalance: { findMany: jest.fn(async () => [
        { productId: "product-1", locationId: "loc-1", quantity: 10, product: { name: "Cable" }, location: { name: "Dispatch", code: "L001" } },
        { productId: "product-2", locationId: "loc-2", quantity: 20, product: { name: "Helmet" }, location: { name: "Packing", code: "L002" } },
      ]) },
      inventoryTask: { findMany: jest.fn(async () => []) },
      $transaction: jest.fn(async (callback: (database: unknown) => Promise<unknown>) => callback({
        cycleCountPlan: { create: createPlan },
        inventoryTask: { createMany, findMany: jest.fn(async () => createdTasks) },
      })),
    } as unknown as PrismaService;
    const service = createService(prisma);

    const result = await service.createCycleCountPlan({
      periodMonth: "2026-08",
      locationIds: ["loc-1", "loc-2"],
      assignedToId: "worker-1",
      priority: TaskPriority.MEDIUM,
      blindCount: true,
    });

    expect(createPlan).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ periodMonth: "2026-08" }) }));
    expect(createMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.arrayContaining([
      expect.objectContaining({ productId: "product-1", locationId: "loc-1", cycleCountPlanId: "plan-1" }),
      expect.objectContaining({ productId: "product-2", locationId: "loc-2", cycleCountPlanId: "plan-1" }),
    ]) }));
    expect(result.createdTasks).toBe(2);
    expect(result.selectedLocations).toBe(2);
  });

  it("skips item-location pairs that already have an open count", async () => {
    const createMany = jest.fn(async ({ data }: { data: unknown[] }) => ({ count: data.length }));
    const prisma = {
      user: { findFirst: jest.fn(async () => ({ id: "worker-1" })) },
      location: { findMany: jest.fn(async () => [{ id: "loc-1", name: "Dispatch" }]) },
      inventoryBalance: { findMany: jest.fn(async () => [
        { productId: "product-1", locationId: "loc-1", quantity: 10, product: { name: "Cable" }, location: { name: "Dispatch", code: "L001" } },
        { productId: "product-2", locationId: "loc-1", quantity: 20, product: { name: "Helmet" }, location: { name: "Dispatch", code: "L001" } },
      ]) },
      inventoryTask: { findMany: jest.fn(async () => [{ productId: "product-1", locationId: "loc-1" }]) },
      $transaction: jest.fn(async (callback: (database: unknown) => Promise<unknown>) => callback({
        cycleCountPlan: { create: jest.fn(async ({ data }: { data: object }) => ({ id: "plan-1", ...data })) },
        inventoryTask: { createMany, findMany: jest.fn(async () => [{ id: "task-2" }]) },
      })),
    } as unknown as PrismaService;
    const service = createService(prisma);

    const result = await service.createCycleCountPlan({ periodMonth: "2026-08", locationIds: ["loc-1"], assignedToId: "worker-1", priority: TaskPriority.HIGH });

    expect(result.createdTasks).toBe(1);
    expect(result.skippedDuplicates).toBe(1);
  });

  it("rejects a due date outside the selected monthly count period", async () => {
    const service = createService({} as PrismaService);

    await expect(service.createCycleCountPlan({
      periodMonth: "2026-08",
      locationIds: ["loc-1"],
      assignedToId: "worker-1",
      priority: TaskPriority.MEDIUM,
      dueAt: "2026-09-01T17:00:00.000Z",
    })).rejects.toBeInstanceOf(BadRequestException);
  });
});

import { BadRequestException, ConflictException, ForbiddenException } from "@nestjs/common";
import { InventoryAction, Prisma, StockRequestStatus, StockReservationStatus, TaskPriority, TaskStatus, TaskType, TransactionStatus, UserRole } from "@prisma/client";

import type { AuthenticatedUser } from "../auth/auth-user";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { ReservationsService } from "./reservations.service";

const manager: AuthenticatedUser = {
  subject: "manager-subject",
  username: "manager1",
  email: "manager@example.com",
  roles: ["manager"],
};

const worker: AuthenticatedUser = {
  subject: "worker-subject",
  username: "worker1",
  email: "worker@example.com",
  roles: ["worker"],
};

const managerUser = { id: "manager-id", displayName: "Manager" };
const workerUser = { id: "worker-id", displayName: "Priya" };

const usersByEmail = new Map([
  ["manager@example.com", managerUser],
  ["worker@example.com", workerUser],
]);

function createService(database: Record<string, unknown>) {
  const prisma = {
    $transaction: jest.fn(async (operation: (client: typeof database) => unknown) => operation(database)),
    ...database,
    user: {
      findUnique: jest.fn(async ({ where }: { where: { email?: string } }) =>
        usersByEmail.get(where.email ?? "") ?? null,
      ),
      ...(database.user as object | undefined),
    },
  };
  const notifications = {
    createForUser: jest.fn(),
    createForManagers: jest.fn(),
  } as unknown as NotificationsService;
  return {
    service: new ReservationsService(prisma as unknown as PrismaService, notifications),
    prisma,
    notifications,
  };
}

function shipmentReservation(overrides: Record<string, unknown> = {}) {
  return {
    id: "reservation-id",
    reservationNumber: "RSV-TEST1",
    stockRequestId: "request-id",
    status: StockReservationStatus.ACTIVE,
    request: { id: "request-id", referenceNumber: "ORDER-1005", requestedFor: "Customer" },
    allocations: [{
      id: "allocation-id",
      requestLineId: "line-id",
      productId: "product-id",
      locationId: "location-id",
      quantity: 60,
      shippedQuantity: 0,
      releasedQuantity: 0,
      product: { id: "product-id", name: "Cable", unit: "unit" },
      location: { id: "location-id", name: "Storage 1" },
    }],
    ...overrides,
  };
}

function shipmentTask(overrides: Record<string, unknown> = {}) {
  return {
    id: "task-id",
    type: TaskType.SHIP,
    status: TaskStatus.OPEN,
    reservationId: "reservation-id",
    productId: "product-id",
    sourceLocationId: "location-id",
    quantity: 60,
    shipmentReference: "SHIP-9001",
    assignedToId: "worker-id",
    title: "Ship Cable",
    ...overrides,
  };
}

describe("ReservationsService automatic request references", () => {
  beforeEach(() => {
    process.env.STOCK_RESERVATIONS_ENABLED = "true";
  });

  function requestDatabase(nextNumber: number, externalDuplicate: object | null = null) {
    const create = jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: "request-id", ...data }));
    return {
      database: {
        product: { findMany: jest.fn().mockResolvedValue([{ id: "product-id" }]) },
        stockRequest: {
          findUnique: jest.fn().mockResolvedValue(externalDuplicate),
          create,
        },
        $executeRaw: jest.fn().mockResolvedValue(1),
        $queryRaw: jest.fn().mockResolvedValue([{ last_value: nextNumber }]),
      },
      create,
    };
  }

  const requestInput = {
    requestType: "CUSTOMER_ORDER",
    requestedFor: "ABC Company",
    requiredDate: "2026-08-25T17:00:00.000Z",
    lines: [{ productId: "product-id", requiredQuantity: 10 }],
  };

  test("generates REQ-001 when no external reference is supplied", async () => {
    const { database, create } = requestDatabase(1);
    const { service } = createService(database);

    await service.createRequest(requestInput, manager);

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ requestNumber: "REQ-001", referenceNumber: "REQ-001" }),
    }));
  });

  test("keeps an optional external order reference without replacing the internal REQ number", async () => {
    const { database, create } = requestDatabase(12);
    const { service } = createService(database);

    await service.createRequest({ ...requestInput, referenceNumber: "order-500" }, manager);

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ requestNumber: "REQ-012", referenceNumber: "ORDER-500" }),
    }));
  });

  test("continues beyond three digits", async () => {
    const { database, create } = requestDatabase(1000);
    const { service } = createService(database);

    await service.createRequest(requestInput, manager);

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ requestNumber: "REQ-1000", referenceNumber: "REQ-1000" }),
    }));
  });

  test("rejects a duplicate external order reference", async () => {
    const { database, create } = requestDatabase(15, { id: "existing-request" });
    const { service } = createService(database);

    await expect(service.createRequest({ ...requestInput, referenceNumber: "ORDER-500" }, manager))
      .rejects.toBeInstanceOf(ConflictException);
    expect(create).not.toHaveBeenCalled();
  });
});

describe("ReservationsService lifecycle", () => {
  beforeEach(() => {
    process.env.STOCK_RESERVATIONS_ENABLED = "true";
  });

  test("cancelling a request releases unused reserved stock and writes an audit event", async () => {
    const database = {
      stockRequest: {
        findUnique: jest.fn().mockResolvedValue({
          id: "request-id",
          status: StockRequestStatus.FULLY_RESERVED,
          reservations: [{
            id: "reservation-id",
            status: StockReservationStatus.ACTIVE,
            allocations: [{ id: "allocation-id", requestLineId: "line-id", productId: "product-id", locationId: "location-id", quantity: 10, shippedQuantity: 2, releasedQuantity: 1 }],
          }],
        }),
        update: jest.fn(),
      },
      inventoryBalance: { update: jest.fn() },
      stockRequestLine: { update: jest.fn() },
      stockReservationAllocation: { update: jest.fn() },
      stockReservation: { update: jest.fn() },
      inventoryTask: { findMany: jest.fn().mockResolvedValue([]) },
      reservationAuditEvent: { create: jest.fn() },
    };
    const { service } = createService(database);

    await service.cancelRequest("request-id", "Customer cancelled order.", manager);

    expect(database.inventoryBalance.update).toHaveBeenCalledWith(expect.objectContaining({ data: { reservedQuantity: { decrement: 7 } } }));
    expect(database.stockRequest.update).toHaveBeenCalledWith({ where: { id: "request-id" }, data: { status: StockRequestStatus.CANCELLED } });
    expect(database.reservationAuditEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "REQUEST_CANCELLED" }) }));
  });

  test("fulfilment decreases on-hand and reserved stock together and creates a posted shipment", async () => {
    const database = {
      stockReservation: {
        findUnique: jest.fn().mockResolvedValue({
          id: "reservation-id",
          stockRequestId: "request-id",
          status: StockReservationStatus.ACTIVE,
          request: { referenceNumber: "ORDER-1001" },
          allocations: [{ id: "allocation-id", requestLineId: "line-id", productId: "product-id", locationId: "location-id", quantity: 5, shippedQuantity: 0, releasedQuantity: 0, product: { name: "Cable" }, location: { name: "Dispatch" } }],
        }),
        update: jest.fn(),
      },
      inventoryBalance: {
        findUnique: jest.fn().mockResolvedValue({ quantity: 20, reservedQuantity: 5 }),
        update: jest.fn(),
      },
      stockRequestLine: {
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([{ requiredQuantity: 5, shippedQuantity: 5 }]),
      },
      stockReservationAllocation: { update: jest.fn() },
      inventoryTransaction: { create: jest.fn() },
      stockRequest: { update: jest.fn() },
      reservationAuditEvent: { create: jest.fn() },
    };
    const { service } = createService(database);

    const result = await service.fulfil("reservation-id", "Shipment SHIP-1001", manager);

    expect(database.inventoryBalance.update).toHaveBeenCalledWith(expect.objectContaining({ data: { quantity: { decrement: 5 }, reservedQuantity: { decrement: 5 } } }));
    expect(database.inventoryTransaction.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "SHIP", status: "POSTED", quantity: 5 }) }));
    expect(database.stockRequest.update).toHaveBeenCalledWith({ where: { id: "request-id" }, data: { status: StockRequestStatus.COMPLETED } });
    expect(result.fulfilledQuantity).toBe(5);
  });

  test("expiry releases active allocations and closes overdue requests", async () => {
    const database = {
      stockRequest: {
        findMany: jest.fn().mockResolvedValue([{ id: "request-id", reservations: [{ id: "reservation-id", status: StockReservationStatus.ACTIVE, allocations: [{ id: "allocation-id", requestLineId: "line-id", productId: "product-id", locationId: "location-id", quantity: 4, shippedQuantity: 0, releasedQuantity: 0 }] }] }]),
        update: jest.fn(),
      },
      inventoryBalance: { update: jest.fn() },
      stockRequestLine: { update: jest.fn() },
      stockReservationAllocation: { update: jest.fn() },
      stockReservation: { update: jest.fn() },
      reservationAuditEvent: { create: jest.fn() },
    };
    const { service } = createService(database);

    const result = await service.expireDue(manager);

    expect(database.inventoryBalance.update).toHaveBeenCalledWith(expect.objectContaining({ data: { reservedQuantity: { decrement: 4 } } }));
    expect(database.stockReservation.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: StockReservationStatus.EXPIRED }) }));
    expect(database.stockRequest.update).toHaveBeenCalledWith({ where: { id: "request-id" }, data: { status: StockRequestStatus.EXPIRED } });
    expect(result.expiredRequests).toBe(1);
  });
});

/**
 * Adds the shipment-reference counter raw-SQL mocks to a database fixture.
 * Values are handed out in order; once exhausted the last value repeats
 * (mirrors a failed transaction rolling back and retrying on the same value).
 */
function withReferenceCounter(database: Record<string, unknown>, values: number[] = [1, 2, 3]) {
  let index = 0;
  return {
    ...database,
    $executeRaw: jest.fn(async () => 1),
    $queryRaw: jest.fn(async () => [{ last_value: values[Math.min(index++, values.length - 1)] }]),
  };
}

describe("ReservationsService shipment preparation", () => {
  beforeEach(() => {
    process.env.STOCK_RESERVATIONS_ENABLED = "true";
  });

  test("AUTO assigns the active worker with the fewest open tasks and notifies them", async () => {
    const inventoryTaskCreate = jest.fn().mockResolvedValue({ id: "task-id" });
    const database = withReferenceCounter({
      stockReservation: { findUnique: jest.fn().mockResolvedValue(shipmentReservation()) },
      inventoryTask: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: inventoryTaskCreate,
        groupBy: jest.fn().mockResolvedValue([
          { assignedToId: "worker-1", _count: { _all: 3 } },
          { assignedToId: "worker-2", _count: { _all: 1 } },
        ]),
      },
      user: { findMany: jest.fn().mockResolvedValue([
        { id: "worker-1", employeeId: "W001", displayName: "Worker One" },
        { id: "worker-2", employeeId: "W002", displayName: "Worker Two" },
      ]) },
      reservationAuditEvent: { create: jest.fn() },
    });
    const { service, notifications } = createService(database);

    const result = await service.prepareShipment("reservation-id", {
      allocationId: "allocation-id",
      quantity: 40,
      assignmentMode: "AUTO",
      priority: "HIGH",
      instructions: "Stage at the dispatch door.",
    }, manager);

    expect(inventoryTaskCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        type: TaskType.SHIP,
        quantity: 40,
        assignedToId: "worker-2",
        reservationId: "reservation-id",
        shipmentReference: "SHIP-001",
        sourceLocationId: "location-id",
      }),
    }));
    expect(notifications.createForUser).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ userId: "worker-2" }));
    expect(notifications.createForManagers).not.toHaveBeenCalled();
    expect(result.idempotent).toBe(false);
  });

  test("AUTO excludes inactive and non-worker users and breaks ties by employee id", async () => {
    const inventoryTaskCreate = jest.fn().mockResolvedValue({ id: "task-id" });
    const userFindMany = jest.fn().mockResolvedValue([
      { id: "worker-b", employeeId: "W900", displayName: "Zed" },
      { id: "worker-a", employeeId: "W100", displayName: "Anna" },
    ]);
    const database = withReferenceCounter({
      stockReservation: { findUnique: jest.fn().mockResolvedValue(shipmentReservation()) },
      inventoryTask: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: inventoryTaskCreate,
        groupBy: jest.fn().mockResolvedValue([]),
      },
      // Only active WORKER users are returned; managers, administrators and
      // inactive users are filtered by the query itself. Both workers have
      // zero open tasks, so the tie breaks deterministically by employeeId.
      user: { findMany: userFindMany },
      reservationAuditEvent: { create: jest.fn() },
    });
    const { service } = createService(database);

    await service.prepareShipment("reservation-id", {
      allocationId: "allocation-id",
      quantity: 10,
      assignmentMode: "AUTO",
    }, manager);

    expect(userFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ active: true, role: UserRole.WORKER }),
    }));
    expect(inventoryTaskCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ assignedToId: "worker-a" }),
    }));
  });

  test("AUTO keeps the task unassigned and notifies managers when no worker is eligible", async () => {
    const inventoryTaskCreate = jest.fn().mockResolvedValue({ id: "task-id", assignedToId: null });
    const database = withReferenceCounter({
      stockReservation: { findUnique: jest.fn().mockResolvedValue(shipmentReservation()) },
      inventoryTask: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: inventoryTaskCreate,
      },
      user: { findMany: jest.fn().mockResolvedValue([]) },
      reservationAuditEvent: { create: jest.fn() },
    });
    const { service, notifications } = createService(database);

    const result = await service.prepareShipment("reservation-id", {
      allocationId: "allocation-id",
      quantity: 10,
      assignmentMode: "AUTO",
    }, manager);

    expect(inventoryTaskCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ assignedToId: null }),
    }));
    expect(notifications.createForManagers).toHaveBeenCalled();
    expect(result.task.assignedToId).toBeNull();
  });

  test("UNASSIGNED creates the task with assignedToId null, notifies managers and records the mode", async () => {
    const inventoryTaskCreate = jest.fn().mockResolvedValue({ id: "task-id", assignedToId: null });
    const auditCreate = jest.fn();
    const database = withReferenceCounter({
      stockReservation: { findUnique: jest.fn().mockResolvedValue(shipmentReservation()) },
      inventoryTask: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: inventoryTaskCreate,
      },
      reservationAuditEvent: { create: auditCreate },
    });
    const { service, notifications } = createService(database);

    const result = await service.prepareShipment("reservation-id", {
      allocationId: "allocation-id",
      quantity: 12,
      assignmentMode: "UNASSIGNED",
    }, manager);

    expect(inventoryTaskCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ assignedToId: null, shipmentReference: "SHIP-001" }),
    }));
    expect(notifications.createForManagers).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ type: "SHIPMENT_PREPARED" }));
    expect(notifications.createForUser).not.toHaveBeenCalled();
    expect(auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "SHIPMENT_PREPARED" }),
    }));
    expect(String(auditCreate.mock.calls[0][0].data.details)).toContain("left unassigned");
    expect(result.task.assignedToId).toBeNull();
  });

  test("MANUAL assigns the selected active worker and records the mode", async () => {
    const inventoryTaskCreate = jest.fn().mockResolvedValue({ id: "task-id", assignedToId: "worker-id" });
    const auditCreate = jest.fn();
    const database = withReferenceCounter({
      stockReservation: { findUnique: jest.fn().mockResolvedValue(shipmentReservation()) },
      inventoryTask: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: inventoryTaskCreate,
      },
      user: { findFirst: jest.fn().mockResolvedValue({ id: "worker-id", employeeId: "W007", displayName: "Priya" }) },
      reservationAuditEvent: { create: auditCreate },
    });
    const { service, notifications } = createService(database);

    const result = await service.prepareShipment("reservation-id", {
      allocationId: "allocation-id",
      quantity: 8,
      assignmentMode: "MANUAL",
      assignedToId: "worker-id",
    }, manager);

    expect(inventoryTaskCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ assignedToId: "worker-id" }),
    }));
    expect(notifications.createForUser).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ userId: "worker-id" }));
    expect(String(auditCreate.mock.calls[0][0].data.details)).toContain("assigned manually to Priya");
    expect(result.idempotent).toBe(false);
  });

  test("MANUAL without an assigned worker returns a clear 400", async () => {
    const inventoryTaskCreate = jest.fn();
    const database = withReferenceCounter({
      stockReservation: { findUnique: jest.fn().mockResolvedValue(shipmentReservation()) },
      inventoryTask: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: inventoryTaskCreate,
      },
      reservationAuditEvent: { create: jest.fn() },
    });
    const { service } = createService(database);

    await expect(service.prepareShipment("reservation-id", {
      allocationId: "allocation-id",
      quantity: 8,
      assignmentMode: "MANUAL",
    }, manager)).rejects.toBeInstanceOf(BadRequestException);
    expect(inventoryTaskCreate).not.toHaveBeenCalled();
  });

  test("MANUAL rejects an inactive or non-worker user with a clear 400", async () => {
    const inventoryTaskCreate = jest.fn();
    const database = withReferenceCounter({
      stockReservation: { findUnique: jest.fn().mockResolvedValue(shipmentReservation()) },
      inventoryTask: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: inventoryTaskCreate,
      },
      user: { findFirst: jest.fn().mockResolvedValue(null) },
      reservationAuditEvent: { create: jest.fn() },
    });
    const { service } = createService(database);

    await expect(service.prepareShipment("reservation-id", {
      allocationId: "allocation-id",
      quantity: 8,
      assignmentMode: "MANUAL",
      assignedToId: "inactive-or-manager-id",
    }, manager)).rejects.toBeInstanceOf(BadRequestException);
    expect(inventoryTaskCreate).not.toHaveBeenCalled();
  });

  test("does not change stock and rejects a quantity above the remaining reservation", async () => {
    const inventoryTaskCreate = jest.fn();
    const balanceUpdate = jest.fn();
    const database = withReferenceCounter({
      stockReservation: { findUnique: jest.fn().mockResolvedValue(shipmentReservation()) },
      inventoryTask: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: inventoryTaskCreate,
      },
      user: { findMany: jest.fn().mockResolvedValue([]) },
      inventoryBalance: { update: balanceUpdate },
      reservationAuditEvent: { create: jest.fn() },
    });
    const { service } = createService(database);

    await expect(service.prepareShipment("reservation-id", {
      allocationId: "allocation-id",
      quantity: 61,
      assignmentMode: "AUTO",
    }, manager)).rejects.toBeInstanceOf(ConflictException);
    expect(inventoryTaskCreate).not.toHaveBeenCalled();
    expect(balanceUpdate).not.toHaveBeenCalled();
  });

  test("preparing a shipment never changes on-hand, reserved or available stock", async () => {
    const inventoryTaskCreate = jest.fn().mockResolvedValue({ id: "task-id", assignedToId: "worker-2" });
    const balanceUpdate = jest.fn();
    const balanceCreate = jest.fn();
    const database = withReferenceCounter({
      stockReservation: { findUnique: jest.fn().mockResolvedValue(shipmentReservation()) },
      inventoryTask: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: inventoryTaskCreate,
        groupBy: jest.fn().mockResolvedValue([]),
      },
      user: { findMany: jest.fn().mockResolvedValue([{ id: "worker-2", employeeId: "W002", displayName: "Worker Two" }]) },
      inventoryBalance: { update: balanceUpdate, create: balanceCreate },
      reservationAuditEvent: { create: jest.fn() },
    });
    const { service } = createService(database);

    await service.prepareShipment("reservation-id", {
      allocationId: "allocation-id",
      quantity: 20,
      assignmentMode: "AUTO",
    }, manager);

    expect(balanceUpdate).not.toHaveBeenCalled();
    expect(balanceCreate).not.toHaveBeenCalled();
  });

  test("is idempotent: an existing open shipment task for the same reservation and quantity is returned", async () => {
    const inventoryTaskCreate = jest.fn();
    const executeRaw = jest.fn(async () => 1);
    const queryRaw = jest.fn(async () => [{ last_value: 1 }]);
    const existing = { ...shipmentTask(), shipmentReference: "SHIP-001", assignedTo: { id: "worker-id", displayName: "Priya" } };
    const database = {
      stockReservation: { findUnique: jest.fn().mockResolvedValue(shipmentReservation()) },
      inventoryTask: {
        findFirst: jest.fn().mockResolvedValue(existing),
        create: inventoryTaskCreate,
      },
      user: { findMany: jest.fn().mockResolvedValue([]) },
      reservationAuditEvent: { create: jest.fn() },
      $executeRaw: executeRaw,
      $queryRaw: queryRaw,
    };
    const { service, notifications } = createService(database);

    const result = await service.prepareShipment("reservation-id", {
      allocationId: "allocation-id",
      quantity: 60,
      assignmentMode: "UNASSIGNED",
    }, manager);

    expect(result.idempotent).toBe(true);
    expect(result.task.id).toBe("task-id");
    expect(result.task.shipmentReference).toBe("SHIP-001");
    expect(inventoryTaskCreate).not.toHaveBeenCalled();
    // No reference was consumed and no duplicate notification or audit was written.
    expect(executeRaw).not.toHaveBeenCalled();
    expect(notifications.createForManagers).not.toHaveBeenCalled();
  });
});

describe("ReservationsService shipment reference generation", () => {
  beforeEach(() => {
    process.env.STOCK_RESERVATIONS_ENABLED = "true";
  });

  function prepareDatabase(overrides: Record<string, unknown> = {}) {
    return {
      stockReservation: { findUnique: jest.fn().mockResolvedValue(shipmentReservation()) },
      inventoryTask: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: "task-id" }) },
      user: { findMany: jest.fn().mockResolvedValue([]) },
      reservationAuditEvent: { create: jest.fn() },
      ...overrides,
    };
  }

  test("the first issued reference is SHIP-001", async () => {
    const inventoryTaskCreate = jest.fn().mockResolvedValue({ id: "task-id" });
    const database = withReferenceCounter(prepareDatabase({
      inventoryTask: { findFirst: jest.fn().mockResolvedValue(null), create: inventoryTaskCreate },
    }), [1]);
    const { service } = createService(database);

    await service.prepareShipment("reservation-id", {
      allocationId: "allocation-id", quantity: 5, assignmentMode: "AUTO",
    }, manager);

    expect(inventoryTaskCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ shipmentReference: "SHIP-001" }),
    }));
  });

  test("references are sequential: SHIP-001 then SHIP-002", async () => {
    const inventoryTaskCreate = jest.fn().mockResolvedValue({ id: "task-id" });
    const database = withReferenceCounter(prepareDatabase({
      stockReservation: {
        findUnique: jest.fn()
          .mockResolvedValueOnce(shipmentReservation())
          .mockResolvedValueOnce(shipmentReservation({ id: "reservation-2" })),
      },
      inventoryTask: { findFirst: jest.fn().mockResolvedValue(null), create: inventoryTaskCreate },
    }), [1, 2]);
    const { service } = createService(database);

    await service.prepareShipment("reservation-id", { allocationId: "allocation-id", quantity: 5, assignmentMode: "AUTO" }, manager);
    await service.prepareShipment("reservation-2", { allocationId: "allocation-id", quantity: 6, assignmentMode: "AUTO" }, manager);

    expect(inventoryTaskCreate.mock.calls[0][0].data.shipmentReference).toBe("SHIP-001");
    expect(inventoryTaskCreate.mock.calls[1][0].data.shipmentReference).toBe("SHIP-002");
  });

  test("continues after existing SHIP references: SHIP-999 is followed by SHIP-1000", async () => {
    const inventoryTaskCreate = jest.fn().mockResolvedValue({ id: "task-id" });
    const database = withReferenceCounter(prepareDatabase({
      inventoryTask: { findFirst: jest.fn().mockResolvedValue(null), create: inventoryTaskCreate },
    }), [1000]);
    const { service } = createService(database);

    await service.prepareShipment("reservation-id", { allocationId: "allocation-id", quantity: 5, assignmentMode: "AUTO" }, manager);

    expect(inventoryTaskCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ shipmentReference: "SHIP-1000" }),
    }));
  });

  test("a duplicate request returns the same reference and consumes no extra number", async () => {
    const executeRaw = jest.fn(async () => 1);
    const queryRaw = jest.fn(async () => [{ last_value: 1 }]);
    const existing = { ...shipmentTask(), shipmentReference: "SHIP-001", assignedTo: { id: "worker-id", displayName: "Priya" } };
    const findFirst = jest.fn()
      .mockResolvedValueOnce(null) // first request: no existing task
      .mockResolvedValueOnce(existing); // duplicate request: existing task found
    const inventoryTaskCreate = jest.fn().mockResolvedValue({ id: "task-id" });
    const database = {
      stockReservation: { findUnique: jest.fn().mockResolvedValue(shipmentReservation()) },
      inventoryTask: { findFirst, create: inventoryTaskCreate },
      user: { findMany: jest.fn().mockResolvedValue([]) },
      reservationAuditEvent: { create: jest.fn() },
      $executeRaw: executeRaw,
      $queryRaw: queryRaw,
    };
    const { service } = createService(database);

    const first = await service.prepareShipment("reservation-id", { allocationId: "allocation-id", quantity: 30, assignmentMode: "AUTO" }, manager);
    const second = await service.prepareShipment("reservation-id", { allocationId: "allocation-id", quantity: 30, assignmentMode: "AUTO" }, manager);

    expect(first.idempotent).toBe(false);
    expect(second.idempotent).toBe(true);
    expect(second.task.id).toBe("task-id");
    expect(second.task.shipmentReference).toBe("SHIP-001");
    expect(executeRaw).toHaveBeenCalledTimes(1);
    expect(inventoryTaskCreate).toHaveBeenCalledTimes(1);
  });

  test("concurrent preparations for different reservations receive unique references", async () => {
    const inventoryTaskCreate = jest.fn().mockResolvedValue({ id: "task-id" });
    const database = withReferenceCounter(prepareDatabase({
      stockReservation: {
        findUnique: jest.fn()
          .mockResolvedValueOnce(shipmentReservation())
          .mockResolvedValueOnce(shipmentReservation({ id: "reservation-2" })),
      },
      inventoryTask: { findFirst: jest.fn().mockResolvedValue(null), create: inventoryTaskCreate },
    }), [1, 2]);
    const { service } = createService(database);

    const [left, right] = await Promise.all([
      service.prepareShipment("reservation-id", { allocationId: "allocation-id", quantity: 5, assignmentMode: "AUTO" }, manager),
      service.prepareShipment("reservation-2", { allocationId: "allocation-id", quantity: 6, assignmentMode: "AUTO" }, manager),
    ]);

    const references = [
      inventoryTaskCreate.mock.calls[0][0].data.shipmentReference,
      inventoryTaskCreate.mock.calls[1][0].data.shipmentReference,
    ];
    expect(references.sort()).toEqual(["SHIP-001", "SHIP-002"]);
    expect(left.idempotent).toBe(false);
    expect(right.idempotent).toBe(false);
  });

  test("a unique-violation race retries the idempotency check and returns the winner's task", async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", { code: "P2002", clientVersion: "6.19.0" });
    const winner = { ...shipmentTask(), shipmentReference: "SHIP-001", assignedTo: { id: "worker-id", displayName: "Priya" } };
    const findFirst = jest.fn()
      .mockResolvedValueOnce(null) // losing attempt: sees no task yet
      .mockResolvedValueOnce(winner); // retry: sees the winner's task
    const inventoryTaskCreate = jest.fn()
      .mockRejectedValueOnce(prismaError) // the losing insert hits the partial unique index
      .mockResolvedValueOnce({ id: "task-id" }); // never reached: retry short-circuits
    const executeRaw = jest.fn(async () => 1);
    const queryRaw = jest.fn(async () => [{ last_value: 1 }]);
    const database = {
      stockReservation: { findUnique: jest.fn().mockResolvedValue(shipmentReservation()) },
      inventoryTask: { findFirst, create: inventoryTaskCreate },
      user: { findMany: jest.fn().mockResolvedValue([]) },
      reservationAuditEvent: { create: jest.fn() },
      $executeRaw: executeRaw,
      $queryRaw: queryRaw,
    };
    const { service, notifications } = createService(database);

    const result = await service.prepareShipment("reservation-id", { allocationId: "allocation-id", quantity: 30, assignmentMode: "AUTO" }, manager);

    expect(result.idempotent).toBe(true);
    expect(result.task.id).toBe("task-id");
    expect(result.task.shipmentReference).toBe("SHIP-001");
    // The failed attempt created no task and wrote no notification; the retry
    // returned the existing task without consuming another reference.
    expect(notifications.createForManagers).not.toHaveBeenCalled();
    expect(notifications.createForUser).not.toHaveBeenCalled();
  });
});

describe("ReservationsService shipment completion", () => {
  beforeEach(() => {
    process.env.STOCK_RESERVATIONS_ENABLED = "true";
  });

  function completionDatabase(overrides: Record<string, unknown> = {}) {
    const database = {
      inventoryTask: {
        findUnique: jest.fn().mockResolvedValue(shipmentTask({ reservation: { id: "reservation-id", request: { id: "request-id" } } })),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "task-id", status: TaskStatus.COMPLETED }),
        update: jest.fn(),
      },
      stockReservation: {
        findUnique: jest.fn().mockResolvedValue(shipmentReservation()),
        update: jest.fn(),
      },
      inventoryBalance: {
        findUnique: jest.fn().mockResolvedValue({ quantity: 100, reservedQuantity: 60 }),
        update: jest.fn(),
      },
      stockRequestLine: {
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([{ requiredQuantity: 60, shippedQuantity: 60 }]),
      },
      stockReservationAllocation: { update: jest.fn() },
      inventoryTransaction: { create: jest.fn().mockResolvedValue({ id: "tx-id" }) },
      stockRequest: { update: jest.fn() },
      reservationAuditEvent: { create: jest.fn() },
      ...overrides,
    };
    return database;
  }

  test("full shipment posts automatically, reduces on-hand and reserved, and fulfils the reservation", async () => {
    const database = completionDatabase();
    const { service } = createService(database);

    const result = await service.completeShipmentTask("task-id", worker);

    // On hand 100 -> 40 and reserved 60 -> 0 in one update.
    expect(database.inventoryBalance.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { productId_locationId: { productId: "product-id", locationId: "location-id" } },
      data: { quantity: { decrement: 60 }, reservedQuantity: { decrement: 60 } },
    }));
    // The Ship transaction is created POSTED without manager approval.
    expect(database.inventoryTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: InventoryAction.SHIP,
        status: TransactionStatus.POSTED,
        quantity: 60,
        systemQuantityBefore: 100,
        systemQuantityAfter: 40,
        referenceNumber: "ORDER-1005",
      }),
    }));
    expect(database.stockReservation.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "reservation-id" },
      data: { status: StockReservationStatus.COMPLETED },
    }));
    expect(database.stockRequest.update).toHaveBeenCalledWith({ where: { id: "request-id" }, data: { status: StockRequestStatus.COMPLETED } });
    expect(database.inventoryTask.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: TaskStatus.COMPLETED }) }));
    expect(database.reservationAuditEvent.create).toHaveBeenCalled();
    expect(result.transaction?.id).toBe("tx-id");
  });

  test("partial shipment marks the reservation partially shipped and keeps the rest reserved", async () => {
    const database = completionDatabase({
      inventoryTask: {
        findUnique: jest.fn().mockResolvedValue(shipmentTask({ quantity: 40, reservation: { id: "reservation-id", request: { id: "request-id" } } })),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "task-id", status: TaskStatus.COMPLETED }),
        update: jest.fn(),
      },
      stockRequestLine: {
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([{ requiredQuantity: 60, shippedQuantity: 40 }]),
      },
    });
    const { service } = createService(database);

    const result = await service.completeShipmentTask("task-id", worker);

    expect(database.inventoryBalance.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { quantity: { decrement: 40 }, reservedQuantity: { decrement: 40 } },
    }));
    expect(database.stockReservation.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: StockReservationStatus.PARTIALLY_SHIPPED },
    }));
    expect(database.stockRequest.update).toHaveBeenCalledWith({ where: { id: "request-id" }, data: { status: StockRequestStatus.PARTIALLY_FULFILLED } });
    expect(result.task?.status).toBe(TaskStatus.COMPLETED);
  });

  test("keeps a multi-allocation reservation open until every allocation is shipped or released", async () => {
    const database = completionDatabase({
      stockReservation: {
        findUnique: jest.fn().mockResolvedValue(shipmentReservation({
          allocations: [
            shipmentReservation().allocations[0],
            {
              id: "allocation-2",
              requestLineId: "line-2",
              productId: "product-2",
              locationId: "location-2",
              quantity: 10,
              shippedQuantity: 0,
              releasedQuantity: 0,
              product: { id: "product-2", name: "Helmet", unit: "piece" },
              location: { id: "location-2", name: "Storage 2" },
            },
          ],
        })),
        update: jest.fn(),
      },
    });
    const { service } = createService(database);

    await service.completeShipmentTask("task-id", worker);

    expect(database.stockReservation.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: StockReservationStatus.PARTIALLY_SHIPPED },
    }));
  });

  test("rejects over-fulfilment: shipped quantity can never exceed the reservation quantity", async () => {
    const database = completionDatabase({
      inventoryTask: {
        findUnique: jest.fn().mockResolvedValue(shipmentTask({ quantity: 61, reservation: { id: "reservation-id", request: { id: "request-id" } } })),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
    });
    const { service } = createService(database);

    await expect(service.completeShipmentTask("task-id", worker)).rejects.toBeInstanceOf(ConflictException);
    expect(database.inventoryBalance.update).not.toHaveBeenCalled();
  });

  test("rejects a shipment when the balance no longer has the reserved stock", async () => {
    const database = completionDatabase({
      inventoryBalance: {
        findUnique: jest.fn().mockResolvedValue({ quantity: 30, reservedQuantity: 20 }),
        update: jest.fn(),
      },
    });
    const { service } = createService(database);

    await expect(service.completeShipmentTask("task-id", worker)).rejects.toBeInstanceOf(ConflictException);
    expect(database.inventoryBalance.update).not.toHaveBeenCalled();
  });

  test("only the assigned warehouse executive can complete the shipment task", async () => {
    const otherWorker: AuthenticatedUser = { subject: "other", username: "worker2", email: "worker2@example.com", roles: ["worker"] };
    const database: Record<string, unknown> = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: "other-worker-id", displayName: "Other" }),
      },
      $transaction: jest.fn(async (operation: (client: typeof database) => unknown) => operation(database)),
      inventoryTask: {
        findUnique: jest.fn().mockResolvedValue(shipmentTask({ assignedToId: "worker-id", reservation: { id: "reservation-id", request: { id: "request-id" } } })),
      },
    };
    const { service } = createService(database);

    await expect(service.completeShipmentTask("task-id", otherWorker)).rejects.toBeInstanceOf(ForbiddenException);
  });

  test("cancelling a reservation cancels its open shipment tasks and releases the reserved stock", async () => {
    const openTask = shipmentTask({ id: "task-1", assignedToId: "worker-id" });
    const database = {
      stockReservation: {
        findUnique: jest.fn().mockResolvedValue(shipmentReservation({ request: { id: "request-id" } })),
        update: jest.fn(),
      },
      inventoryBalance: { update: jest.fn() },
      stockRequestLine: {
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([{ reservedQuantity: 0 }]),
      },
      stockReservationAllocation: { update: jest.fn() },
      inventoryTask: {
        findMany: jest.fn().mockResolvedValue([openTask]),
        update: jest.fn(),
      },
      stockRequest: { update: jest.fn() },
      reservationAuditEvent: { create: jest.fn() },
    };
    const { service, notifications } = createService(database);

    const result = await service.release("reservation-id", "Customer postponed the order.", manager);

    expect(database.inventoryBalance.update).toHaveBeenCalledWith(expect.objectContaining({ data: { reservedQuantity: { decrement: 60 } } }));
    expect(database.inventoryTask.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "task-1" },
      data: expect.objectContaining({ status: TaskStatus.CANCELLED }),
    }));
    expect(notifications.createForUser).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ userId: "worker-id" }));
    expect(result.cancelledShipmentTasks).toBe(1);
  });
});

describe("ReservationsService voice-confirmed shipment", () => {
  beforeEach(() => {
    process.env.STOCK_RESERVATIONS_ENABLED = "true";
  });

  test("posts the linked pending transaction with reservation-aware stock movement", async () => {
    const database = {
      inventoryTransaction: {
        findUnique: jest.fn().mockResolvedValue({
          id: "tx-id",
          status: TransactionStatus.PENDING,
          task: shipmentTask({ status: TaskStatus.IN_PROGRESS }),
        }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "tx-id", status: TransactionStatus.POSTED }),
        update: jest.fn().mockResolvedValue({ id: "tx-id", status: TransactionStatus.POSTED }),
      },
      stockReservation: {
        findUnique: jest.fn().mockResolvedValue(shipmentReservation()),
        update: jest.fn(),
      },
      inventoryBalance: {
        findUnique: jest.fn().mockResolvedValue({ quantity: 100, reservedQuantity: 60 }),
        update: jest.fn(),
      },
      stockRequestLine: {
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([{ requiredQuantity: 60, shippedQuantity: 60 }]),
      },
      stockReservationAllocation: { update: jest.fn() },
      inventoryTask: { update: jest.fn() },
      stockRequest: { update: jest.fn() },
      reservationAuditEvent: { create: jest.fn() },
    };
    const { service } = createService(database);

    const result = await service.confirmShipmentTransaction("tx-id", worker);

    expect(result.outcome).toBe("POSTED");
    expect(database.inventoryBalance.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { quantity: { decrement: 60 }, reservedQuantity: { decrement: 60 } },
    }));
    expect(database.inventoryTransaction.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "tx-id" },
      data: expect.objectContaining({ status: TransactionStatus.POSTED, systemQuantityAfter: 40 }),
    }));
    expect(database.stockReservation.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: StockReservationStatus.COMPLETED } }));
  });

  test("rejects confirmation by a user who is not the assigned worker", async () => {
    const otherWorker: AuthenticatedUser = { subject: "other", username: "worker2", email: "worker2@example.com", roles: ["worker"] };
    const database: Record<string, unknown> = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: "other-worker-id", displayName: "Other" }),
      },
      $transaction: jest.fn(async (operation: (client: typeof database) => unknown) => operation(database)),
      inventoryTransaction: {
        findUnique: jest.fn().mockResolvedValue({
          id: "tx-id",
          status: TransactionStatus.PENDING,
          task: shipmentTask({ assignedToId: "worker-id", status: TaskStatus.IN_PROGRESS }),
        }),
      },
    };
    const { service } = createService(database);

    await expect(service.confirmShipmentTransaction("tx-id", otherWorker)).rejects.toBeInstanceOf(ForbiddenException);
  });
});

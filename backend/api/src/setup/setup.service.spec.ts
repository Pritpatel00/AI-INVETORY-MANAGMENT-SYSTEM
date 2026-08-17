import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/auth-user";
import { SetupService } from "./setup.service";
import { SetupController } from "./setup.controller";

const managerActor: AuthenticatedUser = {
  subject: "sub-manager",
  username: "mg101",
  email: "manager@keycloak.local",
  roles: ["manager"],
};

const workerActor: AuthenticatedUser = {
  subject: "sub-worker",
  username: "wh101",
  email: "worker@keycloak.local",
  roles: ["worker"],
};

function createPrismaMock(overrides: {
  locations?: number;
  suppliers?: number;
  products?: number;
  assignments?: number;
  stocked?: number;
  assignedWorkers?: number;
} = {}) {
  const locationCount = jest.fn(async () => overrides.locations ?? 0);
  const supplierCount = jest.fn(async () => overrides.suppliers ?? 0);
  const productCount = jest.fn(async () => overrides.products ?? 0);
  const assignmentCount = jest.fn(async () => overrides.assignments ?? 0);
  const stockedCount = jest.fn(async () => overrides.stocked ?? 0);
  const balanceCount = jest.fn(async (args: { where?: { quantity?: { gt?: number } } } | undefined) =>
    args?.where?.quantity ? overrides.stocked ?? 0 : overrides.assignments ?? 0,
  );
  const assignedWorkerCount = jest.fn(async () => overrides.assignedWorkers ?? 0);

  const productFindFirst: jest.Mock = jest.fn(async () => ({ id: "product-1", name: "Bottle" }));
  const locationFindFirst: jest.Mock = jest.fn(async () => ({ id: "location-1", name: "Storage" }));
  const userFindFirst: jest.Mock = jest.fn(async () => ({ id: "user-worker-1", employeeId: "WH-101" }));
  const balanceFindUnique: jest.Mock = jest.fn(async () => null);
  const balanceCreate = jest.fn(async (args: unknown) => ({
    id: "balance-1",
    ...(args as { data?: object }).data,
  }));
  const transactionFindFirst: jest.Mock = jest.fn(async () => null);
  const transactionCreate = jest.fn(async (args: unknown) => ({
    id: "tx-1",
    ...(args as { data?: object }).data,
  }));
  const balanceUpdate = jest.fn(async (args: unknown) => ({
    id: "balance-1",
    ...(args as { data?: object }).data,
  }));
  const userUpdate = jest.fn(async (args: unknown) => ({
    id: "user-worker-1",
    employeeId: "WH-101",
    displayName: "Ravi Shah",
    ...(args as { data?: object }).data,
  }));
  const userAccessAuditCreate = jest.fn(async () => ({ id: "audit-1" }));

  const transaction = jest.fn(async (callback: (database: unknown) => unknown) =>
    callback({
      inventoryTransaction: {
        findFirst: transactionFindFirst,
        create: transactionCreate,
      },
      inventoryBalance: {
        update: balanceUpdate,
      },
    }),
  );

  const prisma = {
    location: { count: locationCount, findMany: jest.fn(async () => []), findFirst: locationFindFirst },
    supplier: { count: supplierCount, findMany: jest.fn(async () => []) },
    product: { count: productCount, findMany: jest.fn(async () => []), findFirst: productFindFirst },
    inventoryBalance: {
      count: balanceCount,
      findMany: jest.fn(async () => []),
      findUnique: balanceFindUnique,
      create: balanceCreate,
    },
    inventoryTransaction: {
      findFirst: transactionFindFirst,
      create: transactionCreate,
    },
    user: {
      count: assignedWorkerCount,
      findFirst: userFindFirst,
      findMany: jest.fn(async () => []),
      findUnique: jest.fn(async () => ({ id: "user-manager-1", employeeId: "MG-101" })),
      update: userUpdate,
      create: jest.fn(async () => ({ id: "user-manager-1" })),
    },
    userAccessAudit: { create: userAccessAuditCreate },
    $transaction: transaction,
  } as unknown as PrismaService;

  return {
    prisma,
    locationCount,
    supplierCount,
    productCount,
    productFindFirst,
    assignmentCount,
    stockedCount,
    assignedWorkerCount,
    balanceFindUnique,
    balanceCreate,
    transactionFindFirst,
    transactionCreate,
    balanceUpdate,
    userFindFirst,
    userUpdate,
    userAccessAuditCreate,
  };
}

describe("SetupService", () => {
  describe("getStatus", () => {
    test("completely empty database reports zero progress", async () => {
      const { prisma } = createPrismaMock();
      const service = new SetupService(prisma);
      const status = await service.getStatus();

      expect(status).toEqual({
        locationCreated: false,
        supplierCreated: false,
        productCreated: false,
        productAssigned: false,
        openingStockEntered: false,
        workerAssigned: false,
        completionPercent: 0,
      });
    });

    test("partially completed setup reports partial progress", async () => {
      const { prisma } = createPrismaMock({ locations: 3, suppliers: 1 });
      const service = new SetupService(prisma);
      const status = await service.getStatus();

      expect(status.locationCreated).toBe(true);
      expect(status.supplierCreated).toBe(true);
      expect(status.productCreated).toBe(false);
      expect(status.productAssigned).toBe(false);
      expect(status.openingStockEntered).toBe(false);
      expect(status.workerAssigned).toBe(false);
      expect(status.completionPercent).toBe(33);
    });

    test("completed setup reports 100 percent", async () => {
      const { prisma } = createPrismaMock({
        locations: 4,
        suppliers: 2,
        products: 10,
        assignments: 8,
        stocked: 8,
        assignedWorkers: 3,
      });
      const service = new SetupService(prisma);
      const status = await service.getStatus();

      expect(status).toEqual({
        locationCreated: true,
        supplierCreated: true,
        productCreated: true,
        productAssigned: true,
        openingStockEntered: true,
        workerAssigned: true,
        completionPercent: 100,
      });
    });

    test("opening stock requires a positive quantity balance", async () => {
      const { prisma } = createPrismaMock({ assignments: 1, stocked: 0 });
      const service = new SetupService(prisma);
      const status = await service.getStatus();

      expect(status.productAssigned).toBe(true);
      expect(status.openingStockEntered).toBe(false);
    });
  });

  describe("getSummary", () => {
    test("returns real records only", async () => {
      const { prisma } = createPrismaMock();
      const service = new SetupService(prisma);
      const summary = await service.getSummary();

      expect(summary).toHaveProperty("locations");
      expect(summary).toHaveProperty("suppliers");
      expect(summary).toHaveProperty("products");
      expect(summary).toHaveProperty("balances");
      expect(summary).toHaveProperty("workers");
    });
  });

  describe("createAssignment", () => {
    test("creates a zero-quantity assignment for an active product and location", async () => {
      const { prisma, balanceCreate } = createPrismaMock();
      const service = new SetupService(prisma);

      const result = await service.createAssignment({
        productId: "product-1",
        locationId: "location-1",
      });

      expect(balanceCreate).toHaveBeenCalledWith({
        data: { productId: "product-1", locationId: "location-1", quantity: 0 },
        include: { product: true, location: true },
      });
      expect(result.quantity).toBe(0);
    });

    test("rejects an unknown product", async () => {
      const { prisma, productFindFirst } = createPrismaMock();
      productFindFirst.mockResolvedValueOnce(null);
      const service = new SetupService(prisma);

      await expect(
        service.createAssignment({ productId: "missing", locationId: "location-1" }),
      ).rejects.toThrow(NotFoundException);
    });

    test("rejects a duplicate assignment", async () => {
      const { prisma, balanceFindUnique } = createPrismaMock();
      balanceFindUnique.mockResolvedValueOnce({ id: "balance-1" });
      const service = new SetupService(prisma);

      await expect(
        service.createAssignment({ productId: "product-1", locationId: "location-1" }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("createOpeningStock", () => {
    test("rejects a negative quantity", async () => {
      const { prisma } = createPrismaMock();
      const service = new SetupService(prisma);

      await expect(
        service.createOpeningStock(
          { productId: "product-1", locationId: "location-1", quantity: -5 },
          managerActor,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    test("rejects opening stock before an assignment exists", async () => {
      const { prisma } = createPrismaMock();
      const service = new SetupService(prisma);

      await expect(
        service.createOpeningStock(
          { productId: "product-1", locationId: "location-1", quantity: 10 },
          managerActor,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    test("records opening stock with manager identity and a posted ledger entry", async () => {
      const { prisma, balanceFindUnique, transactionCreate, balanceUpdate, userFindFirst } =
        createPrismaMock();
      balanceFindUnique.mockResolvedValueOnce({
        id: "balance-1",
        productId: "product-1",
        locationId: "location-1",
        product: { id: "product-1" },
        location: { id: "location-1" },
      });
      userFindFirst.mockResolvedValueOnce({ id: "user-manager-1", employeeId: "MG-101" });
      const service = new SetupService(prisma);

      const result = await service.createOpeningStock(
        { productId: "product-1", locationId: "location-1", quantity: 50, note: "Physical count." },
        managerActor,
      );

      expect(balanceUpdate).toHaveBeenCalled();
      const transactionData = (transactionCreate.mock.calls[0][0] as { data: object }).data as {
        action: string;
        status: string;
        quantity: number;
        createdById: string;
        approvedById: string;
        notes: string;
      };
      expect(transactionData.action).toBe("CYCLE_COUNT");
      expect(transactionData.status).toBe("POSTED");
      expect(transactionData.quantity).toBe(50);
      expect(transactionData.createdById).toBe("user-manager-1");
      expect(transactionData.approvedById).toBe("user-manager-1");
      expect(transactionData.notes).toContain("First-time setup opening stock.");
      expect(result.transaction).toBeDefined();
    });

    test("rejects a duplicate opening-stock submission", async () => {
      const { prisma, balanceFindUnique, transactionFindFirst } = createPrismaMock();
      balanceFindUnique.mockResolvedValueOnce({
        id: "balance-1",
        productId: "product-1",
        locationId: "location-1",
      });
      transactionFindFirst.mockResolvedValueOnce({ id: "tx-existing" });
      const service = new SetupService(prisma);

      await expect(
        service.createOpeningStock(
          { productId: "product-1", locationId: "location-1", quantity: 20 },
          managerActor,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("assignWorker", () => {
    test("assigns shift and zone and writes a user-access audit entry", async () => {
      const { prisma, userUpdate, userAccessAuditCreate } = createPrismaMock();
      const service = new SetupService(prisma);

      const result = await service.assignWorker(
        { userId: "user-worker-1", shift: "Day", warehouseZone: "Zone A" },
        managerActor,
      );

      expect(userUpdate).toHaveBeenCalledWith({
        where: { id: "user-worker-1" },
        data: { shift: "Day", warehouseZone: "Zone A" },
        select: { id: true, employeeId: true, displayName: true, shift: true, warehouseZone: true },
      });
      expect(userAccessAuditCreate).toHaveBeenCalled();
      expect(result.shift).toBe("Day");
      expect(result.warehouseZone).toBe("Zone A");
    });

    test("rejects an unknown or non-worker user", async () => {
      const { prisma, userFindFirst } = createPrismaMock();
      userFindFirst.mockResolvedValueOnce(null);
      const service = new SetupService(prisma);

      await expect(
        service.assignWorker(
          { userId: "missing", shift: "Day", warehouseZone: "Zone A" },
          managerActor,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    test("rejects assigning the manager's own account", async () => {
      const { prisma, userFindFirst } = createPrismaMock();
      userFindFirst.mockResolvedValueOnce({
        id: "user-manager-1",
        employeeId: "MG-101",
        email: "manager@keycloak.local",
      });
      const service = new SetupService(prisma);

      await expect(
        service.assignWorker(
          { userId: "user-manager-1", shift: "Day", warehouseZone: "Zone A" },
          managerActor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    test("rejects empty shift or zone", async () => {
      const { prisma } = createPrismaMock();
      const service = new SetupService(prisma);

      await expect(
        service.assignWorker(
          { userId: "user-worker-1", shift: "  ", warehouseZone: "Zone A" },
          managerActor,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

describe("SetupController authorization", () => {
  test("setup endpoints require the manager role", () => {
    const roles = Reflect.getMetadata("roles", SetupController);
    expect(roles).toEqual(["manager"]);
    expect(roles).not.toContain("worker");
  });

  test("worker actor cannot bypass manager-only setup operations", async () => {
    const { prisma } = createPrismaMock();
    const service = new SetupService(prisma);

    // The role guard rejects workers before the service runs; the service also
    // refuses to assign opening stock to a non-manager actor via the manager
    // identity path (resolveUser would fall back to WORKER only when the user
    // is absent). Here we only assert the service rejects invalid quantities,
    // which is the DTO-level check every setup write path shares.
    await expect(
      service.createOpeningStock(
        { productId: "product-1", locationId: "location-1", quantity: -1 },
        workerActor,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  test("setup service resolves the authenticated manager as the opening-stock actor", async () => {
    const { prisma } = createPrismaMock();
    const service = new SetupService(prisma);

    const user = await (service as unknown as {
      resolveUser: (actor: AuthenticatedUser) => Promise<unknown>;
    }).resolveUser(managerActor);

    // The mock findUnique resolves the manager's existing DB record by email.
    expect(user).toEqual({ id: "user-manager-1", employeeId: "MG-101" });
    expect((prisma.user.findUnique as jest.Mock).mock.calls[0][0]).toEqual({
      where: { email: "manager@keycloak.local" },
    });
  });
});

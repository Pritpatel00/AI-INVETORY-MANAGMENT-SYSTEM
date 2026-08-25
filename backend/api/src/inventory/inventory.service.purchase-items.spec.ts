import { Prisma, ReorderStatus } from "@prisma/client";

import type { AuthenticatedUser } from "../auth/auth-user";
import { DiscrepancyAuditService } from "../discrepancies/discrepancy-audit.service";
import { DiscrepancyRulesService } from "../discrepancies/discrepancy-rules.service";
import { DiscrepanciesService } from "../discrepancies/discrepancies.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { TasksService } from "../tasks/tasks.service";
import { InventoryService } from "./inventory.service";
import { InventoryRulesEngine } from "./rules/inventory-rules.engine";

const manager: AuthenticatedUser = {
  subject: "manager-subject",
  username: "manager-001",
  email: "manager@example.com",
  roles: ["manager"],
};

function createService(prisma: object) {
  return new InventoryService(
    prisma as PrismaService,
    new InventoryRulesEngine(),
    {} as TasksService,
    new DiscrepancyRulesService(),
    {} as DiscrepanciesService,
    {} as DiscrepancyAuditService,
    {} as NotificationsService,
  );
}

describe("InventoryService Purchase Items cleanup", () => {
  test("returns only active low-stock purchase entries", async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = createService({ reorderDraft: { findMany } });

    await service.listReorderDrafts(manager);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: ReorderStatus.DRAFT,
          activeKey: { not: null },
          product: { active: true },
        },
      }),
    );
  });

  test("removes a fulfilled item from the active purchase list", async () => {
    const update = jest.fn().mockResolvedValue({});
    const database = {
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
      product: {
        findUnique: jest.fn().mockResolvedValue({
          active: true,
          safetyStock: 20,
          reorderQuantity: 40,
        }),
      },
      inventoryBalance: {
        findMany: jest.fn().mockResolvedValue([
          {
            locationId: "location-id",
            quantity: 25,
          },
        ]),
      },
      reorderDraft: {
        findUnique: jest.fn().mockResolvedValue({
          id: "draft-id",
          status: ReorderStatus.DRAFT,
        }),
        update,
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const service = createService({});
    const synchronizer = service as unknown as {
      syncReorderDrafts(
        client: typeof database,
        productId: string,
        locationIds: string[],
      ): Promise<void>;
    };

    await synchronizer.syncReorderDrafts(database, "product-id", ["location-id"]);

    expect(update).toHaveBeenCalledWith({
      where: { id: "draft-id" },
      data: expect.objectContaining({
        status: ReorderStatus.CANCELLED,
        activeKey: null,
        currentStock: 25,
      }),
    });
  });

  test("hides purchase entries when their catalog item is deleted", async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const product = { id: "product-id", name: "Cable", active: true };
    const prisma = {
      product: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(product)
          .mockResolvedValueOnce({ ...product, active: false }),
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ ...product, active: false }),
        update: jest.fn().mockResolvedValue({ ...product, active: false }),
      },
      inventoryBalance: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      reorderDraft: { updateMany },
      $transaction: jest.fn().mockImplementation((operations: unknown[]) =>
        Promise.all(operations),
      ),
    };
    const service = createService(prisma);

    await service.deactivateProduct("product-id");

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId: "product-id", status: ReorderStatus.DRAFT },
        data: expect.objectContaining({
          status: ReorderStatus.CANCELLED,
          activeKey: null,
        }),
      }),
    );
  });

  test("retries a manual refresh after a serializable write conflict", async () => {
    const conflict = new Prisma.PrismaClientKnownRequestError(
      "Write conflict",
      { code: "P2034", clientVersion: "6.19.0" },
    );
    const database = {
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
      product: {
        findUnique: jest.fn().mockResolvedValue({
          active: true,
          safetyStock: 10,
          reorderQuantity: 20,
        }),
      },
      inventoryBalance: {
        findMany: jest.fn().mockResolvedValue([{ locationId: "location-id", quantity: 20 }]),
      },
      reorderDraft: {
        findUnique: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const transaction = jest.fn()
      .mockRejectedValueOnce(conflict)
      .mockImplementation(async (operation: (client: typeof database) => Promise<void>) => operation(database));
    const listFindMany = jest.fn().mockResolvedValue([]);
    const service = createService({
      product: {
        findMany: jest.fn().mockResolvedValue([{ id: "product-id", balances: [{ locationId: "location-id" }] }]),
      },
      reorderDraft: { findMany: listFindMany },
      $transaction: transaction,
    });

    await service.refreshReorderDrafts(manager);

    expect(transaction).toHaveBeenCalledTimes(2);
    expect(listFindMany).toHaveBeenCalled();
  });

  test("creates one product-level Purchase Item for a zero-stock assigned product", async () => {
    const create = jest.fn().mockResolvedValue({ id: "draft-id" });
    const database = {
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
      product: {
        findUnique: jest.fn().mockResolvedValue({
          active: true,
          safetyStock: 12,
          reorderQuantity: 24,
        }),
      },
      inventoryBalance: {
        findMany: jest.fn().mockResolvedValue([{ locationId: "location-id", quantity: 0 }]),
      },
      reorderDraft: {
        findUnique: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create,
      },
    };
    const service = createService({
      product: {
        findMany: jest.fn().mockResolvedValue([{ id: "product-id", balances: [{ locationId: "location-id" }] }]),
      },
      reorderDraft: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn().mockImplementation(async (operation: (client: typeof database) => Promise<void>) => operation(database)),
    });

    await service.refreshReorderDrafts(manager);

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        activeKey: "product-id:SYSTEM",
        productId: "product-id",
        locationId: "location-id",
        currentStock: 0,
        safetyStock: 12,
        suggestedQuantity: 24,
      }),
    });
  });
});

import { InventoryAction, PrismaClient, TransactionStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const transactionFilter = { clientRequestId: { startsWith: "warehouse-sample-v1-" } } as const;
  const [locations, items, transactions, actionCounts, statusCounts, dateRange, invalidNormalApprovals] = await Promise.all([
    prisma.location.count({ where: { code: { in: ["MAIN-WH", "WAREHOUSE-1", "WAREHOUSE-2", "STORE-ROOM", "STOCK-ROOM", "RECEIVING-DOCK", "SHIPPING-DOCK", "LOADING-BAY", "PACKING-ROOM", "RETURN-ROOM", "DAMAGE-ROOM"] } } }),
    prisma.product.count({ where: { sku: { startsWith: "SAMPLE-" } } }),
    prisma.inventoryTransaction.count({ where: transactionFilter }),
    prisma.inventoryTransaction.groupBy({ by: ["action"], where: transactionFilter, _count: { _all: true }, orderBy: { action: "asc" } }),
    prisma.inventoryTransaction.groupBy({ by: ["status"], where: transactionFilter, _count: { _all: true }, orderBy: { status: "asc" } }),
    prisma.inventoryTransaction.aggregate({ where: transactionFilter, _min: { createdAt: true }, _max: { createdAt: true } }),
    prisma.inventoryTransaction.count({
      where: {
        ...transactionFilter,
        status: TransactionStatus.PENDING,
        action: { in: [InventoryAction.RECEIVE, InventoryAction.SHIP, InventoryAction.TRANSFER] },
      },
    }),
  ]);

  const result = {
    locations,
    items,
    transactions,
    oldest: dateRange._min.createdAt?.toISOString(),
    newest: dateRange._max.createdAt?.toISOString(),
    actions: Object.fromEntries(actionCounts.map((row) => [row.action, row._count._all])),
    statuses: Object.fromEntries(statusCounts.map((row) => [row.status, row._count._all])),
    invalidNormalApprovals,
    passed: locations === 11 && items === 15 && transactions === 50 && actionCounts.length === 7 && invalidNormalApprovals === 0,
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.passed) process.exitCode = 1;
}

main().finally(async () => prisma.$disconnect());

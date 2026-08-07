import {
  InventoryAction,
  PrismaClient,
  StockCondition,
  TransactionStatus,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

const sampleLocations = [
  ["MAIN-WH", "Main Warehouse"],
  ["WAREHOUSE-1", "Warehouse One"],
  ["WAREHOUSE-2", "Warehouse Two"],
  ["STORE-ROOM", "Store Room"],
  ["STOCK-ROOM", "Stock Room"],
  ["RECEIVING-DOCK", "Receiving Dock"],
  ["SHIPPING-DOCK", "Shipping Dock"],
  ["LOADING-BAY", "Loading Bay"],
  ["PACKING-ROOM", "Packing Room"],
  ["RETURN-ROOM", "Return Room"],
  ["DAMAGE-ROOM", "Damage Room"],
] as const;

const sampleItems = [
  ["SAMPLE-001", "Red Box", "MAIN-WH"],
  ["SAMPLE-002", "Blue Box", "WAREHOUSE-1"],
  ["SAMPLE-003", "Tape Roll", "PACKING-ROOM"],
  ["SAMPLE-004", "Paper Pack", "STORE-ROOM"],
  ["SAMPLE-005", "Safety Gloves", "STOCK-ROOM"],
  ["SAMPLE-006", "Water Bottle", "WAREHOUSE-2"],
  ["SAMPLE-007", "Plastic Bag", "PACKING-ROOM"],
  ["SAMPLE-008", "Cleaning Cloth", "STORE-ROOM"],
  ["SAMPLE-009", "Small Cable", "WAREHOUSE-1"],
  ["SAMPLE-010", "Tool Kit", "MAIN-WH"],
  ["SAMPLE-011", "Light Bulb", "STOCK-ROOM"],
  ["SAMPLE-012", "Storage Bin", "WAREHOUSE-2"],
  ["SAMPLE-013", "Hand Soap", "STORE-ROOM"],
  ["SAMPLE-014", "Face Mask", "STOCK-ROOM"],
  ["SAMPLE-015", "Cardboard Box", "MAIN-WH"],
] as const;

const actions = [
  InventoryAction.RECEIVE,
  InventoryAction.SHIP,
  InventoryAction.USE,
  InventoryAction.TRANSFER,
  InventoryAction.CYCLE_COUNT,
  InventoryAction.DAMAGE,
  InventoryAction.LOSS,
] as const;

const reviewActions = new Set<InventoryAction>([
  InventoryAction.CYCLE_COUNT,
  InventoryAction.DAMAGE,
  InventoryAction.LOSS,
]);

function sampleDate(index: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - (index % 7));
  date.setUTCHours(8 + ((index * 3) % 11), (index * 13) % 60, (index * 17) % 60, 0);
  return date;
}

function statusFor(action: InventoryAction, index: number) {
  if (!reviewActions.has(action)) return TransactionStatus.POSTED;
  const reviewState = index % 4;
  if (reviewState === 0) return TransactionStatus.PENDING;
  if (reviewState === 1) return TransactionStatus.POSTED;
  if (reviewState === 2) return TransactionStatus.REJECTED;
  return TransactionStatus.RECOUNT_REQUESTED;
}

function transcriptFor(action: InventoryAction, quantity: number, item: string, from: string, to?: string) {
  if (action === InventoryAction.RECEIVE) return `I received ${quantity} ${item} in ${from}.`;
  if (action === InventoryAction.SHIP) return `I shipped ${quantity} ${item} from ${from}.`;
  if (action === InventoryAction.USE) return `I used ${quantity} ${item} from ${from}.`;
  if (action === InventoryAction.TRANSFER) return `I moved ${quantity} ${item} from ${from} to ${to}.`;
  if (action === InventoryAction.CYCLE_COUNT) return `I counted ${quantity} ${item} in ${from}.`;
  if (action === InventoryAction.DAMAGE) return `I found ${quantity} damaged ${item} in ${from}.`;
  return `I found ${quantity} missing ${item} from ${from}.`;
}

async function ensureBalance(productId: string, locationId: string, openingQuantity = 0) {
  return prisma.inventoryBalance.upsert({
    where: { productId_locationId: { productId, locationId } },
    update: {},
    create: { productId, locationId, quantity: openingQuantity, reservedQuantity: 0 },
  });
}

async function applyPostedMovement(input: {
  action: InventoryAction;
  productId: string;
  quantity: number;
  sourceLocationId?: string;
  destinationLocationId?: string;
}) {
  if (input.action === InventoryAction.RECEIVE) {
    await prisma.inventoryBalance.update({
      where: { productId_locationId: { productId: input.productId, locationId: input.destinationLocationId! } },
      data: { quantity: { increment: input.quantity } },
    });
    return;
  }
  if ([InventoryAction.SHIP, InventoryAction.USE, InventoryAction.DAMAGE, InventoryAction.LOSS].includes(input.action)) {
    await prisma.inventoryBalance.update({
      where: { productId_locationId: { productId: input.productId, locationId: input.sourceLocationId! } },
      data: { quantity: { decrement: input.quantity } },
    });
    return;
  }
  if (input.action === InventoryAction.TRANSFER) {
    await prisma.$transaction([
      prisma.inventoryBalance.update({
        where: { productId_locationId: { productId: input.productId, locationId: input.sourceLocationId! } },
        data: { quantity: { decrement: input.quantity } },
      }),
      prisma.inventoryBalance.update({
        where: { productId_locationId: { productId: input.productId, locationId: input.destinationLocationId! } },
        data: { quantity: { increment: input.quantity } },
      }),
    ]);
    return;
  }
  if (input.action === InventoryAction.CYCLE_COUNT) {
    await prisma.inventoryBalance.update({
      where: { productId_locationId: { productId: input.productId, locationId: input.sourceLocationId! } },
      data: { quantity: input.quantity },
    });
  }
}

async function main() {
  const worker =
    (await prisma.user.findFirst({ where: { role: UserRole.WORKER, active: true }, orderBy: { createdAt: "asc" } })) ??
    (await prisma.user.create({
      data: { employeeId: "SAMPLE-WORKER", email: "sample.worker@inventory.local", displayName: "Sample Warehouse Executive", role: UserRole.WORKER },
    }));
  const manager =
    (await prisma.user.findFirst({ where: { role: UserRole.MANAGER, active: true }, orderBy: { createdAt: "asc" } })) ??
    (await prisma.user.create({
      data: { employeeId: "SAMPLE-MANAGER", email: "sample.manager@inventory.local", displayName: "Sample Inventory Manager", role: UserRole.MANAGER },
    }));

  const supplier = await prisma.supplier.upsert({
    where: { code: "SAMPLE-SUP" },
    update: { name: "Sample Warehouse Supplier", active: true },
    create: { code: "SAMPLE-SUP", name: "Sample Warehouse Supplier", email: "orders@sample-supplier.local", leadTimeDays: 3, minimumOrderQuantity: 10 },
  });

  const locations = new Map<string, { id: string; name: string }>();
  for (const [code, name] of sampleLocations) {
    const saved = await prisma.location.upsert({
      where: { code },
      update: { name, description: `${name} sample warehouse location`, active: true },
      create: { code, name, description: `${name} sample warehouse location`, active: true },
    });
    locations.set(code, { id: saved.id, name: saved.name });
  }

  const products: Array<{ id: string; sku: string; name: string; locationCode: string }> = [];
  for (const [sku, name, locationCode] of sampleItems) {
    const product = await prisma.product.upsert({
      where: { sku },
      update: { name, unit: "unit", safetyStock: 20, reorderQuantity: 40, supplierId: supplier.id, supplierName: supplier.name, supplierEmail: supplier.email, active: true },
      create: { sku, name, unit: "unit", safetyStock: 20, reorderQuantity: 40, supplierId: supplier.id, supplierName: supplier.name, supplierEmail: supplier.email, active: true },
    });
    products.push({ id: product.id, sku, name, locationCode });
    await ensureBalance(product.id, locations.get(locationCode)!.id, 120 + products.length * 3);
  }

  let created = 0;
  let skipped = 0;
  for (let index = 0; index < 50; index += 1) {
    const clientRequestId = `warehouse-sample-v1-${String(index + 1).padStart(3, "0")}`;
    if (await prisma.inventoryTransaction.findUnique({ where: { clientRequestId } })) {
      skipped += 1;
      continue;
    }

    const product = products[index % products.length];
    const action = actions[index % actions.length];
    const source = locations.get(product.locationCode)!;
    const transferTargets = ["MAIN-WH", "WAREHOUSE-1", "WAREHOUSE-2", "STOCK-ROOM", "STORE-ROOM"];
    const destinationCode = transferTargets.find((code, targetIndex) => code !== product.locationCode && targetIndex === index % transferTargets.length)
      ?? transferTargets.find((code) => code !== product.locationCode)!;
    const destination = locations.get(destinationCode)!;
    await ensureBalance(product.id, source.id, 120);
    if (action === InventoryAction.TRANSFER) await ensureBalance(product.id, destination.id, 0);

    const currentBalance = await prisma.inventoryBalance.findUniqueOrThrow({
      where: { productId_locationId: { productId: product.id, locationId: source.id } },
    });
    const movementQuantity = 2 + (index % 7);
    const quantity = action === InventoryAction.CYCLE_COUNT
      ? Math.max(1, currentBalance.quantity + [-6, -2, 4, 8][index % 4])
      : Math.min(movementQuantity, Math.max(1, currentBalance.quantity));
    const status = statusFor(action, index);
    const createdAt = sampleDate(index);
    const controlled = reviewActions.has(action);
    const resultingQuantity = action === InventoryAction.CYCLE_COUNT
      ? quantity
      : currentBalance.quantity - quantity;
    const difference = controlled ? resultingQuantity - currentBalance.quantity : null;
    const percentage = difference === null
      ? null
      : currentBalance.quantity === 0
        ? 100
        : Number(((Math.abs(difference) / currentBalance.quantity) * 100).toFixed(2));
    const posted = status === TransactionStatus.POSTED;
    const reviewed = controlled && status !== TransactionStatus.PENDING;
    const locationName = action === InventoryAction.RECEIVE ? source.name : source.name;

    const transaction = await prisma.inventoryTransaction.create({
      data: {
        clientRequestId,
        action,
        status,
        productId: product.id,
        quantity,
        condition: action === InventoryAction.DAMAGE ? StockCondition.DAMAGED : StockCondition.GOOD,
        sourceLocationId: action === InventoryAction.RECEIVE ? null : source.id,
        destinationLocationId: action === InventoryAction.RECEIVE ? source.id : action === InventoryAction.TRANSFER ? destination.id : null,
        referenceNumber: `SAMPLE-${createdAt.toISOString().slice(0, 10)}-${String(index + 1).padStart(2, "0")}`,
        notes: "Seven-day warehouse demonstration sample.",
        reviewNotes: reviewed ? `Sample manager decision: ${status.toLowerCase().replaceAll("_", " ")}.` : null,
        transcript: transcriptFor(action, quantity, product.name, locationName, destination.name),
        systemQuantityBefore: controlled ? currentBalance.quantity : null,
        discrepancyDifference: difference,
        discrepancyPercentage: percentage,
        significantDiscrepancy: controlled && difference !== null && (Math.abs(difference) >= 5 || (percentage ?? 0) >= 10),
        createdById: worker.id,
        approvedById: reviewed ? manager.id : null,
        createdAt,
        confirmedAt: createdAt,
        approvedAt: reviewed ? new Date(createdAt.getTime() + 20 * 60 * 1000) : null,
        postedAt: posted ? new Date(createdAt.getTime() + (controlled ? 20 : 2) * 60 * 1000) : null,
      },
    });

    if (posted) {
      await applyPostedMovement({
        action,
        productId: product.id,
        quantity,
        sourceLocationId: transaction.sourceLocationId ?? undefined,
        destinationLocationId: transaction.destinationLocationId ?? undefined,
      });
    }
    created += 1;
  }

  const sampleTransactionCount = await prisma.inventoryTransaction.count({
    where: { clientRequestId: { startsWith: "warehouse-sample-v1-" } },
  });
  console.log(JSON.stringify({ locations: sampleLocations.length, items: sampleItems.length, transactions: sampleTransactionCount, created, skipped }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

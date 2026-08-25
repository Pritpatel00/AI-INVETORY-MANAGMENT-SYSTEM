import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Local-development and Playwright test fixture: the demonstration catalogue.
//
// This seed creates the 4 locations, 15 products and opening
// balances used by the demo accounts (worker1, manager1, admin1) and the e2e
// specs. It must NEVER run in a production deployment — the production-safe
// empty setup is `seed-catalog.ts` (`npm run db:seed:catalog`).

const locations = [
  { code: "RECEIVING", name: "Receiving", description: "Incoming stock" },
  { code: "STORAGE", name: "Storage", description: "Available warehouse stock" },
  { code: "PACKING", name: "Packing", description: "Order packing stock" },
  { code: "DISPATCH", name: "Dispatch", description: "Outgoing stock" },
] as const;

const products = [
  { sku: "ITEM-101", name: "Box", unit: "box", safetyStock: 80, reorderQuantity: 200, locationCode: "STORAGE", quantity: 180 },
  { sku: "ITEM-102", name: "Wrap", unit: "roll", safetyStock: 50, reorderQuantity: 100, locationCode: "PACKING", quantity: 72 },
  { sku: "ITEM-103", name: "Gloves", unit: "box", safetyStock: 40, reorderQuantity: 80, locationCode: "STORAGE", quantity: 35 },
  { sku: "ITEM-104", name: "Helmet", unit: "unit", safetyStock: 20, reorderQuantity: 40, locationCode: "STORAGE", quantity: 28 },
  { sku: "ITEM-105", name: "Bolt", unit: "piece", safetyStock: 300, reorderQuantity: 500, locationCode: "STORAGE", quantity: 640 },
  { sku: "ITEM-106", name: "Nut", unit: "piece", safetyStock: 300, reorderQuantity: 500, locationCode: "STORAGE", quantity: 570 },
  { sku: "ITEM-107", name: "Light", unit: "unit", safetyStock: 15, reorderQuantity: 30, locationCode: "STORAGE", quantity: 22 },
  { sku: "ITEM-108", name: "Cable", unit: "unit", safetyStock: 12, reorderQuantity: 24, locationCode: "STORAGE", quantity: 9 },
  { sku: "ITEM-109", name: "Cleaner", unit: "can", safetyStock: 18, reorderQuantity: 36, locationCode: "STORAGE", quantity: 31 },
  { sku: "ITEM-110", name: "Cloth", unit: "pack", safetyStock: 25, reorderQuantity: 50, locationCode: "PACKING", quantity: 44 },
  { sku: "ITEM-111", name: "Wrench", unit: "unit", safetyStock: 10, reorderQuantity: 20, locationCode: "STORAGE", quantity: 16 },
  { sku: "ITEM-112", name: "Bin", unit: "unit", safetyStock: 30, reorderQuantity: 60, locationCode: "STORAGE", quantity: 58 },
  { sku: "ITEM-113", name: "Bearing", unit: "piece", safetyStock: 35, reorderQuantity: 70, locationCode: "STORAGE", quantity: 48 },
  { sku: "ITEM-118", name: "Tape", unit: "roll", safetyStock: 40, reorderQuantity: 80, locationCode: "PACKING", quantity: 25 },
  { sku: "ITEM-402", name: "Bottle", unit: "unit", safetyStock: 60, reorderQuantity: 100, locationCode: "RECEIVING", quantity: 50 },
] as const;

async function main() {
  const locationIds = new Map<string, string>();
  for (const location of locations) {
    const saved = await prisma.location.upsert({
      where: { code: location.code },
      update: { name: location.name, description: location.description, active: true },
      create: { ...location, active: true },
    });
    locationIds.set(location.code, saved.id);
  }

  for (const item of products) {
    const product = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        unit: item.unit,
        safetyStock: item.safetyStock,
        reorderQuantity: item.reorderQuantity,
        active: true,
      },
      create: {
        sku: item.sku,
        name: item.name,
        unit: item.unit,
        safetyStock: item.safetyStock,
        reorderQuantity: item.reorderQuantity,
        active: true,
      },
    });

    await prisma.inventoryBalance.upsert({
      where: {
        productId_locationId: {
          productId: product.id,
          locationId: locationIds.get(item.locationCode)!,
        },
      },
      update: {},
      create: {
        productId: product.id,
        locationId: locationIds.get(item.locationCode)!,
        quantity: item.quantity,
      },
    });
  }

  console.log(`Catalog ready: ${locations.length} locations and ${products.length} items.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

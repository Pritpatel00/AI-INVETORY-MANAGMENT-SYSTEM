import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Local-development and Playwright test fixture: the demonstration catalogue.
//
// This seed creates the 10 suppliers, 4 locations, 15 products and opening
// balances used by the demo accounts (worker1, manager1, admin1) and the e2e
// specs. It must NEVER run in a production deployment — the production-safe
// empty setup is `seed-catalog.ts` (`npm run db:seed:catalog`).

const suppliers = [
  { code: "SUP-001", name: "Blue Star Supplies Pvt. Ltd.", contactName: "Rohan Mehta", email: "orders@bluestar.example", phone: "+91 00000 00101", address: "Ahmedabad, Gujarat", leadTimeDays: 4, minimumOrderQuantity: 25 },
  { code: "SUP-002", name: "PackRight Packaging", contactName: "Neha Shah", email: "sales@packright.example", phone: "+91 00000 00102", address: "Vadodara, Gujarat", leadTimeDays: 3, minimumOrderQuantity: 20 },
  { code: "SUP-003", name: "SafeHands Industrial", contactName: "Amit Verma", email: "orders@safehands.example", phone: "+91 00000 00103", address: "Pune, Maharashtra", leadTimeDays: 5, minimumOrderQuantity: 30 },
  { code: "SUP-004", name: "Metro Fasteners", contactName: "Kavita Rao", email: "dispatch@metrofasteners.example", phone: "+91 00000 00104", address: "Mumbai, Maharashtra", leadTimeDays: 6, minimumOrderQuantity: 100 },
  { code: "SUP-005", name: "Apex Electricals", contactName: "Jignesh Patel", email: "sales@apexelectricals.example", phone: "+91 00000 00105", address: "Surat, Gujarat", leadTimeDays: 4, minimumOrderQuantity: 10 },
  { code: "SUP-006", name: "CleanPro Facility Supplies", contactName: "Pooja Nair", email: "orders@cleanpro.example", phone: "+91 00000 00106", address: "Indore, Madhya Pradesh", leadTimeDays: 3, minimumOrderQuantity: 12 },
  { code: "SUP-007", name: "Prime Tools India", contactName: "Vikram Singh", email: "sales@primetools.example", phone: "+91 00000 00107", address: "Rajkot, Gujarat", leadTimeDays: 7, minimumOrderQuantity: 8 },
  { code: "SUP-008", name: "FlexiPlast Industries", contactName: "Hiral Desai", email: "orders@flexiplast.example", phone: "+91 00000 00108", address: "Daman, India", leadTimeDays: 5, minimumOrderQuantity: 25 },
  { code: "SUP-009", name: "National Bearings Co.", contactName: "Arjun Kapoor", email: "sales@nationalbearings.example", phone: "+91 00000 00109", address: "Delhi, India", leadTimeDays: 8, minimumOrderQuantity: 10 },
  { code: "SUP-010", name: "EcoOffice Solutions", contactName: "Riya Joshi", email: "orders@ecooffice.example", phone: "+91 00000 00110", address: "Jaipur, Rajasthan", leadTimeDays: 4, minimumOrderQuantity: 20 },
] as const;

const locations = [
  { code: "SHELF-A", name: "Shelf A", description: "Small parts and daily-use materials" },
  { code: "SHELF-B", name: "Shelf B", description: "General inventory storage" },
  { code: "BULK-STORAGE", name: "Bulk Storage", description: "Large cartons and reserve stock" },
  { code: "RECEIVING", name: "Receiving Area", description: "Incoming stock verification area" },
] as const;

const products = [
  { sku: "ITEM-101", name: "Corrugated Shipping Box", unit: "box", safetyStock: 80, reorderQuantity: 200, supplierCode: "SUP-002", locationCode: "BULK-STORAGE", quantity: 180, reservedQuantity: 25 },
  { sku: "ITEM-102", name: "Stretch Wrap Roll", unit: "roll", safetyStock: 50, reorderQuantity: 100, supplierCode: "SUP-008", locationCode: "BULK-STORAGE", quantity: 72, reservedQuantity: 8 },
  { sku: "ITEM-103", name: "Nitrile Safety Gloves", unit: "box", safetyStock: 40, reorderQuantity: 80, supplierCode: "SUP-003", locationCode: "SHELF-A", quantity: 35, reservedQuantity: 5 },
  { sku: "ITEM-104", name: "Industrial Safety Helmet", unit: "unit", safetyStock: 20, reorderQuantity: 40, supplierCode: "SUP-003", locationCode: "SHELF-A", quantity: 28, reservedQuantity: 3 },
  { sku: "ITEM-105", name: "Hex Bolt M10", unit: "piece", safetyStock: 300, reorderQuantity: 500, supplierCode: "SUP-004", locationCode: "SHELF-A", quantity: 640, reservedQuantity: 90 },
  { sku: "ITEM-106", name: "Stainless Steel Nut M10", unit: "piece", safetyStock: 300, reorderQuantity: 500, supplierCode: "SUP-004", locationCode: "SHELF-A", quantity: 570, reservedQuantity: 75 },
  { sku: "ITEM-107", name: "LED Work Light", unit: "unit", safetyStock: 15, reorderQuantity: 30, supplierCode: "SUP-005", locationCode: "SHELF-B", quantity: 22, reservedQuantity: 4 },
  { sku: "ITEM-108", name: "Extension Cable 10m", unit: "unit", safetyStock: 12, reorderQuantity: 24, supplierCode: "SUP-005", locationCode: "SHELF-B", quantity: 9, reservedQuantity: 2 },
  { sku: "ITEM-109", name: "Industrial Cleaner 5L", unit: "can", safetyStock: 18, reorderQuantity: 36, supplierCode: "SUP-006", locationCode: "SHELF-B", quantity: 31, reservedQuantity: 5 },
  { sku: "ITEM-110", name: "Microfiber Cloth Pack", unit: "pack", safetyStock: 25, reorderQuantity: 50, supplierCode: "SUP-006", locationCode: "SHELF-B", quantity: 44, reservedQuantity: 6 },
  { sku: "ITEM-111", name: "Adjustable Wrench 12in", unit: "unit", safetyStock: 10, reorderQuantity: 20, supplierCode: "SUP-007", locationCode: "SHELF-A", quantity: 16, reservedQuantity: 2 },
  { sku: "ITEM-112", name: "Plastic Storage Bin", unit: "unit", safetyStock: 30, reorderQuantity: 60, supplierCode: "SUP-008", locationCode: "BULK-STORAGE", quantity: 58, reservedQuantity: 7 },
  { sku: "ITEM-113", name: "Ball Bearing 6204", unit: "piece", safetyStock: 35, reorderQuantity: 70, supplierCode: "SUP-009", locationCode: "SHELF-A", quantity: 48, reservedQuantity: 10 },
  { sku: "ITEM-118", name: "Packing Tape", unit: "roll", safetyStock: 40, reorderQuantity: 80, supplierCode: "SUP-002", locationCode: "SHELF-B", quantity: 25, reservedQuantity: 0 },
  { sku: "ITEM-402", name: "Blue Widget", unit: "unit", safetyStock: 60, reorderQuantity: 100, supplierCode: "SUP-001", locationCode: "SHELF-B", quantity: 50, reservedQuantity: 0 },
] as const;

async function main() {
  const supplierIds = new Map<string, string>();
  for (const supplier of suppliers) {
    const saved = await prisma.supplier.upsert({
      where: { code: supplier.code },
      update: { ...supplier, active: true },
      create: { ...supplier, active: true },
    });
    supplierIds.set(supplier.code, saved.id);
  }

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
    const supplier = suppliers.find((entry) => entry.code === item.supplierCode)!;
    const product = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        unit: item.unit,
        safetyStock: item.safetyStock,
        reorderQuantity: item.reorderQuantity,
        supplierId: supplierIds.get(item.supplierCode),
        supplierName: supplier.name,
        supplierEmail: supplier.email,
        active: true,
      },
      create: {
        sku: item.sku,
        name: item.name,
        unit: item.unit,
        safetyStock: item.safetyStock,
        reorderQuantity: item.reorderQuantity,
        supplierId: supplierIds.get(item.supplierCode),
        supplierName: supplier.name,
        supplierEmail: supplier.email,
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
        reservedQuantity: item.reservedQuantity,
      },
    });
  }

  console.log(`Catalog ready: ${suppliers.length} suppliers and ${products.length} items.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

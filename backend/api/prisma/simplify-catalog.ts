import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const productNames = new Map([
  ["ITEM-100", "Phone"],
  ["ITEM-101", "Box"],
  ["ITEM-102", "Wrap"],
  ["ITEM-103", "Gloves"],
  ["ITEM-104", "Helmet"],
  ["ITEM-105", "Bolt"],
  ["ITEM-106", "Nut"],
  ["ITEM-107", "Light"],
  ["ITEM-108", "Cable"],
  ["ITEM-109", "Cleaner"],
  ["ITEM-110", "Cloth"],
  ["ITEM-111", "Wrench"],
  ["ITEM-112", "Bin"],
  ["ITEM-113", "Bearing"],
  ["ITEM-118", "Tape"],
  ["ITEM-402", "Bottle"],
]);

const simpleLocations = [
  { code: "RECEIVING", name: "Receiving", description: "Incoming stock" },
  { code: "STORAGE", name: "Storage", description: "Available warehouse stock" },
  { code: "PACKING", name: "Packing", description: "Order packing stock" },
  { code: "DISPATCH", name: "Dispatch", description: "Outgoing stock" },
];

async function main() {
  const products = await prisma.product.findMany({ orderBy: { sku: "asc" } });
  const locations = await prisma.location.findMany({ orderBy: { code: "asc" } });
  if (locations.length !== simpleLocations.length) {
    throw new Error(`Expected ${simpleLocations.length} locations but found ${locations.length}. No changes were made.`);
  }

  const backupDirectory = join(process.cwd(), "prisma", "backups");
  mkdirSync(backupDirectory, { recursive: true });
  const backupPath = join(backupDirectory, `catalog-names-before-simple-${Date.now()}.json`);
  writeFileSync(backupPath, JSON.stringify({ createdAt: new Date().toISOString(), products, locations }, null, 2), "utf8");

  await prisma.$transaction(
    locations.map((location) =>
      prisma.location.update({
        where: { id: location.id },
        data: { code: `TEMP-${location.id.slice(0, 8).toUpperCase()}` },
      }),
    ),
  );

  const receiving = locations.find((location) => /receiv/i.test(`${location.code} ${location.name}`));
  const remaining = locations.filter((location) => location.id !== receiving?.id);
  const locationOrder = receiving ? [receiving, ...remaining] : locations;

  await prisma.$transaction([
    ...products.map((product) =>
      prisma.product.update({
        where: { id: product.id },
        data: { name: productNames.get(product.sku) ?? product.name.split(/\s+/)[0] },
      }),
    ),
    ...locationOrder.map((location, index) =>
      prisma.location.update({
        where: { id: location.id },
        data: { ...simpleLocations[index], active: true },
      }),
    ),
  ]);

  console.log(JSON.stringify({ backupPath, products: products.length, locations: locations.length, historyPreserved: true }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());

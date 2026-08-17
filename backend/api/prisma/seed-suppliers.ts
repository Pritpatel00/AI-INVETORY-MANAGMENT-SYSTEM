import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await Promise.all([
    prisma.product.updateMany({
      where: { sku: "ITEM-402" },
      data: {
        supplierName: "Supplier X",
        supplierEmail: "supplier-x@nirka.local",
      },
    }),
    prisma.product.updateMany({
      where: { sku: "ITEM-118" },
      data: {
        supplierName: "Warehouse Supplies Ltd.",
        supplierEmail: "orders@warehouse-supplies.nirka.local",
      },
    }),
  ]);
}

main().finally(async () => {
  await prisma.$disconnect();
});

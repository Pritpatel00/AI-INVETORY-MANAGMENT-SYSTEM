import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [tx, users, products, locations, balances, reorders, tasks, voice, suppliers] = await Promise.all([
    prisma.inventoryTransaction.count(),
    prisma.user.count(),
    prisma.product.count(),
    prisma.location.count(),
    prisma.inventoryBalance.count(),
    prisma.reorderDraft.count(),
    prisma.inventoryTask.count(),
    prisma.voiceEvidence.count(),
    prisma.supplier.count(),
  ]);
  console.log(JSON.stringify({ tx, users, products, locations, balances, reorders, tasks, voice, suppliers }, null, 2));
  const productsList = await prisma.product.findMany({ select: { sku: true, name: true } });
  console.log("Products:", JSON.stringify(productsList));
}

main()
  .catch((error) => {
    console.error("DB ERROR:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

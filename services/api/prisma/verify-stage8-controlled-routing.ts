/**
 * End-to-end integration verification for §8.4 controlled-item routing.
 *
 * Flow exercised:
 *   1. Create a product flagged `controlled = true`.
 *   2. Stage a SHIP transaction through InventoryService.createTransaction().
 *   3. Confirm it through InventoryService.confirmTransaction().
 *   4. Assert the outcome is PENDING_REVIEW and `reviewReasons` references the
 *      controlled flag — proving requiresManagerReviewExtended fires in the
 *      real confirmation flow, not just in the isolated rule unit tests.
 *
 * Run:  npx tsx prisma/verify-stage8-controlled-routing.ts  (from services/api)
 */
import { InventoryAction } from "@prisma/client";
import { PrismaService } from "../src/prisma/prisma.service";
import { InventoryRulesEngine } from "../src/inventory/rules/inventory-rules.engine";
import { InventoryService } from "../src/inventory/inventory.service";
import { TasksService } from "../src/tasks/tasks.service";
import type { AuthenticatedUser } from "../src/auth/auth-user";

const prisma = new PrismaService();
const rules = new InventoryRulesEngine();
const tasks = new TasksService(prisma);
const inventory = new InventoryService(prisma, rules, tasks);

const suffix = Date.now().toString(36).toUpperCase();
const sku = `CTRL-${suffix}`.slice(0, 50);
const locationCode = `STAGE8-${suffix}`.slice(0, 50);
const actor: AuthenticatedUser = {
  subject: `test-subject-${suffix}`,
  username: `WORKER-${suffix}`,
  email: `worker-${suffix}@stage8.local`.toLowerCase(),
  roles: ["worker"],
};

let stagedId: string | null = null;

async function main() {
  const product = await prisma.product.create({
    data: {
      sku,
      name: `Stage 8 controlled item ${suffix}`,
      unit: "unit",
      safetyStock: 0,
      reorderQuantity: 0,
      controlled: true,
    },
  });
  console.log("created product:", {
    id: product.id,
    sku: product.sku,
    controlled: product.controlled,
  });

  const location = await prisma.location.create({
    data: { code: locationCode, name: `Stage 8 location ${suffix}` },
  });
  console.log("created location:", { id: location.id, code: location.code });

  const staged = await inventory.createTransaction(
    {
      action: InventoryAction.SHIP,
      productId: product.id,
      quantity: 2,
      sourceLocationId: location.id,
    },
    actor,
  );
  stagedId = staged.id;
  console.log("staged SHIP transaction:", {
    id: staged.id,
    action: staged.action,
    status: staged.status,
  });

  const result = await inventory.confirmTransaction(staged.id, actor);
  console.log("confirm outcome:", result.outcome);

  if (result.outcome !== "PENDING_REVIEW") {
    throw new Error(`Expected PENDING_REVIEW but got ${result.outcome}`);
  }

  const reasons = result.transaction.reviewReasons ?? "";
  console.log("stored reviewReasons:", JSON.stringify(reasons, null, 2));

  if (!/controlled/i.test(reasons)) {
    throw new Error(
      `reviewReasons does not reference the controlled flag: ${JSON.stringify(reasons)}`,
    );
  }

  console.log(
    "PASS: §8.4 controlled SHIP routed to PENDING_REVIEW with populated reviewReasons.",
  );
}

main()
  .catch((error) => {
    console.error("FAIL:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      if (stagedId) {
        await prisma.inventoryTransaction.delete({ where: { id: stagedId } });
      }
      await prisma.product.deleteMany({ where: { sku } });
      await prisma.location.deleteMany({ where: { code: locationCode } });
      const user = await prisma.user.findUnique({ where: { email: actor.email } });
      if (user) await prisma.user.delete({ where: { id: user.id } });
      console.log("cleanup complete");
    } finally {
      await prisma.$disconnect();
    }
  });

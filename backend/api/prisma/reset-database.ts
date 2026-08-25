import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fresh-start reset: deletes every row in every table so the application can
// be re-seeded from scratch. Deletion order respects foreign keys (child rows
// first). After this script runs, `npm run db:seed` recreates the demo users
// and `npm run db:seed:catalog` recreates the clean product catalogue,
// locations and opening balances — with zero transactions.
async function main() {
  // Voice evidence audio files stored on disk (EVIDENCE_STORAGE_PATH) are
  // removed so no orphaned recordings survive the fresh start. The path is
  // relative to the API working directory, matching the .env value.
  const evidenceRoot = resolve(process.cwd(), "../../.local/evidence");
  rmSync(evidenceRoot, { recursive: true, force: true });
  console.log(`Cleared voice evidence storage: ${evidenceRoot}`);

  const deleted = {
    voiceEvidence: await prisma.voiceEvidence.deleteMany(),
    discrepancyEvidence: await prisma.discrepancyEvidence.deleteMany(),
    discrepancyAuditEvents: await prisma.discrepancyAuditEvent.deleteMany(),
    discrepancies: await prisma.discrepancy.deleteMany(),
    notifications: await prisma.notification.deleteMany(),
    tasks: await prisma.inventoryTask.deleteMany(),
    reorderDrafts: await prisma.reorderDraft.deleteMany(),
    transactions: await prisma.inventoryTransaction.deleteMany(),
    balances: await prisma.inventoryBalance.deleteMany(),
    accessAudit: await prisma.userAccessAudit.deleteMany(),
    products: await prisma.product.deleteMany(),
    locations: await prisma.location.deleteMany(),
    users: await prisma.user.deleteMany(),
  };

  console.log("Database wiped. Deleted rows:");
  console.table(
    Object.fromEntries(
      Object.entries(deleted).map(([table, result]) => [table, result.count]),
    ),
  );
}

main()
  .catch((error) => {
    console.error("Reset failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

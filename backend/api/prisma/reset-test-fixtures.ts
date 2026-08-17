import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Clears ONLY rows created by local test fixtures, leaving real transaction
// history untouched.
//
// Removes:
//   - transactions from `npm run db:seed:samples` (clientRequestId prefix
//     "warehouse-sample-v1-")
//   - transactions from the Playwright approval spec (clientRequestId prefix
//     "e2e-")
//   - voice evidence and recount tasks linked to those transactions
//
// Deliberately left alone:
//   - the Playwright voice-capture spec posts a real RECEIVE through the
//     genuine worker pipeline with a "voice-<uuid>" clientRequestId, which is
//     indistinguishable from a real worker entry. For a fully clean local
//     ledger use `npm run db:reset:demo` instead.
//   - reorder drafts created as a side effect of posted test movements (they
//     have no transaction link).
//   - balance changes applied by posted sample movements are NOT reversed by
//     deleting those transactions; re-seed the demo catalogue or reset the
//     database to restore opening quantities.
async function main() {
  const fixturePrefixes = ["warehouse-sample-v1-", "e2e-"];

  const fixtureIds = (
    await prisma.inventoryTransaction.findMany({
      where: {
        OR: fixturePrefixes.map((prefix) => ({
          clientRequestId: { startsWith: prefix },
        })),
      },
      select: { id: true },
    })
  ).map((transaction) => transaction.id);

  const deleted = {
    voiceEvidence: await prisma.voiceEvidence.deleteMany({
      where: { transactionId: { in: fixtureIds } },
    }),
    discrepancies: await prisma.discrepancy.deleteMany({
      where: { transactionId: { in: fixtureIds } },
    }),
    tasks: await prisma.inventoryTask.deleteMany({
      where: { sourceTransactionId: { in: fixtureIds } },
    }),
    transactions: fixtureIds.length,
  };
  if (fixtureIds.length > 0) {
    await prisma.inventoryTransaction.deleteMany({
      where: { id: { in: fixtureIds } },
    });
  }

  console.log(
    `Test fixtures cleared: ${deleted.transactions} transaction(s), ` +
      `${deleted.voiceEvidence.count} voice evidence record(s), ` +
      `${deleted.discrepancies.count} discrepancy case(s), ` +
      `${deleted.tasks.count} linked task(s).`,
  );
}

main()
  .catch((error) => {
    console.error("Fixture reset failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

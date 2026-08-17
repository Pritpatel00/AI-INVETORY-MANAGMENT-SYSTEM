-- AlterEnum
ALTER TYPE "TransactionStatus" ADD VALUE 'RECOUNT_REQUESTED';

-- AlterTable
ALTER TABLE "inventory_transactions" ADD COLUMN "reviewNotes" TEXT;

-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('NOT_QUEUED', 'QUEUED', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "products"
ADD COLUMN "supplierName" TEXT,
ADD COLUMN "supplierEmail" TEXT;

-- AlterTable
ALTER TABLE "reorder_drafts"
ADD COLUMN "activeKey" TEXT,
ADD COLUMN "emailStatus" "EmailDeliveryStatus" NOT NULL DEFAULT 'NOT_QUEUED',
ADD COLUMN "reviewNotes" TEXT,
ADD COLUMN "approvedById" TEXT,
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "emailQueuedAt" TIMESTAMP(3),
ADD COLUMN "emailSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "reorder_drafts_activeKey_key" ON "reorder_drafts"("activeKey");

-- AddForeignKey
ALTER TABLE "reorder_drafts"
ADD CONSTRAINT "reorder_drafts_approvedById_fkey"
FOREIGN KEY ("approvedById") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

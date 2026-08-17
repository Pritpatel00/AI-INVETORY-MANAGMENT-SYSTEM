-- Discrepancy review (Step 2): in-app notifications, recount-result linking.
-- Non-destructive: adds a new enum, a new table, and a nullable column + FK.

CREATE TYPE "NotificationType" AS ENUM ('NEW_DISCREPANCY','MAJOR_CRITICAL_DISCREPANCY','RECOUNT_ASSIGNED','RECOUNT_COMPLETED','DISCREPANCY_APPROVED','DISCREPANCY_REJECTED','RESOLVED_AS_TRANSFER');

CREATE TABLE "notifications" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "linkType" TEXT,
  "linkId" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_userId_readAt_createdAt_idx" ON "notifications"("userId","readAt","createdAt");
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId","createdAt");

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inventory_transactions" ADD COLUMN "recountTaskId" TEXT;
CREATE INDEX "inventory_transactions_recountTaskId_idx" ON "inventory_transactions"("recountTaskId");
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_recountTaskId_fkey" FOREIGN KEY ("recountTaskId") REFERENCES "inventory_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Discrepancy tracking foundation for Cycle Count differences.
-- Adds severity/status/reason enums and the discrepancies table.
-- Non-destructive: only creates new types and a new table.

CREATE TYPE "DiscrepancySeverity" AS ENUM ('NONE','MINOR','MEDIUM','MAJOR','CRITICAL');
CREATE TYPE "DiscrepancyStatus" AS ENUM ('OPEN','AWAITING_REVIEW','RECOUNT_REQUESTED','APPROVED','REJECTED','RESOLVED_AS_TRANSFER','CLOSED');
CREATE TYPE "DiscrepancyReason" AS ENUM ('COUNT_DIFFERENCE','UNRECORDED_RECEIPT','UNRECORDED_SHIPMENT','WRONG_LOCATION','DAMAGE','LOSS','COUNTING_ERROR','SYSTEM_ERROR','OTHER');

CREATE TABLE "discrepancies" (
  "id" TEXT NOT NULL,
  "caseNumber" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "expectedQuantity" INTEGER NOT NULL,
  "countedQuantity" INTEGER NOT NULL,
  "differenceQuantity" INTEGER NOT NULL,
  "differencePercentage" DOUBLE PRECISION NOT NULL,
  "severity" "DiscrepancySeverity" NOT NULL,
  "status" "DiscrepancyStatus" NOT NULL DEFAULT 'AWAITING_REVIEW',
  "reasonCode" "DiscrepancyReason" NOT NULL DEFAULT 'COUNT_DIFFERENCE',
  "workerNotes" TEXT,
  "managerNotes" TEXT,
  "workerId" TEXT,
  "assignedManagerId" TEXT,
  "recountTaskId" TEXT,
  "resolutionTransactionId" TEXT,
  "resolvedById" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "discrepancies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "discrepancies_caseNumber_key" ON "discrepancies"("caseNumber");
CREATE UNIQUE INDEX "discrepancies_transactionId_key" ON "discrepancies"("transactionId");
CREATE UNIQUE INDEX "discrepancies_recountTaskId_key" ON "discrepancies"("recountTaskId");
CREATE UNIQUE INDEX "discrepancies_resolutionTransactionId_key" ON "discrepancies"("resolutionTransactionId");

CREATE INDEX "discrepancies_productId_createdAt_idx" ON "discrepancies"("productId","createdAt");
CREATE INDEX "discrepancies_locationId_createdAt_idx" ON "discrepancies"("locationId","createdAt");
CREATE INDEX "discrepancies_workerId_status_idx" ON "discrepancies"("workerId","status");
CREATE INDEX "discrepancies_severity_status_idx" ON "discrepancies"("severity","status");
CREATE INDEX "discrepancies_status_createdAt_idx" ON "discrepancies"("status","createdAt");

ALTER TABLE "discrepancies" ADD CONSTRAINT "discrepancies_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "inventory_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "discrepancies" ADD CONSTRAINT "discrepancies_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "discrepancies" ADD CONSTRAINT "discrepancies_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "discrepancies" ADD CONSTRAINT "discrepancies_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "discrepancies" ADD CONSTRAINT "discrepancies_assignedManagerId_fkey" FOREIGN KEY ("assignedManagerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "discrepancies" ADD CONSTRAINT "discrepancies_recountTaskId_fkey" FOREIGN KEY ("recountTaskId") REFERENCES "inventory_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "discrepancies" ADD CONSTRAINT "discrepancies_resolutionTransactionId_fkey" FOREIGN KEY ("resolutionTransactionId") REFERENCES "inventory_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "discrepancies" ADD CONSTRAINT "discrepancies_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

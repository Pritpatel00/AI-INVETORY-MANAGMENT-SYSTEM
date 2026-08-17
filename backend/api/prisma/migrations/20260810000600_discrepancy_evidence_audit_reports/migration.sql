-- Discrepancy management (Step 3): photo evidence and append-only audit history.
-- Non-destructive: adds one enum and two new tables with indexes and FKs.

CREATE TYPE "DiscrepancyAuditAction" AS ENUM ('CASE_CREATED','WORKER_CONFIRMED','REVIEW_OPENED','RECOUNT_REQUESTED','RECOUNT_COMPLETED','APPROVED','REJECTED','RESOLVED_AS_TRANSFER','PHOTO_UPLOADED','CASE_CLOSED');

CREATE TABLE "discrepancy_evidence" (
  "id" TEXT NOT NULL,
  "discrepancyId" TEXT,
  "transactionId" TEXT,
  "storageKey" TEXT NOT NULL,
  "originalFilename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "discrepancy_evidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "discrepancy_evidence_discrepancyId_createdAt_idx" ON "discrepancy_evidence"("discrepancyId","createdAt");
CREATE INDEX "discrepancy_evidence_transactionId_createdAt_idx" ON "discrepancy_evidence"("transactionId","createdAt");
CREATE INDEX "discrepancy_evidence_uploadedById_createdAt_idx" ON "discrepancy_evidence"("uploadedById","createdAt");

ALTER TABLE "discrepancy_evidence" ADD CONSTRAINT "discrepancy_evidence_storageKey_key" UNIQUE ("storageKey");
ALTER TABLE "discrepancy_evidence" ADD CONSTRAINT "discrepancy_evidence_discrepancyId_fkey" FOREIGN KEY ("discrepancyId") REFERENCES "discrepancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "discrepancy_evidence" ADD CONSTRAINT "discrepancy_evidence_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "inventory_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "discrepancy_evidence" ADD CONSTRAINT "discrepancy_evidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "discrepancy_audit_events" (
  "id" TEXT NOT NULL,
  "discrepancyId" TEXT NOT NULL,
  "caseNumber" TEXT NOT NULL,
  "action" "DiscrepancyAuditAction" NOT NULL,
  "previousStatus" TEXT,
  "newStatus" TEXT,
  "expectedQuantity" INTEGER,
  "countedQuantity" INTEGER,
  "differenceQuantity" INTEGER,
  "previousStock" INTEGER,
  "newStock" INTEGER,
  "actorWorkerId" TEXT,
  "actorManagerId" TEXT,
  "reason" TEXT,
  "transactionId" TEXT,
  "evidenceId" TEXT,
  "rawTranscript" TEXT,
  "aiValues" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "discrepancy_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "discrepancy_audit_events_discrepancyId_createdAt_idx" ON "discrepancy_audit_events"("discrepancyId","createdAt");
CREATE INDEX "discrepancy_audit_events_action_createdAt_idx" ON "discrepancy_audit_events"("action","createdAt");
CREATE INDEX "discrepancy_audit_events_actorWorkerId_createdAt_idx" ON "discrepancy_audit_events"("actorWorkerId","createdAt");
CREATE INDEX "discrepancy_audit_events_actorManagerId_createdAt_idx" ON "discrepancy_audit_events"("actorManagerId","createdAt");

ALTER TABLE "discrepancy_audit_events" ADD CONSTRAINT "discrepancy_audit_events_discrepancyId_fkey" FOREIGN KEY ("discrepancyId") REFERENCES "discrepancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "discrepancy_audit_events" ADD CONSTRAINT "discrepancy_audit_events_actorWorkerId_fkey" FOREIGN KEY ("actorWorkerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "discrepancy_audit_events" ADD CONSTRAINT "discrepancy_audit_events_actorManagerId_fkey" FOREIGN KEY ("actorManagerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "discrepancy_audit_events" ADD CONSTRAINT "discrepancy_audit_events_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "inventory_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "discrepancy_audit_events" ADD CONSTRAINT "discrepancy_audit_events_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "discrepancy_evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "discrepancies" ADD COLUMN "severityRule" TEXT;

-- AlterTable
ALTER TABLE "discrepancy_audit_events" ADD COLUMN "severityRule" TEXT;

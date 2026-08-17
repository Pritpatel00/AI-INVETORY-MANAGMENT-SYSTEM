ALTER TABLE "inventory_transactions"
ADD COLUMN "system_quantity_before" INTEGER,
ADD COLUMN "discrepancy_difference" INTEGER,
ADD COLUMN "discrepancy_percentage" DOUBLE PRECISION,
ADD COLUMN "significant_discrepancy" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "inventory_transactions_significant_discrepancy_createdAt_idx"
ON "inventory_transactions"("significant_discrepancy", "createdAt");

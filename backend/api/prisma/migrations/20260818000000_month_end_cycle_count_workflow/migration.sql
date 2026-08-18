-- Month-End Cycle Count workflow
-- Idempotent plan creation, period stored on tasks, database-level duplicate
-- prevention and links between count transactions and their assigned tasks.

-- Optional manager instructions copied onto every generated task.
ALTER TABLE "cycle_count_plans" ADD COLUMN "instructions" TEXT;

-- Deterministic request fingerprint so repeating the exact same plan request
-- returns the existing plan instead of creating a duplicate.
ALTER TABLE "cycle_count_plans" ADD COLUMN "request_key" TEXT;
CREATE UNIQUE INDEX "cycle_count_plans_request_key_key" ON "cycle_count_plans"("request_key");

-- The count period (YYYY-MM) travels with every task so the plan period is
-- visible in the worker queue and enforced by a database constraint.
ALTER TABLE "inventory_tasks" ADD COLUMN "period_month" VARCHAR(7);

-- One cycle-count task per period, product and location. This partial unique
-- index is the database-level duplicate prevention: repeated clicks or
-- concurrent API requests can never create a second count of the same item at
-- the same location within the same monthly period.
CREATE UNIQUE INDEX "inventory_tasks_period_product_location_unique"
ON "inventory_tasks"("period_month", "productId", "locationId")
WHERE "type" = 'CYCLE_COUNT' AND "period_month" IS NOT NULL AND "productId" IS NOT NULL AND "locationId" IS NOT NULL;

-- Link count transactions to the assigned Month-End Cycle Count task so plan
-- reports can show which tasks produced discrepancies and the task lifecycle
-- completes atomically with the count confirmation. This is a separate link
-- from sourceTransactionId (which recounts reuse for the original case).
ALTER TABLE "inventory_transactions" ADD COLUMN "task_id" TEXT;
CREATE INDEX "inventory_transactions_task_id_idx" ON "inventory_transactions"("task_id");
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_task_id_fkey"
FOREIGN KEY ("task_id") REFERENCES "inventory_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Notification type used to notify the assigned Warehouse Executive.
ALTER TYPE "NotificationType" ADD VALUE 'CYCLE_COUNT_PLAN_ASSIGNED';

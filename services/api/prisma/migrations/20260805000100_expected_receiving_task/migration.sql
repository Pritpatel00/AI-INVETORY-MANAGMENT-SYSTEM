-- Expected receiving tasks linked to approved purchase orders.
-- Approving a reorder draft automatically creates a RECEIVE task for the
-- worker task queue. The unique source_reorder_draft_id key guarantees that
-- every approved purchase order produces exactly one receiving task.

-- AlterTable
ALTER TABLE "inventory_tasks"
ADD COLUMN "source_reorder_draft_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "inventory_tasks_source_reorder_draft_id_key"
ON "inventory_tasks"("source_reorder_draft_id");

-- AddForeignKey
ALTER TABLE "inventory_tasks"
ADD CONSTRAINT "inventory_tasks_source_reorder_draft_id_fkey"
FOREIGN KEY ("source_reorder_draft_id") REFERENCES "reorder_drafts"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

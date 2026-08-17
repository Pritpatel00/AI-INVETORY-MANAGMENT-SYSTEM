-- Remove supplier-email delivery fields from reorder drafts
-- The low-stock purchasing workflow no longer sends or tracks supplier emails.
-- The approvedById FK, email columns, EmailDeliveryStatus enum type and
-- sourceReorderDraftId FK on inventory_tasks are all dropped.
-- Existing 'SENT' reorder drafts are reset to 'APPROVED' because SENT was
-- only set when the supplier email was delivered, a process that no longer
-- exists. Page content is calculated live from current balances.
-- The activeKey unique constraint is preserved because it prevents duplicate
-- Purchase Items for the same product and location.

-- Drop FK constraint on inventory_tasks for sourceReorderDraftId first
ALTER TABLE "inventory_tasks" DROP CONSTRAINT IF EXISTS "inventory_tasks_source_reorder_draft_id_fkey";

-- Drop the unique index on sourceReorderDraftId in inventory_tasks
DROP INDEX IF EXISTS "inventory_tasks_source_reorder_draft_id_key";

-- Drop the sourceReorderDraftId column from inventory_tasks
ALTER TABLE "inventory_tasks" DROP COLUMN IF EXISTS "source_reorder_draft_id";

-- Drop FK constraint on reorder_drafts for approvedById
ALTER TABLE "reorder_drafts" DROP CONSTRAINT IF EXISTS "reorder_drafts_approvedById_fkey";

-- Reset SENT reorder drafts to APPROVED (SENT only meant email was delivered)
UPDATE "reorder_drafts" SET "status" = 'APPROVED' WHERE "status" = 'SENT';

-- Drop email-related columns from reorder_drafts
ALTER TABLE "reorder_drafts" DROP COLUMN IF EXISTS "emailStatus";
ALTER TABLE "reorder_drafts" DROP COLUMN IF EXISTS "emailQueuedAt";
ALTER TABLE "reorder_drafts" DROP COLUMN IF EXISTS "emailSentAt";
ALTER TABLE "reorder_drafts" DROP COLUMN IF EXISTS "emailAttempts";
ALTER TABLE "reorder_drafts" DROP COLUMN IF EXISTS "emailError";
ALTER TABLE "reorder_drafts" DROP COLUMN IF EXISTS "approvedById";
ALTER TABLE "reorder_drafts" DROP COLUMN IF EXISTS "approvedAt";

-- Drop the EmailDeliveryStatus enum type
DROP TYPE IF EXISTS "EmailDeliveryStatus";

-- Create a new ReorderStatus enum without SENT and migrate data
ALTER TYPE "ReorderStatus" RENAME TO "ReorderStatus_old";
CREATE TYPE "ReorderStatus" AS ENUM ('DRAFT', 'APPROVED', 'CANCELLED');
-- The column default ('DRAFT'::"ReorderStatus") cannot be cast automatically
-- when the type changes, so drop it first and restore it after.
ALTER TABLE "reorder_drafts" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "reorder_drafts" ALTER COLUMN "status" TYPE "ReorderStatus" USING "status"::text::"ReorderStatus";
ALTER TABLE "reorder_drafts" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"ReorderStatus";
DROP TYPE IF EXISTS "ReorderStatus_old";
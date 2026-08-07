-- AlterTable
ALTER TABLE "reorder_drafts"
ADD COLUMN "emailAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "emailError" TEXT;

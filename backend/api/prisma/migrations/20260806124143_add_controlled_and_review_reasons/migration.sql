-- AlterTable
ALTER TABLE "products" ADD COLUMN     "controlled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "inventory_transactions" ADD COLUMN     "reviewReasons" TEXT;

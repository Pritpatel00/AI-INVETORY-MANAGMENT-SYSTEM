-- Reservation shipment tasks
-- Managers prepare shipments against a stock reservation. A prepared shipment
-- becomes a SHIP inventory task assigned to the Warehouse Executive with the
-- fewest open tasks. Completing the task posts the Ship transaction and moves
-- the reservation to COMPLETED or PARTIALLY_SHIPPED atomically.

-- New notification types for the shipment workflow
ALTER TYPE "NotificationType" ADD VALUE 'SHIPMENT_TASK_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'SHIPMENT_PREPARED';
ALTER TYPE "NotificationType" ADD VALUE 'SHIPMENT_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE 'SHIPMENT_CANCELLED';

-- New SHIP task type
ALTER TYPE "TaskType" ADD VALUE 'SHIP';

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_userId_fkey";

-- AlterTable
ALTER TABLE "inventory_tasks" ADD COLUMN     "prepared_by_id" TEXT,
ADD COLUMN     "reservation_id" TEXT,
ADD COLUMN     "shipment_reference" TEXT;

-- CreateIndex
CREATE INDEX "inventory_tasks_reservation_id_status_idx" ON "inventory_tasks"("reservation_id", "status");

-- AddForeignKey
ALTER TABLE "inventory_tasks" ADD CONSTRAINT "inventory_tasks_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "stock_reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_tasks" ADD CONSTRAINT "inventory_tasks_prepared_by_id_fkey" FOREIGN KEY ("prepared_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

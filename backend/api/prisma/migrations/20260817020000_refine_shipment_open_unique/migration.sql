-- Refine the one-open-SHIP-task-per-slot uniqueness. The reservation +
-- quantity key alone is too coarse: two different items (or the same item at
-- two locations) on one reservation can legitimately have the same quantity.
-- Uniqueness is now per reservation + product + source location + quantity,
-- so only a genuinely duplicate prepare for the same item, location and
-- quantity is prevented.

DROP INDEX IF EXISTS "inventory_tasks_shipment_open_unique";

CREATE UNIQUE INDEX "inventory_tasks_shipment_open_unique"
    ON "inventory_tasks"("reservation_id", "productId", "sourceLocationId", "quantity")
    WHERE "type" = 'SHIP' AND "status" IN ('OPEN', 'IN_PROGRESS');

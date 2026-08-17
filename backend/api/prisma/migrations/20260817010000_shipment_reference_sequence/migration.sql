-- Shipment reference counter and concurrency-safe uniqueness for reservation
-- shipment tasks.
--
-- The single-row counter is bumped with an atomic UPDATE ... RETURNING inside
-- the same transaction that creates the shipment task, so:
--   * two managers preparing concurrently can never receive the same number;
--   * a failed prepare rolls back and does not consume a number;
--   * references are never reused (the counter only moves forward).
-- The counter is initialised from the highest existing numeric SHIP reference,
-- so SHIP-999 continues to SHIP-1000 naturally and no existing reference is
-- ever re-issued.

CREATE TABLE "shipment_reference_counters" (
    "id" INTEGER NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "shipment_reference_counters_pkey" PRIMARY KEY ("id")
);

INSERT INTO "shipment_reference_counters" ("id", "last_value")
SELECT 1, COALESCE(MAX(CAST(SUBSTRING("shipment_reference" FROM 6) AS INTEGER)), 0)
FROM "inventory_tasks"
WHERE "shipment_reference" ~ '^SHIP-[0-9]+$';

-- Never issue the same numeric SHIP reference twice (defence in depth: the
-- counter is the allocator, this index is the guarantee). Legacy manual
-- references that are not SHIP-<number> are left untouched.
CREATE UNIQUE INDEX "inventory_tasks_shipment_reference_unique"
    ON "inventory_tasks"("shipment_reference")
    WHERE "shipment_reference" IS NOT NULL AND "shipment_reference" ~ '^SHIP-[0-9]+$';

-- Only one actionable (OPEN / IN_PROGRESS) SHIP task may exist per reservation
-- and quantity. Duplicate or double-clicked prepares therefore conflict here
-- instead of creating a second task, and the idempotency path returns the
-- existing task. Completed or cancelled tasks release the slot so a later
-- shipment for the remaining quantity can still be prepared.
CREATE UNIQUE INDEX "inventory_tasks_shipment_open_unique"
    ON "inventory_tasks"("reservation_id", "quantity")
    WHERE "type" = 'SHIP' AND "status" IN ('OPEN', 'IN_PROGRESS');

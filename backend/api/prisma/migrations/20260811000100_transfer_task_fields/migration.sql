ALTER TABLE "inventory_tasks"
ADD COLUMN "quantity" INTEGER,
ADD COLUMN "sourceLocationId" TEXT,
ADD COLUMN "destinationLocationId" TEXT;

CREATE INDEX "inventory_tasks_sourceLocationId_idx"
ON "inventory_tasks"("sourceLocationId");

CREATE INDEX "inventory_tasks_destinationLocationId_idx"
ON "inventory_tasks"("destinationLocationId");

ALTER TABLE "inventory_tasks"
ADD CONSTRAINT "inventory_tasks_sourceLocationId_fkey"
FOREIGN KEY ("sourceLocationId") REFERENCES "locations"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "inventory_tasks"
ADD CONSTRAINT "inventory_tasks_destinationLocationId_fkey"
FOREIGN KEY ("destinationLocationId") REFERENCES "locations"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

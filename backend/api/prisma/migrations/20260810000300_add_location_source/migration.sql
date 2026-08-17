-- Add LocationSource enum and location source tracking columns on inventory_transactions
-- The LocationSource enum records whether a location was spoken by the worker,
-- automatically defaulted to the Receiving area, matched from the worker's
-- assigned warehouse zone, or provided via AI clarification.

CREATE TYPE "LocationSource" AS ENUM ('SPOKEN', 'RECEIVING_DEFAULT', 'WORKER_ZONE', 'CLARIFIED');

ALTER TABLE "inventory_transactions" ADD COLUMN IF NOT EXISTS "source_location_source" "LocationSource";
ALTER TABLE "inventory_transactions" ADD COLUMN IF NOT EXISTS "destination_location_source" "LocationSource";

CREATE TYPE "StockRequestStatus" AS ENUM ('CONFIRMED', 'PARTIALLY_RESERVED', 'FULLY_RESERVED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "StockReservationStatus" AS ENUM ('ACTIVE', 'PARTIALLY_SHIPPED', 'COMPLETED', 'RELEASED', 'CANCELLED');

CREATE TABLE "stock_requests" (
  "id" TEXT NOT NULL, "request_number" TEXT NOT NULL, "request_type" TEXT NOT NULL,
  "reference_number" TEXT NOT NULL, "requested_for" TEXT NOT NULL, "required_date" TIMESTAMP(3) NOT NULL,
  "notes" TEXT, "status" "StockRequestStatus" NOT NULL DEFAULT 'CONFIRMED', "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "stock_requests_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "stock_request_lines" (
  "id" TEXT NOT NULL, "stock_request_id" TEXT NOT NULL, "product_id" TEXT NOT NULL,
  "required_quantity" INTEGER NOT NULL, "reserved_quantity" INTEGER NOT NULL DEFAULT 0,
  "shipped_quantity" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "stock_request_lines_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "stock_reservations" (
  "id" TEXT NOT NULL, "reservation_number" TEXT NOT NULL, "stock_request_id" TEXT NOT NULL,
  "status" "StockReservationStatus" NOT NULL DEFAULT 'ACTIVE', "created_by_id" TEXT NOT NULL,
  "release_reason" TEXT, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "stock_reservation_allocations" (
  "id" TEXT NOT NULL, "reservation_id" TEXT NOT NULL, "request_line_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL, "location_id" TEXT NOT NULL, "quantity" INTEGER NOT NULL,
  "shipped_quantity" INTEGER NOT NULL DEFAULT 0, "released_quantity" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "stock_reservation_allocations_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "reservation_audit_events" (
  "id" TEXT NOT NULL, "stock_request_id" TEXT NOT NULL, "reservation_id" TEXT,
  "action" TEXT NOT NULL, "details" TEXT, "actor_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reservation_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stock_requests_request_number_key" ON "stock_requests"("request_number");
CREATE UNIQUE INDEX "stock_requests_reference_number_key" ON "stock_requests"("reference_number");
CREATE INDEX "stock_requests_status_required_date_idx" ON "stock_requests"("status", "required_date");
CREATE INDEX "stock_request_lines_product_id_idx" ON "stock_request_lines"("product_id");
CREATE UNIQUE INDEX "stock_request_lines_stock_request_id_product_id_key" ON "stock_request_lines"("stock_request_id", "product_id");
CREATE UNIQUE INDEX "stock_reservations_reservation_number_key" ON "stock_reservations"("reservation_number");
CREATE INDEX "stock_reservations_status_created_at_idx" ON "stock_reservations"("status", "created_at");
CREATE INDEX "stock_reservations_stock_request_id_idx" ON "stock_reservations"("stock_request_id");
CREATE INDEX "stock_reservation_allocations_reservation_id_idx" ON "stock_reservation_allocations"("reservation_id");
CREATE INDEX "stock_reservation_allocations_product_id_location_id_idx" ON "stock_reservation_allocations"("product_id", "location_id");
CREATE INDEX "reservation_audit_events_stock_request_id_created_at_idx" ON "reservation_audit_events"("stock_request_id", "created_at");
CREATE INDEX "reservation_audit_events_reservation_id_created_at_idx" ON "reservation_audit_events"("reservation_id", "created_at");

ALTER TABLE "stock_requests" ADD CONSTRAINT "stock_requests_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_request_lines" ADD CONSTRAINT "stock_request_lines_stock_request_id_fkey" FOREIGN KEY ("stock_request_id") REFERENCES "stock_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_request_lines" ADD CONSTRAINT "stock_request_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_stock_request_id_fkey" FOREIGN KEY ("stock_request_id") REFERENCES "stock_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_reservation_allocations" ADD CONSTRAINT "stock_reservation_allocations_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "stock_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_reservation_allocations" ADD CONSTRAINT "stock_reservation_allocations_request_line_id_fkey" FOREIGN KEY ("request_line_id") REFERENCES "stock_request_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_reservation_allocations" ADD CONSTRAINT "stock_reservation_allocations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_reservation_allocations" ADD CONSTRAINT "stock_reservation_allocations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reservation_audit_events" ADD CONSTRAINT "reservation_audit_events_stock_request_id_fkey" FOREIGN KEY ("stock_request_id") REFERENCES "stock_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reservation_audit_events" ADD CONSTRAINT "reservation_audit_events_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "stock_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reservation_audit_events" ADD CONSTRAINT "reservation_audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

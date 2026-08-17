-- Concurrency-safe internal request references (REQ-001, REQ-002, ...).
-- The counter is updated inside the same transaction that creates a stock
-- request, so concurrent managers cannot receive duplicate numbers and failed
-- requests do not consume a number.

CREATE TABLE "request_reference_counters" (
    "id" INTEGER NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "request_reference_counters_pkey" PRIMARY KEY ("id")
);

-- Continue after the highest valid REQ number found in either the internal
-- request number or the legacy external-reference column.
INSERT INTO "request_reference_counters" ("id", "last_value")
SELECT 1, GREATEST(
    COALESCE((
        SELECT MAX(CAST(SUBSTRING("request_number" FROM 5) AS INTEGER))
        FROM "stock_requests"
        WHERE "request_number" ~ '^REQ-[0-9]+$'
    ), 0),
    COALESCE((
        SELECT MAX(CAST(SUBSTRING("reference_number" FROM 5) AS INTEGER))
        FROM "stock_requests"
        WHERE "reference_number" ~ '^REQ-[0-9]+$'
    ), 0)
);

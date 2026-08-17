ALTER TABLE "cycle_count_plans"
ADD COLUMN "period_month" VARCHAR(7);

UPDATE "cycle_count_plans"
SET "period_month" = TO_CHAR(COALESCE("dueAt", "createdAt"), 'YYYY-MM')
WHERE "period_month" IS NULL;

ALTER TABLE "cycle_count_plans"
ALTER COLUMN "period_month" SET NOT NULL;

CREATE INDEX "cycle_count_plans_period_month_created_at_idx"
ON "cycle_count_plans"("period_month", "createdAt");

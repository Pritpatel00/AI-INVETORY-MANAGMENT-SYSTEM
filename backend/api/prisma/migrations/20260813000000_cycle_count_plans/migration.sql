CREATE TABLE "cycle_count_plans" (
    "id" TEXT NOT NULL,
    "planNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueAt" TIMESTAMP(3),
    "blindCount" BOOLEAN NOT NULL DEFAULT true,
    "assignedToId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cycle_count_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cycle_count_plans_planNumber_key" ON "cycle_count_plans"("planNumber");
CREATE INDEX "cycle_count_plans_assignedToId_createdAt_idx" ON "cycle_count_plans"("assignedToId", "createdAt");
ALTER TABLE "cycle_count_plans" ADD CONSTRAINT "cycle_count_plans_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inventory_tasks" ADD COLUMN "cycleCountPlanId" TEXT;
CREATE INDEX "inventory_tasks_cycleCountPlanId_status_idx" ON "inventory_tasks"("cycleCountPlanId", "status");
ALTER TABLE "inventory_tasks" ADD CONSTRAINT "inventory_tasks_cycleCountPlanId_fkey" FOREIGN KEY ("cycleCountPlanId") REFERENCES "cycle_count_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

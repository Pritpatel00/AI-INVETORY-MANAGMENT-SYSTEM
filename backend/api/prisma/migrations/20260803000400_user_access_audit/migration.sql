ALTER TABLE "users" ADD COLUMN "last_login_at" TIMESTAMP(3);

CREATE TABLE "user_access_audit" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_username" TEXT NOT NULL,
    "actor_email" TEXT,
    "target_user_id" TEXT NOT NULL,
    "target_employee_id" TEXT NOT NULL,
    "target_display_name" TEXT NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_access_audit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_access_audit_created_at_idx" ON "user_access_audit"("created_at");
CREATE INDEX "user_access_audit_target_user_id_idx" ON "user_access_audit"("target_user_id");

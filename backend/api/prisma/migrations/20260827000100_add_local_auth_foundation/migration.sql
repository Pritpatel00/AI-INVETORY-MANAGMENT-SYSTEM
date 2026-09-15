-- Additive local-auth fields. Existing Keycloak-backed users remain valid with
-- NULL password hashes until they are migrated to local authentication.
ALTER TABLE "users"
    ADD COLUMN "password_hash" TEXT,
    ADD COLUMN "password_changed_at" TIMESTAMP(3),
    ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "auth_version" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "legacy_keycloak_subject" TEXT;

CREATE UNIQUE INDEX "users_legacy_keycloak_subject_key"
    ON "users"("legacy_keycloak_subject");
CREATE INDEX "users_active_role_idx" ON "users"("active", "role");

CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "revoked_reason" TEXT,
    "user_agent" TEXT,
    "ip_address" TEXT,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "auth_sessions_user_id_revoked_at_idx"
    ON "auth_sessions"("user_id", "revoked_at");
CREATE INDEX "auth_sessions_expires_at_idx"
    ON "auth_sessions"("expires_at");

CREATE TABLE "auth_refresh_tokens" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "auth_refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_refresh_tokens_token_hash_key"
    ON "auth_refresh_tokens"("token_hash");
CREATE INDEX "auth_refresh_tokens_session_id_used_at_idx"
    ON "auth_refresh_tokens"("session_id", "used_at");
CREATE INDEX "auth_refresh_tokens_expires_at_idx"
    ON "auth_refresh_tokens"("expires_at");

ALTER TABLE "auth_sessions"
    ADD CONSTRAINT "auth_sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "auth_refresh_tokens"
    ADD CONSTRAINT "auth_refresh_tokens_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "auth_sessions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

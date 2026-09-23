# Secure local credential initialization

Schema migrations never create passwords. Seeded users are initially SSO-only;
Keycloak passwords are not automatically local passwords. Re-running seeds is
not a credential repair procedure. Seeds do not overwrite local password fields.

## First administrator (requires deployment and data-change approval)

1. Confirm the intended administrator's PostgreSQL role and active status using
   a read-only inspection. Never copy password hashes or secrets into logs.
2. Select Administrator and Continue with legacy Keycloak sign-in. Authenticate
   as the existing administrator, not the Keycloak realm management account.
3. The authenticated dashboard offers local password setup only if this user has
   no password, no active local administrator credential exists, and no prior
   bootstrap audit event exists. Choose a unique password (12–200 characters).
4. The UI sends `POST /api/auth/initialize-admin-password` with
   `{ "newPassword": "<privately entered password>" }`, verified Keycloak Bearer
   authentication, cookie credentials and the existing CSRF header. Do not put
   a real password in shell history, source, tickets or screenshots.
5. The service rechecks the canonical user, active database role and linked SSO
   subject in a transaction. It stores an Argon2id hash, sets passwordChangedAt,
   clears mustChangePassword (the owner chose their permanent password), increments
   authVersion, revokes local sessions and writes ADMIN_LOCAL_PASSWORD_INITIALIZED.
   A short users-table write lock serializes concurrent bootstrap attempts.
6. Sign out, then sign in locally in Administrator workspace. The SSO password
   and compatibility sign-in remain unchanged. No refresh token is returned by
   initialization; normal login establishes the new local session.

Bootstrap is not a general recovery endpoint. Existing credentials are never
overwritten. It remains closed after its audit event, including if that admin is
later deactivated. Do not delete this security audit event to reopen bootstrap.
An existing malformed credential is conservatively treated as initialized and
requires separately reviewed recovery, not automatic overwrite.

## Managers and workers

Use authenticated administrator User Management to reset/init a temporary local
password for the intended account. Existing reset behavior increments authVersion,
revokes sessions and requires first-login password change. It also attempts the
existing Keycloak password synchronization: obtain approval for that SSO impact.
Deliver temporary credentials privately. Verify Manager and Warehouse Executive
workspaces respectively; choosing another workspace must remain rejected.

## Deployment and validation

No new environment variables, schema migration or reseed is needed. Existing
JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE, WEB_APP_ORIGIN, database and Keycloak settings
remain required. Review auth-only changes; exclude unrelated speech/Docker edits.
Deploy code only after approval, then obtain separate approval to initialize
production credentials. Public invalid-login messages remain generic.

Check the audit event, hash-present boolean and local login after approved setup.
Build/unit tests do not replace an approved production SSO and local-login check.
Rolling code back does not remove the initialized password or audit event; do not
roll back authentication by deleting credentials or reseeding the database.

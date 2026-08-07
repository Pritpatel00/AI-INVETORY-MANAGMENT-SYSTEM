# Playwright e2e tests

Browser-level end-to-end tests for the critical user flows (M10).

## What is covered

| Spec | Flow |
| --- | --- |
| `manager-approval-flow.spec.ts` | Worker proposal → confirmed → routed to manager review → **manager signs in through Keycloak, approves it in the UI, and the audit ledger records the posted transaction with the manager as reviewer**. Also asserts a worker token cannot approve (Stage 8 role guard). |

The pending transaction is created through the inventory API in `beforeAll`
(standard Playwright practice: API-level setup, UI-level assertions), so the
voice-capture stage is not exercised here. A separate spec will mock
`MediaRecorder`/`getUserMedia` to cover voice capture → confirmation → post.

## Prerequisites (local dev stack)

The web app is auto-started by Playwright (or reused if already running on
port 3000). Everything else must be running first:

```powershell
# 1. Database (PostgreSQL 18 on port 5433)
npm run db:local:start

# 2. Keycloak 26.7.0 (realm: nirka-inventory, port 8080)
npm run auth:local:start
# wait ~20-30s for Keycloak to boot, then:
curl http://localhost:8080/realms/nirka-inventory/.well-known/openid-configuration

# 3. Inventory API (NestJS on port 4000) — reads services/api/.env
npm run api:dev
```

Optional for this spec (used by reorder/email flows): Valkey + Mailpit via
`npm run notifications:local:start`.

The database must have the migrations applied and the demo catalogue seeded:

```powershell
npm run api:db:migrate
npm run api:db:seed       # demo users: worker1, manager1, admin1
npm run api:db:seed:demo  # demonstration catalogue (never runs in production)
```

Demo credentials (from `infrastructure/keycloak/nirka-inventory-realm.json`):

| User | Password | Roles |
| --- | --- | --- |
| `worker1` | `Worker@123` | worker |
| `manager1` | `Manager@123` | worker + manager |
| `admin1` | `Admin@123` | worker + manager + administrator |

## Run

```bash
npx playwright test                # all e2e specs
npx playwright test tests/e2e/manager-approval-flow.spec.ts
npx playwright test --headed       # watch the browser
```

## How the manager spec works

1. `beforeAll` temporarily patches the Keycloak `nirka-inventory-web` client
   (password grants for the API setup + the app redirect URI) via the admin
   API, and restores it in `afterAll` — the same pattern the
   `infrastructure/verify-*.ps1` scripts use.
2. A `CYCLE_COUNT` for the first positive-stock balance is created and
   confirmed as `worker1`, which always routes to `PENDING_REVIEW`. A worker
   approve attempt is asserted to return 403.
3. The test signs in as `manager1` through the real Keycloak login page,
   opens **Approvals**, clicks **Approve and post**, and verifies:
   - the success message and removal from the pending queue;
   - the row in **Audit history** shows status **Posted** and reviewer
     **Inventory Manager**;
   - the API reports `status: POSTED` with `approvedBy`.

Counted quantity equals the current available stock, so approval posts without
changing the balance.

## Notes

- The service worker is blocked in tests so a cached PWA shell never serves
  stale markup.
- Tests run single-worker (`workers: 1`); the approval flow mutates shared
  Keycloak and ledger state.
- Uses the locally installed Chrome (`channel: "chrome"`). On a machine
  without Chrome, remove `channel` and run `npx playwright install chromium`.

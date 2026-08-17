# Nirka Inventory API

NestJS service for inventory data, pending transactions and the audit ledger.

## Current local setup

The project database is isolated in `.local/postgres-data` and uses port 5434,
so it does not change or conflict with the computer's existing PostgreSQL
service.

From the project root:

1. Run `npm run db:local:start`.
2. Run `npm run speech:local:start`.
3. Run `npm run api:dev`.
4. Open `http://localhost:4000/api/health`.

Keycloak must also be running before protected inventory endpoints can validate
access tokens.

The migration and demonstration data have already been applied on this
computer.

## Setup on another computer

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL with `npm run db:local:start` (native install on port
   5434).
3. Run `npm install`.
4. Run `npm run db:generate`.
5. Run `npm run db:migrate -- --name inventory_foundation`.
6. Run `npm run db:seed`.
7. Run `npm run start:dev`.

The API is available at `http://localhost:4000/api`.

- Health check: `GET /api/health`
- API documentation: `http://localhost:4000/api/docs`
- Signed-in user: `GET /api/auth/me`
- Manager access check: `GET /api/auth/manager-access`
- Products: `GET /api/inventory/products`
- Stock balances: `GET /api/inventory/balances`
- Transactions: `GET /api/inventory/transactions`
- Create pending transaction: `POST /api/inventory/transactions`
- Read authorized transaction: `GET /api/inventory/transactions/:id`
- Confirm transaction: `POST /api/inventory/transactions/:id/confirm`
- Transcribe worker audio: `POST /api/speech/transcribe`
- Extract controlled inventory details: `POST /api/ai/extract-inventory`

Worker confirmation creates a pending inventory transaction. Receiving,
shipping, usage and transfers are posted atomically after confirmation. Cycle
counts, damage and loss remain pending for manager review. Authentication and
role enforcement are active.

The speech endpoint accepts a signed-in worker's multipart audio upload, sends
it only to the local faster-whisper service, saves an evidence file and stores
its audit reference in PostgreSQL. Transcription alone never updates stock.

The AI endpoint accepts a reviewed transcript and optional evidence id. It uses
the local Qwen model through Ollama, validates the fixed response shape with
Zod, matches products and locations to active PostgreSQL records, and returns
clarification questions when required information is missing. It never creates
or posts an inventory transaction.

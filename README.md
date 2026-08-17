# Nirka AI Voice Inventory Management

Responsive web application for warehouse workers and inventory managers.

## Current milestone

Milestone 8 reorder controls are complete. The application now includes:

- Keycloak authentication and Worker, Manager and Administrator roles;
- responsive worker and manager dashboards;
- a real PostgreSQL inventory ledger and controlled transaction engine;
- real browser microphone recording;
- protected local speech-to-text using faster-whisper;
- an editable transcript before any inventory action;
- stored voice evidence and database audit references;
- local Qwen 3 extraction through Ollama;
- controlled action, item, quantity, location, condition and reference fields;
- one-question-at-a-time voice clarification when information is missing or
  uncertain;
- spoken proposal read-back and explicit worker confirmation;
- pending transactions linked to the reviewed transcript and voice evidence;
- a live manager queue with Approve, Reject and Request Recount decisions;
- automatic low-stock Purchase Items with duplicate prevention;
- installable PWA support with network-status visibility;
- device-local pending confirmation storage during temporary network loss;
- automatic authenticated synchronization with duplicate protection.

Voice transcription and AI extraction do not change inventory. Safe Receive,
Ship and Transfer movements post only after worker confirmation. A different
Cycle Count or Damage report remains unchanged until a manager approves it.

## Project structure

```text
AI-Voice-Inventory-Web/
|-- frontend/
|   |-- app/                     Web routes, layout and global styles
|   |-- src/features/inventory/  Executive, manager and administrator UI
|   |-- public/                  PWA and static web assets
|   `-- tests/                   Frontend and browser workflow tests
|-- backend/
|   |-- api/                     NestJS API, rules, Prisma and backend tests
|   `-- speech/                  Local faster-whisper transcription service
|-- packages/
|   |-- contracts/               Shared API contracts and generated types
|   `-- validation/              Shared Zod validation rules
|-- infrastructure/             Deployment and server configuration
|-- docs/                        Project roadmap and technical documentation
`-- video/                       Demonstration and storyboard assets
```

See `PROJECT_STRUCTURE.md` for file ownership and all root-level commands.

## Run locally

Start the project database:

```powershell
npm run db:local:start
```

Start Keycloak in a second terminal:

```powershell
npm run auth:local:start
```

Set up the local speech service once:

```powershell
npm run speech:setup
```

Start speech-to-text in a third terminal:

```powershell
npm run speech:local:start
```

Check that Ollama and Qwen are ready:

```powershell
npm run ai:local:check
```

Start the inventory API in a fourth terminal:

```powershell
npm run api:dev
```

Start the web application in a fifth terminal:

```powershell
npm run dev
```

Open the local address shown in the terminal.

## Local demonstration accounts

| Workspace | Username | Password |
|---|---|---|
| Worker | `worker1` | `Worker@123` |
| Manager | `manager1` | `Manager@123` |
| Administrator | `admin1` | `Admin@123` |

These accounts are only for local development. Replace all demonstration
passwords before any shared or production deployment.

## PWA and temporary offline work

The worker website can be installed from a supported browser using **Install
app** or **Add to Home Screen**. The application shell is cached so the web
interface can reopen during a temporary connection problem.

If the network fails after the AI proposal is ready, selecting **Confirm
inventory update** stores the confirmed proposal in IndexedDB with its permanent
client request ID. No stock changes while it is offline. When the same worker is
signed in and connectivity returns, the app automatically submits and confirms
the saved request through the normal protected API.

The header shows online, offline, synchronizing and pending-update status. See
`docs/OFFLINE_PWA.md` for the complete safety and testing workflow.

## Production check

```bash
npm run build
```

## Fresh-start database reset

To wipe every row (transactions, reorder drafts, tasks, audit history, balances,
products, locations, suppliers, users) and start from a production-safe empty
state, run:

```bash
npm run api:db:reset
```

The reset recreates the three demo users (`worker1`, `manager1`, `admin1`) and
an EMPTY catalogue — zero suppliers, locations, products, balances and
transactions. Real data is created through the application.

Local development and Playwright use the demonstration catalogue instead:

```bash
npm run api:db:reset:demo      # demo users + 10 suppliers, 4 locations, 15 products, opening balances
npm run api:db:seed:samples    # optional: 50 sample transactions for history previews
```

To clear ONLY test-fixture transactions (sample-seed and e2e runs) without
touching anything else — safe against a real deployment's history:

```bash
npm run api:db:reset:test-fixtures
```

## Backend foundation

Milestone 2 is complete. The project now includes:

- a NestJS API in `backend/api`;
- PostgreSQL development configuration;
- a Prisma inventory schema and demonstration seed data;
- products, locations, balances, users, pending transactions and reorder drafts;
- health, products, locations, balances and transaction endpoints;
- generated OpenAPI documentation through Swagger.
- an applied PostgreSQL migration and seeded local database;
- worker confirmation connected to pending API transactions;
- manager stock, low-stock and audit activity connected to database data.

## Authentication and roles

Milestone 3 is complete. Keycloak now authenticates users using Authorization
Code with PKCE. The web application checks the selected workspace against the
roles in the signed token, and the NestJS API independently validates the token
and role before returning protected inventory data.

## Inventory transaction engine

Milestone 4 is complete. Inventory transactions are created as pending records
and require explicit worker confirmation.

- Receive adds stock to the destination location.
- Ship subtracts stock only when enough quantity is available.
- Transfer subtracts from the source and adds to the destination together.
- A matching Cycle Count posts automatically; a different count and Damage
  remain pending for manager review.
- Duplicate request ids and repeated confirmation cannot apply stock twice.
- Stock movement and audit status are committed in one database transaction.

See `docs/TRANSACTION_ENGINE.md` for the detailed rules.

## Confirmation and manager review

Milestone 7 is complete. A worker can hear the full AI proposal, correct it,
cancel it or select **Confirm inventory update**. Confirmation creates the
durable audit transaction and links its reviewed transcript and voice evidence.

- Safe movements post after worker confirmation and business-rule validation.
- Different Cycle Counts and Damage enter the manager approval queue;
  exact Cycle Counts post automatically.
- Approve posts the reviewed adjustment atomically.
- Reject and Request Recount close the review without changing stock.
- Workers cannot call manager decision endpoints.

Run `npm run workflow:verify` to repeat the complete role and stock-safety
verification. See `docs/CONFIRMATION_AND_MANAGER_REVIEW.md` for the full flow.

## Low-stock purchase items

Milestone 8 checks affected balances after every posted movement or approved
adjustment. If available stock is below the product safety level, the product
appears on the manager's Purchase Items page for that product and location.

- The manager sees item and SKU, supplier, available stock, safety stock and
  suggested purchase quantity.
- The suggested quantity is the larger of the configured reorder quantity, the
  amount needed to restore stock above the safety level, and the supplier's
  minimum order quantity.
- The page supports search, low-stock/out-of-stock filters and severity sort.
- A product is automatically removed when stock recovers.
- Repeated stock checks cannot create duplicate active Purchase Items records.
- No supplier email is created or sent.

See `docs/REORDER_WORKFLOW.md` for the detailed rules.

## Voice capture and transcription

Milestone 5 is complete. A signed-in worker can record a warehouse statement
  from the browser. The audio is uploaded through the protected NestJS API,
  transcribed locally by faster-whisper and shown as editable text. When a
  recording contains clear speech, AI extraction starts automatically. The
  worker can still use **Edit transcript** to correct and reprocess the text.

The system stores the audio file under `.local/evidence` and creates a
`VoiceEvidence` database record containing the transcript, language, duration
and storage reference. No inventory balance is changed by transcription.

Run `npm run speech:verify` to repeat the authenticated local verification.
See `docs/VOICE_TRANSCRIPTION.md` for the detailed flow.

## AI extraction and clarification

Milestone 6 is complete. The reviewed transcript is sent through the protected
NestJS API to the local `qwen3:4b` model in Ollama. Qwen returns a fixed JSON
shape, and Zod validates it before the application uses any field.

Products and locations must match active PostgreSQL records. Unknown or
low-confidence required fields generate clarification questions. The system
  shows and can speak only the next missing question. The worker answers only
  that question by voice, and the answer is merged with all previously extracted
  details. Short clarification recordings use an English speech hint. The
  application keeps the raw transcript for audit and displays the approved
  value interpreted by the AI. If the answer cannot be matched safely, the same
  question is asked again instead of guessing. Approved warehouse pronunciation
  variants such as “Shelby” and “self B” are normalized to **Shelf B**.
  Extraction does not create or post a stock transaction.
  
  Run `npm run ai:verify` to repeat the five authenticated extraction checks.
  Run `npm run ai:verify:clarification` to verify common pronunciation and
  transcription variations used in short clarification answers.
  See `docs/AI_EXTRACTION.md` for the detailed safety flow.

See `docs/DEVELOPMENT_ROADMAP.md` for the complete build sequence.

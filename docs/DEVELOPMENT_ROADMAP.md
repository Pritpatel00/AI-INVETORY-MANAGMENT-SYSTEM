# Step-by-Step Development Roadmap

## Milestone 1 - Responsive frontend prototype

Status: Complete

Delivered:

- React and TypeScript project;
- responsive worker and manager layouts;
- prototype login;
- worker/manager role switch;
- simulated voice transaction;
- transaction confirmation;
- manager approvals and low-stock views;
- successful production build.

The milestone uses sample data and does not change real inventory.

## Milestone 2 - Backend and database foundation

Status: Complete

Delivered:

1. Created the NestJS API.
2. Added PostgreSQL development configuration.
3. Added the Prisma inventory schema and seed data.
4. Added products, locations, balances, users, transactions and reorder drafts.
5. Added health, product, location, balance and pending-transaction endpoints.
6. Added generated Swagger/OpenAPI documentation.
7. Initialized an isolated local PostgreSQL database.
8. Applied the first migration and seeded demonstration records.
9. Connected worker confirmation to pending API transactions.
10. Connected manager product, low-stock and audit activity to database data.

Visible result:

- the dashboards load products and stock from PostgreSQL;
- manual receiving creates a pending transaction;
- the transaction appears in the audit ledger.

## Milestone 3 - Authentication and roles

Status: Complete

Delivered:

1. Configured Keycloak 26.7.0 for local development.
2. Created Worker, Manager and Administrator roles.
3. Created separate web and API OpenID Connect clients.
4. Added Authorization Code with PKCE to the web application.
5. Kept role selection on the authentication screen.
6. Verified the selected workspace against signed Keycloak roles.
7. Protected NestJS endpoints using token signature, issuer and audience checks.
8. Added server-side role enforcement and a manager-only access check.
9. Added secure logout and access-token refresh.
10. Added local Worker, Manager and Administrator demonstration accounts.

Visible result:

- a worker cannot open manager functions;
- a manager can enter Worker or Manager workspace only when both roles are
  assigned;
- inventory APIs reject missing, invalid or unauthorized tokens.

## Milestone 4 - Inventory transaction engine

Status: Complete

Delivered:

1. Added a two-step pending and confirmation workflow.
2. Added atomic receiving stock updates.
3. Added safe shipping and internal-usage stock updates.
4. Added atomic transfers between warehouse locations.
5. Routed cycle count, damage and loss to manager review.
6. Added duplicate-request and repeated-confirmation protection.
7. Added negative available-stock prevention.
8. Added transaction ownership from the authenticated Keycloak user.
9. Limited workers to their own audit transactions.
10. Added serializable database transactions for concurrent updates.

Visible result:

- confirmed receiving, shipping, usage and transfers update balances and the
  audit ledger safely;
- risky adjustments remain pending without changing stock.

## Milestone 5 - Voice capture and transcription

Status: Complete

Delivered:

1. Added real browser microphone permission.
2. Added audio recording with MediaRecorder.
3. Added a protected NestJS multipart upload endpoint.
4. Added a local faster-whisper service using the multilingual Whisper base
   model on CPU with int8 processing.
5. Stored each accepted audio file under the project evidence directory.
6. Added a `VoiceEvidence` PostgreSQL record with transcript metadata and its
   storage reference.
7. Displayed the transcript as editable text for worker review.
8. Added recording, transcription, error and permission-denied states.
9. Kept transcription separate from inventory updates.
10. Added an authenticated repeatable local verification script.

Visible result:

- a spoken warehouse statement becomes editable text.
- the recording and transcript receive a traceable evidence reference;
- no stock changes until future AI extraction and worker confirmation.

## Milestone 6 - AI extraction and clarification

Status: Complete

Delivered:

1. Connected the existing local `qwen3:4b` model through Ollama.
2. Added a protected transcript-extraction endpoint.
3. Defined a fixed inventory JSON schema for every model response.
4. Validated the model response with Zod.
5. Limited products and locations to active PostgreSQL records.
6. Added deterministic SKU, item-name and location matching.
7. Added action-specific source and destination location rules.
8. Added confidence thresholds for required fields.
9. Added clarification questions for missing or uncertain information.
10. Added a responsive worker review card for the proposed fields.
11. Kept AI extraction separate from transaction creation and stock updates.
12. Added authenticated verification for receive, ship, transfer, cycle-count
    and damage statements.
13. Added negative verification for incomplete statements and unknown items.
14. Added one-question-at-a-time clarification with browser text-to-speech.
15. Added microphone answers that preserve and refine the previously extracted
    details.
16. Added an English language hint for short clarification recordings.
17. Added safe vocabulary normalization for common action pronunciations and
    transcription variations.
18. Added separate **Raw speech** and **AI understood** values for audit and
    worker review.
19. Added retry behavior when a clarification answer cannot be matched safely.
20. Started AI extraction automatically after a successful initial voice
    transcription.
21. Added safe approved-location aliases for common “Shelf B” transcription
    variations, including “Shelby” and “self B.”

Visible result:

- the AI fills the confirmation form but cannot update stock directly.
- invented products and locations are rejected;
- incomplete statements display clear worker clarification questions.
- workers answer only the currently missing detail instead of repeating the
  complete inventory statement.

## Milestone 7 - Confirmation, discrepancies and approvals

Completed:

1. Added spoken full-proposal read-back.
2. Added worker Confirm, Correct and Cancel controls.
3. Connected complete AI proposals to pending PostgreSQL transactions.
4. Linked reviewed transcripts and voice evidence to the audit transaction.
5. Kept Cycle Count, Damage and Loss pending after worker confirmation.
6. Added a live manager approval queue.
7. Added Approve, Reject and Request Recount decisions.
8. Added manager-only API authorization for all review decisions.
9. Added atomic stock posting for approved cycle-count, damage and loss actions.
10. Added automated role, status and unchanged-stock safety verification.

Visible result:

- risky transactions remain pending until a manager decides;
- rejected and recount-requested transactions never change stock;
- manager-approved adjustments are recorded in the audit ledger.

## Milestone 8 - Low-stock purchase items

Completed:

1. Added automatic safety-stock checks after posted inventory movements.
2. Added one active Purchase Items record per product and location.
3. Added current stock, safety level and suggested purchase quantity.
4. Added configured supplier name and minimum order quantity.
5. Added manager-only Purchase Items page with search, filters and severity sort.
6. Added automatic removal when stock recovers.
7. Added fixed-rules suggested-quantity calculation (reorder quantity, safety
   restoration, supplier minimum order quantity).
8. Removed the supplier-email and purchase-order approval workflow.

Removed functionality:

1. Removed approve / cancel reorder-draft endpoints.
2. Removed queue / retry supplier-email endpoints.
3. Removed Nodemailer delivery and BullMQ supplier-email jobs.
4. Removed email-delivery status handling and retry logic.
5. Removed purchase-order email templates.

Visible result:

- low stock produces a single manager-reviewable Purchase Item;
- the manager reviews available and required quantities directly;
- no supplier email is created or sent.

## Milestone 9 - PWA and offline work

Status: Complete

Delivered:

1. Added a web app manifest and standalone installed-app configuration.
2. Added a service worker for the application shell and static assets.
3. Added a worker-facing online and offline status indicator.
4. Added an IndexedDB queue for worker-confirmed proposals during temporary
   network loss.
5. Stored the existing permanent client request ID with every offline update.
6. Added per-user queue separation using the authenticated Keycloak subject.
7. Added automatic authenticated synchronization when connectivity returns.
8. Reused backend duplicate protection during every synchronization retry.
9. Added clear messaging that offline work does not change inventory.
10. Added automated build checks and a manual offline testing guide.

Visible result:

- workers can add the web application to their home screen and preserve pending
  confirmations during a temporary network interruption;
- the header shows network and synchronization status;
- queued work synchronizes automatically without applying the same stock
  movement twice.

## Milestone 10 - Testing, monitoring and pilot

Planned:

1. Jest business-rule tests.
2. Playwright worker and manager workflows.
3. OpenTelemetry instrumentation.
4. Prometheus metrics.
5. Grafana dashboards.
6. Loki logs.
7. Pilot with one warehouse and a limited product list.

Visible result:

- a monitored pilot release with measurable voice accuracy, transaction time
  and discrepancy results.

## Specification alignment - worker task queue

Status: First version complete

Delivered:

1. Replaced hard-coded worker counts with live transaction totals.
2. Added a worker task queue based on authenticated inventory records.
3. Added clear recount-required and waiting-for-manager states.
4. Added a one-click path from a recount task to voice entry.
5. Connected Worker navigation to Voice Entry, Task Queue and My History.
6. Added status-specific colors to the worker audit list.

Delivered since the first version:

1. Added expected receiving tasks that are created automatically when a
   purchase order is approved. Each task is linked to its reorder draft,
   starts unassigned, and can be claimed by any available executive from the
   task queue; cancelling the purchase order closes the task.

Next expansion:

1. Add manager-created scheduled cycle-count assignments.
2. Add worker shift and zone assignments to the authenticated profile.

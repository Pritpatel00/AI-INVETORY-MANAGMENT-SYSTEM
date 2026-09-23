# Controlled AI Inventory Extraction

## Purpose

The system converts a reviewed voice transcript into proposed inventory fields.
This reduces typing while keeping the worker and fixed business rules in
control.

## End-to-end flow

1. Whisper creates a transcript.
2. The worker reviews or corrects the transcript.
3. The web application sends the transcript and optional evidence id to the
   protected NestJS endpoint.
4. The API loads the approved active products and locations from PostgreSQL.
5. Local Ollama Qwen 3 extracts a fixed JSON response.
6. Zod rejects malformed or additional fields.
7. The API matches the suggested SKU and location codes to database records.
8. Action-specific rules keep only required source and destination locations.
9. Missing or low-confidence fields become clarification questions.
10. The web application shows and can speak only the first missing question.
11. The worker records only the requested answer.
12. Whisper transcribes the answer and the system merges it with the existing
    transcript context.
13. The controlled extraction runs again without losing previous details.
14. If another field is missing, the next single question is shown and spoken.
15. The web application displays the completed proposed details for review.

## Extracted fields

| Field | Example |
|---|---|
| Action | `RECEIVE` |
| Product | Blue Widget (`ITEM-402`) |
| Quantity | 5 |
| Source location | Shelf B |
| Destination location | Receiving Area |
| Condition | `GOOD` or `DAMAGED` |
| Reference number | Supplier X or Order 102 |
| Notes | Optional spoken details |

## Action rules

| Spoken intent | Controlled action | Required location |
|---|---|---|
| Received, incoming, delivered, put at, placed, added to | `RECEIVE` | Destination |
| Shipped, dispatched | `SHIP` | Source |
| Moved or transferred | `TRANSFER` | Source and destination |
| Counted or physical count | `CYCLE_COUNT` | Source |
| Damaged or broken | `DAMAGE` | Source |

## Safety controls

- The endpoint requires a valid Keycloak token and inventory role.
- The model runs through the configured local Ollama service.
- The model must return the fixed JSON schema.
- Zod validates types, allowed actions, lengths and confidence values.
- Product and location values must exist as active PostgreSQL records.
- Actions, products, quantities and locations must also be grounded in the
  worker's transcript; a catalogue value proposed only by the model is rejected.
- The API clears locations that are not relevant to the selected action.
- Required fields below the confidence threshold are sent back for
  clarification.
- Different cycle counts and damage are marked as manager-review actions.
- AI extraction never creates or posts an inventory transaction.

## Clarification examples

- “Which item or SKU does this update apply to?”
- “What quantity should be recorded?”
- “Which location did the stock come from?”
- “Where did you place the received stock?”

## Incremental voice clarification

The worker does not repeat the complete inventory statement.

Example:

1. Original statement: “Item 402, fifty units at Shelf B.”
2. System asks: “Which inventory action did you perform?”
3. Worker answers only: “Cycle count.”
4. The system keeps Item 402, fifty units and Shelf B, then adds the
   `CYCLE_COUNT` action.

When several fields are missing, the application asks them sequentially:

1. “Which item or SKU does this update apply to?”
2. Worker answers: “Item 402.”
3. “What quantity should be recorded?”
4. Worker answers: “Five units.”
5. “Where did you place the received stock?”
6. Worker answers: “Shelf B.”

The **Hear question** button uses browser text-to-speech, and **Answer this
question by voice** uses the same protected Whisper transcription path as the
original statement.

## Clarification answer polishing and audit

Short recordings can produce phonetic spelling variations. For example,
“Cycle count” may be transcribed as “Shaikal Count” or “Cycle Account.”
Warehouse locations can have the same problem; “Shelf B” may be transcribed as
“Shelby” or “self B.”

The system handles these answers in a controlled sequence:

1. The original short transcript is retained as **Raw speech**.
2. Only the field requested by the current clarification question is processed.
3. The answer is compared with an approved inventory vocabulary.
4. A safe match is converted to the canonical system value, such as
   `CYCLE_COUNT` or location code `SHELF-B`.
5. The page displays the result as **AI understood: Cycle count** or
   **AI understood: Shelf B**.
6. An unrelated or ambiguous answer is not accepted; the same question is
   spoken and displayed again.

This is vocabulary normalization, not permission for the model to invent an
action. The complete proposal still requires worker confirmation, and
different cycle-count and damage actions still require manager review.

## Local Ollama configuration

```text
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:4b
OLLAMA_KEEP_ALIVE=30m
OLLAMA_NUM_CTX=2048
OLLAMA_NUM_PREDICT=256
```

Ollama runs on the local machine and must have the `qwen3:4b` model installed.
The API sends the existing system/user messages to Ollama's `/api/chat` endpoint
with deterministic sampling, a bounded output, and the fixed JSON schema.

## Local Ollama tuning

Extraction latency comes from local model loading and generation, not the
database or the API. The request uses temperature 0, a fixed seed, a bounded
context/output, and a fixed JSON schema. The main tuning levers are:

- **`OLLAMA_MODEL`** — the locally installed model name; the default is
  `qwen3:4b`.
- **`OLLAMA_NUM_PREDICT`** (default `256`) — caps the generated JSON length.
  The extraction answer is small (including the free-text notes field), so
  this stops a slow tail. Raise it if a very long note ever gets cut off.
- **`OLLAMA_NUM_CTX`** (default `2048`) — bounds prompt tokens sent to the
  local model. Increase it if the active product/location catalogue becomes
  large.
- **`OLLAMA_KEEP_ALIVE`** (default `30m`) — keeps the model warm between
  warehouse commands and avoids repeated model loading.

Check local Ollama availability:

```powershell
npm run ai:local:check
```

Repeat the five authenticated extraction cases:

```powershell
npm run ai:verify
```

Repeat the focused clarification-polishing checks:

```powershell
npm run ai:verify:clarification
```

## Verified cases

The local verification covers:

1. Receive five units of Item 402 at Shelf B.
2. Ship three units of Item 402 from Shelf B.
3. Transfer ten units of Item 402 from Shelf B to Receiving Area.
4. Count fifty units of Item 402 at Shelf B.
5. Report five damaged units of Item 402 at Shelf B.

The safety verification also confirms that:

1. “Received some stock” is incomplete and requests the product, quantity and
   destination.
2. “Received five units of Item 999 at Shelf B” rejects the unknown item and
   requests a valid product.

## Confirmation handoff

Milestone 7 now converts a worker-approved proposal into a pending transaction,
links its reviewed transcript and voice evidence, and routes risky actions to
manager review. The inventory transaction engine remains the final authority.
See `CONFIRMATION_AND_MANAGER_REVIEW.md` for the decision flow.

# Voice Instructions and System Responses

This document answers two questions:

1. What voice instruction performs which action in the system?
2. For each instruction, what does the system answer back, and in what format?

Every voice statement follows the same pipeline, and each stage returns a
distinct response format:

```text
Speak  ->  1. Transcription   ->  2. AI extraction   ->  3. Clarification (if needed)
              (Whisper)            (Qwen 3 / Runpod)      (voice Q&A loop)
                                    ->  4. Confirmation  ->  5. Outcome / Error
```

## 1. Voice instructions → performed actions

The worker speaks one clear inventory sentence. The AI maps the spoken intent
to exactly one controlled action. Safe actions post immediately after worker
confirmation; **different cycle counts and damage require manager review**.

| Say something like | Controlled action | Location the system requires | Manager review |
|---|---|---|---|
| “I received 50 Blue Widgets and put them at Shelf B.” or “I received 50 Blue Widgets and added them to Shelf B.” | `RECEIVE` | Destination | No |
| “I shipped 5 Blue Widgets from Shelf B.” | `SHIP` | Source | No |
| “I moved 10 Blue Widgets from Shelf B to Shelf C.” | `TRANSFER` | Source **and** destination | No |
| “I counted 50 Blue Widgets on Shelf B.” | `CYCLE_COUNT` | Source | **Yes** |
| “5 units of Item 402 are damaged at Shelf B.” | `DAMAGE` | Source | **Yes** |

Recognized intent keywords (see `backend/api/src/ai/ai.service.ts`):

| Action | Words that trigger it |
|---|---|
| `TRANSFER` | transfer, transferred, move, moved |
| `RECEIVE` | receive, received, incoming, delivered, put, placed, add, added |
| `SHIP` | ship, shipped, dispatch, dispatched |
| `CYCLE_COUNT` | count, counted, cycle count |
| `DAMAGE` | damage, damaged, broken |

**Task voice entry:** when a task is loaded (e.g. “Receive Blue Widgets”),
the task already provides the action, item and location. The worker says only
the actual number: “50.” The system answers with an extraction where those
fields are trusted (confidence 1.0) and only the quantity is read from speech.

## 2. Response format — transcription (Whisper)

The worker speaks → browser records → `POST /api/speech/transcribe` returns:

```json
{
  "evidenceId": "b6abf8ce-a21f-43a0-83ef-3fd546cf95a4",
  "storageKey": "voice/2026-08-05/b6abf8ce-a21f-43a0-83ef-3fd546cf95a4.webm",
  "text": "Received five units of item 402 at shelf B from supplier X.",
  "language": "en",
  "languageProbability": 0.98,
  "duration": 3.42,
  "model": "large-v3-turbo",
  "segments": [
    { "start": 0.0, "end": 3.42, "text": "Received five units of item 402 at shelf B from supplier X." }
  ]
}
```

| Field | Type | Meaning |
|---|---|---|
| `evidenceId` | string (UUID) | Database `VoiceEvidence` record id, links audio + transcript to the user |
| `storageKey` | string | Path of the stored audio file under `.local/evidence/` |
| `text` | string | The editable transcript shown to the worker |
| `language` | string | Detected language code (e.g. `en`) |
| `languageProbability` | number 0–1 | Confidence in the detected language |
| `duration` | number | Recording length in seconds |
| `model` | string | Whisper model that produced the transcript |
| `segments` | array | Timestamped transcript segments `{start, end, text}` |

If no clear speech is detected the page answers: “No clear speech was
detected. Record again in a quieter area.”

## 3. Response format — AI extraction (Qwen 3 / Runpod)

The reviewed transcript is sent to `POST /api/ai/extract-inventory` and the
system answers with a complete structured proposal:

```json
{
  "transcript": "Received five units of item 402 at shelf B from supplier X.",
  "evidenceId": "b6abf8ce-a21f-43a0-83ef-3fd546cf95a4",
  "model": "Qwen/Qwen3-4B",
  "readyForConfirmation": true,
  "requiresManagerReview": false,
  "confidence": 0.933,
  "missingFields": [],
  "lowConfidenceFields": [],
  "clarificationQuestions": [],
  "fields": {
    "action": "RECEIVE",
    "product": { "id": "…", "sku": "ITEM-402", "name": "Blue Widget", "unit": "unit", "safetyStock": 20, "reorderQuantity": 40 },
    "quantity": 5,
    "sourceLocation": null,
    "destinationLocation": { "id": "…", "code": "RECEIVING", "name": "Receiving Area" },
    "condition": "GOOD",
    "referenceNumber": "SUPPLIER-X",
    "notes": null
  },
  "fieldConfidence": {
    "action": 0.95, "product": 0.9, "quantity": 0.98, "sourceLocation": 0.0,
    "destinationLocation": 0.88, "condition": 0.7, "referenceNumber": 0.85
  },
  "safetyNotice": "AI extracted these details but did not create or post an inventory transaction."
}
```

| Field | Type | Meaning |
|---|---|---|
| `readyForConfirmation` | boolean | `true` when no fields are missing or low-confidence |
| `requiresManagerReview` | boolean | `true` for a different `CYCLE_COUNT` or `DAMAGE` |
| `confidence` | number 0–1 | Average confidence of the required fields for the action |
| `missingFields` | string[] | Fields the AI could not determine (`action`, `product`, `quantity`, `sourceLocation`, `destinationLocation`) |
| `lowConfidenceFields` | string[] | Fields below the 0.5 confidence threshold |
| `clarificationQuestions` | string[] | One spoken question per missing/low field |
| `fields.action` | string or `null` | `RECEIVE` \| `SHIP` \| `TRANSFER` \| `CYCLE_COUNT` \| `DAMAGE` |
| `fields.product` | object or `null` | Matched active product (must be grounded in the transcript) |
| `fields.quantity` | int or `null` | Number of units; `null` when not explicitly spoken |
| `fields.sourceLocation` | object or `null` | Required for everything except `RECEIVE`; cleared for `RECEIVE` |
| `fields.destinationLocation` | object or `null` | Required for `RECEIVE`/`TRANSFER`; cleared for other actions |
| `fields.condition` | string | `GOOD` \| `DAMAGED` \| `HOLD` |
| `fields.referenceNumber` | string or `null` | Supplier or order number, only if grounded in the transcript |
| `fields.notes` | string or `null` | Optional spoken details, only if grounded in the transcript |
| `fieldConfidence` | object | One 0–1 score per field |
| `safetyNotice` | string | Fixed notice: extraction never changes stock by itself |

**Safety answers:** incomplete statements are answered with the same format but
with `readyForConfirmation: false` and questions:

- “Received some stock.” → missing `product`, `quantity`, `destinationLocation`.
- “Received five units of item 999 at Shelf B.” → unknown product rejected,
  `product` missing.

## 4. Response format — clarification questions and answers

When fields are missing or low-confidence, the system speaks back **one
question at a time** (browser text-to-speech) and waits for a voice answer:

| Field asked about | Question the system answers with |
|---|---|
| `action` | “Which inventory action did you perform?” |
| `product` | “Which item or SKU does this update apply to?” |
| `quantity` | “What quantity should be recorded?” |
| `sourceLocation` | “Which location did the stock come from?” |
| `destinationLocation` | “Where did you place the received stock?” |

The worker answers only the requested detail (e.g. “Cycle count.”). The system
merges the answer into the transcript using this exact format before re-running
extraction:

```text
<original transcript>
Clarification answer to "<question>": <spoken answer>.
```

Example:

```text
Item 402, fifty units at Shelf B.
Clarification answer to "Which inventory action did you perform?": Cycle count.
```

The system answers this merge with the **same extraction JSON** as in section 3
(now with the field resolved), and the page shows the normalized result:

- “Shaikal count” / “Cycle account” → `AI understood: Cycle count`
- “Shelby” / “self B” → `AI understood: Shelf B`

An unrelated or ambiguous answer is not accepted; the same question is spoken
and displayed again, e.g. “I heard ‘pizza’, but could not match it
confidently. Please say Receive, Ship, Transfer, Cycle count, or Damage.”

## 5. Response format — confirmation outcome

The worker confirms the proposal → the system creates and confirms the
transaction → `POST /api/inventory/transactions/:id/confirm` answers:

```json
{
  "outcome": "POSTED",
  "idempotent": false,
  "transaction": {
    "id": "…",
    "action": "RECEIVE",
    "status": "POSTED",
    "quantity": 5,
    "createdAt": "2026-08-05T09:30:00.000Z",
    "confirmedAt": "2026-08-05T09:31:00.000Z",
    "product": { "sku": "ITEM-402", "name": "Blue Widget", "unit": "unit" },
    "sourceLocation": null,
    "destinationLocation": { "code": "RECEIVING", "name": "Receiving Area" },
    "referenceNumber": "SUPPLIER-X",
    "createdBy": { "displayName": "Worker One" }
  }
}
```

| Outcome | Meaning |
|---|---|
| `POSTED` | Stock moved. Safe actions post immediately after worker confirmation. |
| `PENDING_REVIEW` | No stock changed; transaction waits for a manager decision (different cycle count or damage). |

When the manager reviews, `POST /api/inventory/transactions/:id/approve|reject|request-recount`
answers with the same shape but `outcome` is one of `POSTED`, `REJECTED`, or
`RECOUNT_REQUESTED`.

Offline: if the connection is lost during confirmation, the system answers
“Update saved safely on this device. No stock changed. It will synchronize
automatically when the connection returns.”

## 6. Response format — errors

All endpoints answer failures with the standard NestJS error format. The web
app turns it into a short sentence shown on the page.

```json
{
  "statusCode": 400,
  "message": "Unsupported audio type: text/plain.",
  "error": "Bad Request"
}
```

| Scenario | statusCode / message |
|---|---|
| Audio file missing | `400` “An audio file is required.” |
| Unsupported audio type | `400` “Unsupported audio type: …” |
| Invalid language hint | `400` “Language must be a two-letter code such as 'en'.” |
| Evidence belongs to another user | `400` “The voice evidence does not belong to this user.” |
| Speech service is down | `503` “The local speech-to-text service is unavailable.” |
| Runpod AI is down | `503` “The Runpod AI service is unavailable.” |
| Model returned invalid JSON | `502` “The AI model returned information in an invalid format.” |
| User profile unavailable | `503` “The authenticated inventory user profile is unavailable.” |

When `message` is an array (validation errors), the client joins them into one
sentence.

## 7. Worked example — one statement, every response

**You say:** “Received five units of item 402 at shelf B from supplier X.”

1. **Transcription answer:** `text: "Received five units of item 402 at shelf B from supplier X."`, `language: "en"`, `evidenceId: "<uuid>"`.
2. **Extraction answer:** `readyForConfirmation: true`, `fields.action: "RECEIVE"`, `fields.product: Blue Widget (ITEM-402)`, `fields.quantity: 5`, `fields.destinationLocation: Receiving Area`, `fields.condition: "GOOD"`, `fields.referenceNumber: "SUPPLIER-X"`, `requiresManagerReview: false`, `confidence: 0.933`.
3. **Confirmation answer:** `outcome: "POSTED"` — the validated stock movement is posted and the transcript + evidence stay linked to the transaction for audit.

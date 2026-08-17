# Voice Capture and Transcription

## Purpose

Warehouse workers can speak an inventory statement instead of typing it. The
system converts the recording into editable text while keeping the inventory
ledger unchanged.

## Worker flow

1. The worker signs in and opens Worker workspace.
2. The worker selects the microphone and allows browser microphone access.
3. The browser records the statement using MediaRecorder.
4. While the worker speaks, a **live transcript preview** appears on screen
   in real time using the browser's built-in speech recognition (Chrome and
   Edge). This preview is best-effort display only: it is never used to
   change inventory.
5. The worker stops the recording.
6. The web application uploads the audio with the worker's access token.
7. The NestJS API checks the token and Warehouse Executive role.
8. The API stores the audio as evidence.
9. The API sends the audio to the local faster-whisper service.
10. Whisper returns the transcript, language, confidence and duration.
11. The API saves this metadata in PostgreSQL and returns it to the web page.
12. If clear speech was detected, AI extraction starts automatically.
13. The worker reviews the extracted values and can select **Edit transcript**
    to correct and reprocess the text.

When the worker starts from a quick-action card, that selected workflow is
trusted context. The AI still extracts the item, quantity and locations, but a
minor speech error cannot change a selected Cycle Count into Ship, for example.
Each quick-action card now represents one clear action.

For a short answer to a clarification question, the browser sends an English
language hint to Whisper. This reduces incorrect language detection on
one- or two-word warehouse answers. The original full inventory statement keeps
automatic language detection.

Locations are matched only against active PostgreSQL warehouse locations.
For Receive, the worker can omit the destination and the system automatically
uses **Receiving**. If a required location cannot be matched for another action,
the AI asks only for that missing detail.

## Safety boundary

Speech recognition only produces text. It cannot receive, ship, transfer,
count, damage or remove stock. AI extraction proposes structured fields, and
Warehouse Executive confirmation plus fixed business rules control every
inventory update.

## Live transcript preview

When the worker taps the microphone, the page also starts a continuous
`SpeechRecognition` session with interim results enabled. Each partial result
updates the on-screen transcript as the worker talks, so the worker can
immediately see what is being captured. The preview is optional and degrades
silently: if the browser or the recognition service does not support it, the
recording flow works exactly as before.

The final transcript is always produced by the local faster-whisper service
from the full recording. This keeps language, confidence and duration metadata
and the audio evidence authoritative, and it means the live preview has no
impact on the inventory ledger.

## Local services

| Service | Local address | Responsibility |
|---|---|---|
| Web application | `http://localhost:3000` | Records audio and shows editable text |
| NestJS API | `http://localhost:4000/api` | Authenticates, stores evidence and proxies audio |
| Speech service | `http://127.0.0.1:5001` | Runs faster-whisper locally |
| Keycloak | `http://localhost:8080` | Login, tokens and roles |
| PostgreSQL | `localhost:5434` | Voice evidence metadata and inventory data |

## Storage

- Audio files: `.local/evidence/voice/YYYY-MM-DD`
- Model cache: `.local/whisper-models`
- Evidence metadata: PostgreSQL `VoiceEvidence`

The `.local` directory is excluded from source control because it contains
machine-specific runtime data and warehouse evidence.

## Verified example

Input:

> Received five units of Cable.

Local Whisper transcript:

> Receive five units of cable into Receiving.

The authenticated verification confirmed that Whisper recognized the current
one-word product. The full Playwright voice test also confirms that Qwen matches
Cable and the destination spoken by the worker, posts the validated Receive
transaction and restores the original test balance. If the destination is not
spoken, the system asks only “Where did you place the received stock?” and does
not create or post a transaction until the answer is supplied and confirmed.

The complete browser matrix also checks Ship, Transfer, matching and different
Cycle Counts, Damage and a missing-location clarification.
Approved speech variants are matched only when they identify one unique active
location. For example, common Whisper variants of Dispatch such as “spatch” or
“this patch” are safely normalized to Dispatch.

## Transcription speed

The speech service decodes with greedy search (`WHISPER_BEAM_SIZE=1`) by
default for fast responses on CPU. Set `WHISPER_BEAM_SIZE=5` to trade speed
for slightly higher accuracy on longer or more ambiguous recordings.

## Local commands

Run once:

```powershell
npm run speech:setup
```

Start the service:

```powershell
npm run speech:local:start
```

Repeat the authenticated test:

```powershell
npm run speech:verify
```

## Relationship to AI extraction

The reviewed transcript is passed to the controlled Qwen 3 and Ollama
extraction flow described in `AI_EXTRACTION.md`. Speech recognition produces
text only; it cannot update inventory by itself.

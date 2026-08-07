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
6. The NestJS API checks the token and Worker role.
7. The API stores the audio as evidence.
8. The API sends the audio to the local faster-whisper service.
9. Whisper returns the transcript, language, confidence and duration.
10. The API saves this metadata in PostgreSQL and returns it to the web page.
11. If clear speech was detected, AI extraction starts automatically.
12. The worker reviews the extracted values and can select **Edit transcript**
    to correct and reprocess the text.

For a short answer to a clarification question, the browser sends an English
language hint to Whisper. This reduces incorrect language detection on
one- or two-word warehouse answers. The original full inventory statement keeps
automatic language detection.

Known location pronunciation variants are matched only against active
PostgreSQL warehouse locations. For example, “Shelby” and “self B” can resolve
to **Shelf B**. An unrelated answer remains unresolved and the location question
is asked again.

## Safety boundary

Speech recognition only produces text. It cannot receive, ship, transfer,
count, damage or remove stock. A future AI extraction step will propose
structured fields, and the existing confirmation and business-rule engine will
control any inventory update.

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
| Web application | `http://localhost:3002` | Records audio and shows editable text |
| NestJS API | `http://localhost:4000/api` | Authenticates, stores evidence and proxies audio |
| Speech service | `http://127.0.0.1:5001` | Runs faster-whisper locally |
| Keycloak | `http://localhost:8080` | Login, tokens and roles |
| PostgreSQL | `localhost:5433` | Voice evidence metadata and inventory data |

## Storage

- Audio files: `.local/evidence/voice/YYYY-MM-DD`
- Model cache: `.local/whisper-models`
- Evidence metadata: PostgreSQL `VoiceEvidence`

The `.local` directory is excluded from source control because it contains
machine-specific runtime data and warehouse evidence.

## Verified example

Input:

> Received five units of item four zero two at shelf B from supplier X.

Local Whisper transcript:

> Received five units of item 402 at shelf B from supplier X.

The authenticated verification confirmed that the transcript, evidence file
and database record were created and that the temporary test-only login setting
was restored to disabled.

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

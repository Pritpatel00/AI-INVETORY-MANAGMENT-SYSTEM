# Nirka Speech Service

Local FastAPI service that converts warehouse audio into text using
faster-whisper and the open Whisper model.

## Local setup

From the project root:

```powershell
npm run speech:setup
npm run speech:local:start
```

The service runs on `http://127.0.0.1:5001`.

- Health: `GET /health`
- Transcription: `POST /transcribe` using multipart field `audio`

The default model is multilingual Whisper `base` running on CPU with INT8
computation. The model downloads into `.local/whisper-models` on the first
transcription.

Decoding uses greedy search (`WHISPER_BEAM_SIZE=1`) for fast responses on
CPU. To trade speed for slightly higher accuracy on longer recordings, set
`WHISPER_BEAM_SIZE=5` in the environment.

Python packages are isolated in `services/speech/.python-packages`.

The speech service returns text and language information only. It cannot update
inventory or make approval decisions.

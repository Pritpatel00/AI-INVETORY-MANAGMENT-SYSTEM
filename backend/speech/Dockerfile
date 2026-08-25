# Production image for the faster-whisper speech-to-text service.
# Build context is backend/speech/ itself (no workspace file: dependency here).
#
#   docker build -f backend/speech/Dockerfile backend/speech

FROM python:3.12-slim AS base
WORKDIR /app

# ffmpeg is required by faster-whisper/ctranslate2's audio decoding path for
# non-WAV uploads (webm/ogg/mp4 from the browser MediaRecorder API).
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

RUN groupadd --system nirka && useradd --system --gid nirka --home /app nirka \
    && mkdir -p /app/.cache/whisper-models \
    && chown -R nirka:nirka /app
USER nirka

# WHISPER_MODEL_CACHE should point at a Railway persistent volume so the
# model is downloaded once, not on every deploy/restart.
ENV WHISPER_MODEL_CACHE=/app/.cache/whisper-models \
    WHISPER_MODEL=base \
    WHISPER_DEVICE=cpu \
    WHISPER_COMPUTE_TYPE=int8

# Keep this service private on Railway (no public domain) — the API reaches
# it over Railway's private network via SPEECH_SERVICE_URL.
EXPOSE 5001

# Railway injects PORT; uvicorn binds it directly since main.py has no
# hardcoded port itself (only the old local .ps1 launcher did).
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-5001}"]

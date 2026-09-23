from __future__ import annotations

import os
import tempfile
from functools import lru_cache
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from faster_whisper import WhisperModel

MAX_AUDIO_BYTES = 20 * 1024 * 1024
ALLOWED_AUDIO_TYPES = {
    "audio/webm",
    "audio/ogg",
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp4",
    "video/webm",
}

app = FastAPI(
    title="Nirka Speech Service",
    description="Local warehouse speech-to-text using faster-whisper.",
    version="0.1.0",
)


@lru_cache(maxsize=2)
def get_model(model_name: str) -> WhisperModel:
    return WhisperModel(
        model_name,
        device=os.getenv("WHISPER_DEVICE", "cpu"),
        compute_type=os.getenv("WHISPER_COMPUTE_TYPE", "int8"),
        download_root=os.getenv("WHISPER_MODEL_CACHE"),
    )


def transcribe_file(
    file_path: str,
    language: str | None = None,
    preview: bool = False,
) -> dict[str, Any]:
    # Greedy decoding (beam_size=1) is the default for fast warehouse
    # statements on CPU. Raise WHISPER_BEAM_SIZE (for example to 5) to trade
    # speed for slightly higher accuracy on longer, more ambiguous audio.
    model_name = (
        os.getenv("WHISPER_PREVIEW_MODEL", "tiny.en")
        if preview
        else os.getenv("WHISPER_MODEL", "base")
    )
    beam_variable = "WHISPER_PREVIEW_BEAM_SIZE" if preview else "WHISPER_BEAM_SIZE"
    try:
        beam_size = int(os.getenv(beam_variable, "1"))
    except ValueError:
        beam_size = 1
    initial_prompt = os.getenv(
        "WHISPER_INITIAL_PROMPT",
        "Warehouse inventory. Actions: receive, ship, transfer, cycle count, damage. Items: cable, helmet, gloves, tape, box, bottle, bolt, bearing. Locations: receiving, dispatch, packing, storage one, storage two, storage three.",
    ).strip()
    segments_iterator, information = get_model(model_name).transcribe(
        file_path,
        beam_size=beam_size,
        vad_filter=True,
        condition_on_previous_text=False,
        language=language,
        initial_prompt=initial_prompt or None,
    )
    segments = [
        {
            "start": round(segment.start, 2),
            "end": round(segment.end, 2),
            "text": segment.text.strip(),
        }
        for segment in segments_iterator
    ]
    text = " ".join(segment["text"] for segment in segments).strip()
    duration = max((segment["end"] for segment in segments), default=0)

    return {
        "text": text,
        "language": information.language,
        "languageProbability": round(information.language_probability, 4),
        "duration": duration,
        "segments": segments,
        "model": model_name,
    }


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "service": "nirka-speech",
        "status": "ok",
        "model": os.getenv("WHISPER_MODEL", "base"),
        "modelLoaded": get_model.cache_info().currsize > 0,
    }


@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: str | None = Form(default=None),
    preview: bool = Header(default=False, alias="X-Whisper-Preview"),
) -> dict[str, Any]:
    content_type = (audio.content_type or "").lower().split(";", 1)[0].strip()
    if content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported audio type: {content_type or 'unknown'}.",
        )

    audio_bytes = await audio.read(MAX_AUDIO_BYTES + 1)
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="The audio file is empty.")
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Audio must be 20 MB or smaller.",
        )
    if language and (len(language) != 2 or not language.isalpha()):
        raise HTTPException(
            status_code=400,
            detail="Language must be a two-letter code such as 'en'.",
        )

    suffix = Path(audio.filename or "recording.webm").suffix or ".webm"
    temporary_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temporary:
            temporary.write(audio_bytes)
            temporary_path = temporary.name
        return await run_in_threadpool(
            transcribe_file,
            temporary_path,
            language.lower() if language else None,
            preview,
        )
    finally:
        if temporary_path:
            Path(temporary_path).unlink(missing_ok=True)

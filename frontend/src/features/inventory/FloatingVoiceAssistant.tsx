"use client";

import { Mic, Loader2, CheckCircle2 } from "lucide-react";
import { useVoicePosition } from "./hooks/useVoicePosition";

interface FloatingVoiceAssistantProps {
  active: boolean;
  onOpen: () => void;
  voiceState?: "idle" | "recording" | "transcribing" | "extracting" | "extracted" | "review";
  submissionState?: "idle" | "creating" | "confirming" | "complete";
}

export function FloatingVoiceAssistant({
  active,
  onOpen,
  voiceState = "idle",
  submissionState = "idle",
}: FloatingVoiceAssistantProps) {
  const { position, dragging, beginDrag, moveDrag, finishDrag, cancelDrag } = useVoicePosition();

  const isProcessing = voiceState === "recording" || voiceState === "transcribing" || voiceState === "extracting";
  const isComplete = submissionState === "complete";

  const buttonClass = [
    "floating-voice-button",
    active ? "is-active" : "",
    dragging ? "is-dragging" : "",
    voiceState === "recording" ? "voice-button-recording" : "",
    isProcessing && voiceState !== "recording" ? "voice-button-processing" : "",
    isComplete ? "voice-button-success" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const getButtonIcon = () => {
    if (isComplete) return <CheckCircle2 size={24} strokeWidth={2.4} />;
    if (isProcessing) return <Loader2 size={24} strokeWidth={2.4} className="animate-spin" />;
    return <Mic size={25} strokeWidth={2.4} />;
  };

  const getAccessibleLabel = () => {
    if (active) return "Voice entry is open. Drag this microphone to move it.";
    if (voiceState === "recording") return "Recording in progress.";
    if (voiceState === "transcribing") return "Converting speech to text.";
    if (voiceState === "extracting") return "AI is extracting inventory details.";
    if (submissionState === "complete") return "Voice update completed successfully.";
    return "Start inventory update by voice. Drag this microphone to move it.";
  };

  return (
    <div className="floating-voice-wrap fixed z-50" style={position ? { left: position.x, top: position.y } : { right: 24, bottom: 24 }}>
      <span className="floating-voice-hint" aria-hidden="true">
        {voiceState === "recording"
          ? "Recording…"
          : voiceState === "transcribing"
            ? "Transcribing…"
            : voiceState === "extracting"
              ? "AI processing…"
              : isComplete
                ? "Done!"
                : "Tap for voice"}
      </span>
      <button
        type="button"
        aria-label={getAccessibleLabel()}
        aria-pressed={active}
        title={
          voiceState === "recording"
            ? "Recording — tap to stop"
            : "Drag to move · Tap to open Voice Entry"
        }
        onPointerDown={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          event.currentTarget.setPointerCapture(event.pointerId);
          beginDrag(event.clientX, event.clientY, event.pointerId, bounds);
        }}
        onPointerMove={(event) => moveDrag(event.clientX, event.clientY, event.pointerId)}
        onPointerUp={(event) => {
          const { wasMoved } = finishDrag(event.pointerId);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          if (!wasMoved) onOpen();
        }}
        onPointerCancel={cancelDrag}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen();
          }
        }}
        className={buttonClass}
        style={{ touchAction: "none" }}
      >
        <span className="floating-voice-ripple" aria-hidden="true" />
        {getButtonIcon()}
        <span className="floating-drag-dots" aria-hidden="true">•••</span>
      </button>
      {/* Recording waveform indicator */}
      {voiceState === "recording" && (
        <div
          className="absolute -bottom-8 left-1/2 flex -translate-x-1/2 items-end gap-[2px]"
          aria-hidden="true"
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={`wave-bar-${i} inline-block w-[2px] rounded-full bg-[#dc3232]`}
              style={{
                height: `${8 + i * 2}px`,
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      )}
      {/* State label */}
      {(voiceState === "transcribing" || voiceState === "extracting") && (
        <div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-extrabold uppercase tracking-wider text-[#155eef]"
          aria-live="polite"
        >
          {voiceState === "transcribing" ? "Converting…" : "Processing…"}
        </div>
      )}
    </div>
  );
}
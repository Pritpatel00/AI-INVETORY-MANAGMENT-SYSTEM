"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { AlertTriangle, ArrowDownToLine, ArrowRightLeft, BellRing, Boxes, Camera, CheckCircle2, ChevronDown, ClipboardCheck, Clock3, FileClock, ImagePlus, LayoutDashboard, Mic, PackageMinus, RefreshCcw, Settings, ShieldCheck, Sparkles, Trash2, Volume2, X } from "lucide-react";
import { mapTransactions, fetchInventorySnapshot, fetchInventoryTasks, startInventoryTask, completeInventoryTask, cancelInventoryTransaction, createPendingInventoryTransaction, confirmInventoryTransaction, extractInventoryDetails, transcribeAudio, uploadTransactionEvidence, type ApiProduct, type ApiLocation, type ApiTransaction, type ApiInventoryTask, type InventoryExtraction, type InventorySnapshot, type SpeechTranscription } from "../api/inventory-api";
import { enqueueOfflineInventoryUpdate } from "../offline/offline-queue";
import { getAuthenticatedDisplayName, keycloak } from "../auth/keycloak";
import type { VoiceState } from "../types";
import { formatAction, taskTypeLabel, formatTaskDue, formatClarificationValue, clarificationRetryHelp, STOCK_OUT_ACTIONS } from "../shared/helpers";
import { MetricCard } from "../shared/MetricCard";

import { ExecutiveHome, type ExecutiveVoiceWorkflow } from "./ExecutiveHome";
import { ExecutiveTaskQueue } from "./ExecutiveTaskQueue";
import { ExecutiveHistory } from "./ExecutiveHistory";
import { ExecutiveSettings } from "./ExecutiveSettings";

const preferredGuidanceVoices = [
  "Microsoft Neerja Online (Natural)",
  "Microsoft Sonia Online (Natural)",
  "Microsoft Aria Online (Natural)",
  "Google UK English Female",
  "Microsoft Zira",
];

function createGuidanceUtterance(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const preferredVoice = preferredGuidanceVoices
    .map((name) => voices.find((voice) => voice.name.includes(name)))
    .find(Boolean) ??
    voices.find((voice) => voice.lang.toLowerCase() === "en-in") ??
    voices.find((voice) => voice.lang.toLowerCase() === "en-gb") ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));
  if (preferredVoice) utterance.voice = preferredVoice;
  utterance.lang = preferredVoice?.lang ?? "en-IN";
  utterance.rate = 0.82;
  utterance.pitch = 0.96;
  utterance.volume = 1;
  return utterance;
}

export function ExecutiveDashboard({
  page,
  onNavigate,
  isOnline,
  pendingSyncCount,
  syncState,
  onSignOut,
  onPendingTaskCountChange,
}: {
  page: string;
  onNavigate: (page: string) => void;
  isOnline?: boolean;
  pendingSyncCount?: number;
  syncState?: string;
  onSignOut?: () => void;
  onPendingTaskCountChange?: (count: number) => void;
}) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [message, setMessage] = useState("");
  const [snapshot, setSnapshot] = useState<InventorySnapshot | null>(null);
  const [assignedTasks, setAssignedTasks] = useState<ApiInventoryTask[]>([]);
  const [taskActionId, setTaskActionId] = useState<string | null>(null);
  const [cancellingTransactionId, setCancellingTransactionId] =
    useState<string | null>(null);
  const [activeVoiceTask, setActiveVoiceTask] = useState<{
    id: string;
    title: string;
    type: string;
    description?: string | null;
    product?: ApiProduct | null;
    location?: ApiLocation | null;
    quantity?: number | null;
    sourceLocation?: ApiLocation | null;
    destinationLocation?: ApiLocation | null;
    shipmentReference?: string | null;
    reservationReference?: string | null;
    source: "ASSIGNED" | "RECOUNT";
  } | null>(null);
  const [newTaskAlert, setNewTaskAlert] = useState("");
  const [microphoneStatus, setMicrophoneStatus] = useState("Not checked");
  const [speakerStatus, setSpeakerStatus] = useState("");
  const [lastTaskRefresh, setLastTaskRefresh] = useState<Date | null>(null);
  // Tracks whether the task API could be reached. When it cannot, the queue
  // shows a refresh error instead of rebuilding recount cards from transaction
  // history (a completed recount must never be recreated as an open task).
  const [taskLoadError, setTaskLoadError] = useState(false);
  const [clockNow, setClockNow] = useState(() => new Date());
  const [historyRange, setHistoryRange] = useState<"WEEK" | "ALL">("WEEK");
  const [historyView, setHistoryView] = useState<"PENDING" | "COMPLETED">("PENDING");
  const [selectedWorkflow, setSelectedWorkflow] =
    useState<ExecutiveVoiceWorkflow | null>(null);
  const [transcript, setTranscript] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [liveTranscriptSupported, setLiveTranscriptSupported] =
    useState(false);
  const [transcription, setTranscription] =
    useState<SpeechTranscription | null>(null);
  const [extraction, setExtraction] =
    useState<InventoryExtraction | null>(null);
  const [clarificationState, setClarificationState] = useState<
    "idle" | "recording" | "transcribing" | "processing"
  >("idle");
  const [clarificationHistory, setClarificationHistory] = useState<
    Array<{
      question: string;
      rawAnswer: string;
      interpretedAnswer: string;
    }>
  >([]);
  const [submissionState, setSubmissionState] = useState<
    "idle" | "creating" | "confirming" | "complete"
  >("idle");
  const [submittedTransaction, setSubmittedTransaction] =
    useState<ApiTransaction | null>(null);
  const [confirmationOutcome, setConfirmationOutcome] = useState<
    "POSTED" | "PENDING_REVIEW" | null
  >(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceUploading, setEvidenceUploading] = useState(false);
  const [evidenceMessage, setEvidenceMessage] = useState("");
  const [evidenceAttached, setEvidenceAttached] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const liveRecognitionRef = useRef<SpeechRecognition | null>(null);
  const liveRecognitionActiveRef = useRef(false);
  const liveFinalRef = useRef("");
  const clientRequestIdRef = useRef<string | null>(null);
  const activeClarificationQuestion =
    extraction?.clarificationQuestions[0] ?? "";

  useEffect(() => {
    let active = true;
    let knownTaskIds = new Set<string>();

    Promise.all([fetchInventorySnapshot(), fetchInventoryTasks()])
      .then(([inventory, tasks]) => {
        if (!active) return;
        knownTaskIds = new Set(tasks.map((task) => task.id));
        setSnapshot(inventory);
        setAssignedTasks(tasks);
        setLastTaskRefresh(new Date());
        setTaskLoadError(false);
      })
      .catch(() => {
        setSnapshot(null);
        setTaskLoadError(true);
      });

    const refreshTasks = async () => {
      if (!active || document.visibilityState === "hidden") return;
      try {
        const [tasks, inventory] = await Promise.all([
          fetchInventoryTasks(),
          fetchInventorySnapshot(),
        ]);
        if (!active) return;
        const newTasks = tasks.filter(
          (task) => task.status === "OPEN" && !knownTaskIds.has(task.id),
        );
        if (newTasks.length === 1) {
          setNewTaskAlert(`New task assigned: ${newTasks[0].title}`);
        } else if (newTasks.length > 1) {
          setNewTaskAlert(`${newTasks.length} new tasks were assigned to you.`);
        }
        knownTaskIds = new Set(tasks.map((task) => task.id));
        setAssignedTasks(tasks);
        setSnapshot(inventory);
        setLastTaskRefresh(new Date());
        setTaskLoadError(false);
      } catch {
        // Keep the last valid queue visible while the next automatic refresh
        // retries, but stop deriving recount cards from transaction history:
        // without the task API the queue cannot confirm a recount is still
        // genuinely open, so completed work is never recreated.
        setTaskLoadError(true);
      }
    };

    const refreshTimer = window.setInterval(() => void refreshTasks(), 5_000);
    const refreshOnFocus = () => void refreshTasks();
    window.addEventListener("focus", refreshOnFocus);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", refreshOnFocus);
      stopLiveTranscription();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  /** Re-fetch tasks and the inventory snapshot from the refresh/error banner. */
  async function refreshWorkerQueue() {
    try {
      const [tasks, inventory] = await Promise.all([
        fetchInventoryTasks(),
        fetchInventorySnapshot(),
      ]);
      setAssignedTasks(tasks);
      setSnapshot(inventory);
      setLastTaskRefresh(new Date());
      setTaskLoadError(false);
      setMessage("Task queue refreshed.");
    } catch {
      setTaskLoadError(true);
      setMessage(
        "The task service is unavailable. Check the API and try again — completed work is never recreated from history.",
      );
    }
  }

  const workerName = getAuthenticatedDisplayName() || "Warehouse Executive";
  const workerGreeting = (() => {
    const hour = clockNow.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  const voiceCopy = useMemo(() => {
    if (voiceState === "recording") return { title: "Listening…", detail: "Simply say what you did, the number, the item name and the shelf." };
    if (voiceState === "transcribing") return { title: "Creating transcript…", detail: "Whisper is processing the recording locally." };
    if (voiceState === "review") return { title: "Transcript ready", detail: "Review or correct the spoken text before continuing." };
    if (voiceState === "extracting") return { title: "Understanding your update…", detail: "AI is checking the item name and shelf name." };
    if (voiceState === "extracted") return { title: "Inventory details ready", detail: "Review the AI suggestion before any transaction is created." };
    if (activeVoiceTask?.type === "TRANSFER") {
      return {
        title: "Ready — confirm the assigned transfer",
        detail:
          "The product, quantity, pick-from location and transfer-to location are already filled from the manager task.",
      };
    }
    if (
      activeVoiceTask &&
      ["RECEIVE", "CYCLE_COUNT", "STOCK_VERIFY", "RECOUNT"].includes(
        activeVoiceTask.type,
      )
    ) {
      return {
        title: "Ready — say only the actual number",
        detail:
          "The task already provides the action, item and location. You do not need to repeat them.",
      };
    }
    const examples = {
      RECEIVE: 'Say: “I received 50 Boxes.”',
      SHIP: 'Say: “I shipped 5 Boxes from Storage.”',
      TRANSFER: 'Say: “I moved 10 Boxes from Storage to Dispatch.”',
      CYCLE_COUNT: 'Say: “I counted 50 Boxes.”',
      DAMAGE: 'Say: “I damaged 2 Boxes in Storage.”',
    };
    return { title: selectedWorkflow ? "Ready — speak one short sentence" : "Ready for a voice update", detail: selectedWorkflow ? examples[selectedWorkflow] : 'Try: “I received 50 Boxes.”' };
  }, [voiceState, selectedWorkflow, activeVoiceTask]);

  function chooseWorkflow(workflow: ExecutiveVoiceWorkflow) {
    resetVoice();
    setSelectedWorkflow(workflow);
    setMessage("Ready. Tap the microphone and say one short sentence using the sample above.");
    document.getElementById("voice-entry")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function startWorkflowFromHome(workflow: ExecutiveVoiceWorkflow) {
    resetVoice();
    setSelectedWorkflow(workflow);
    setMessage(
      "Ready. Tap the microphone and say one short sentence using the selected action.",
    );
    onNavigate("Voice entry");
    window.setTimeout(() => {
      document.getElementById("voice-entry")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  function startLiveTranscription() {
    stopLiveTranscription();
    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setLiveTranscriptSupported(false);
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;
    liveFinalRef.current = "";
    recognition.onresult = (event) => {
      // Final text is accumulated in a ref because the browser restarts the
      // recognizer after pauses, and each session starts with fresh results.
      let interimText = "";
      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];
        const spoken = result[0]?.transcript ?? "";
        if (result.isFinal) {
          liveFinalRef.current = `${liveFinalRef.current} ${spoken}`.trim();
        } else {
          interimText += spoken;
        }
      }
      setLiveTranscript(
        `${liveFinalRef.current}${interimText ? ` ${interimText}` : ""}`.trim(),
      );
    };
    recognition.onerror = (event) => {
      // Permanent failures end the live preview; transient ones are retried
      // automatically when the recognizer ends. The final Whisper transcript
      // always remains the authoritative source of truth.
      if (
        [
          "not-allowed",
          "service-not-allowed",
          "language-not-supported",
          "network",
        ].includes(event.error)
      ) {
        liveRecognitionActiveRef.current = false;
        setLiveTranscriptSupported(false);
      }
    };
    recognition.onend = () => {
      if (!liveRecognitionActiveRef.current) return;
      try {
        recognition.start();
      } catch {
        liveRecognitionActiveRef.current = false;
        setLiveTranscriptSupported(false);
      }
    };
    liveRecognitionRef.current = recognition;
    liveRecognitionActiveRef.current = true;
    setLiveTranscriptSupported(true);
    try {
      recognition.start();
    } catch {
      liveRecognitionActiveRef.current = false;
      setLiveTranscriptSupported(false);
    }
  }

  function stopLiveTranscription() {
    liveRecognitionActiveRef.current = false;
    const recognition = liveRecognitionRef.current;
    liveRecognitionRef.current = null;
    if (!recognition) return;
    try {
      recognition.onend = null;
      recognition.stop();
    } catch {
      // The recognizer may already be stopped.
    }
  }

  async function startRecording() {
    setMessage("");
    setTranscript("");
    setLiveTranscript("");
    setLiveTranscriptSupported(false);
    setTranscription(null);
    setExtraction(null);
    setClarificationState("idle");
    setClarificationHistory([]);
    setSubmissionState("idle");
    setSubmittedTransaction(null);
    setConfirmationOutcome(null);
    clientRequestIdRef.current = null;

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setMessage("This browser does not support microphone recording.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
      ];
      const mimeType = preferredTypes.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => void processRecording(recorder.mimeType);
      recorder.start(250);
      setVoiceState("recording");
      setLiveTranscript("");
      startLiveTranscription();
    } catch {
      setMessage(
        "Microphone access was not available. Check the browser permission and try again.",
      );
    }
  }

  function stopRecording() {
    stopLiveTranscription();
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      setVoiceState("transcribing");
    }
  }

  async function processRecording(mimeType: string) {
    const recording = new Blob(chunksRef.current, {
      type: mimeType || "audio/webm",
    });
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setLiveTranscript("");

    try {
      const result = await transcribeAudio(recording);
      setTranscription(result);
      setTranscript(result.text);
      if (!result.text) {
        setVoiceState("review");
        setMessage("No clear speech was detected. Record again in a quieter area.");
        return;
      }
      await runExtraction(result.text.trim(), result.evidenceId);
    } catch {
      setVoiceState("idle");
      setMessage(
        "Transcription was not available. Check the speech service and try again.",
      );
    }
  }

  function resetVoice() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
    streamRef.current = null;
    chunksRef.current = [];
    stopLiveTranscription();
    setLiveTranscript("");
    setLiveTranscriptSupported(false);
    setVoiceState("idle");
    setTranscript("");
    setTranscription(null);
    setExtraction(null);
    setClarificationState("idle");
    setClarificationHistory([]);
    setSubmissionState("idle");
    setSubmittedTransaction(null);
    setConfirmationOutcome(null);
    setEvidencePreview(null);
    setEvidenceFile(null);
    setEvidenceMessage("");
    setEvidenceAttached(false);
    clientRequestIdRef.current = null;
    setMessage("");
    window.speechSynthesis?.cancel();
  }

  function prepareEvidencePhoto(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setEvidenceMessage("Only JPEG, PNG and WebP images are accepted.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setEvidenceMessage("The photo must be 8 MB or smaller.");
      return;
    }
    setEvidenceMessage("");
    setEvidenceAttached(false);
    setEvidenceFile(file);
    const reader = new FileReader();
    reader.onload = () => setEvidencePreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function uploadEvidencePhoto() {
    if (!submittedTransaction || !evidenceFile) return;
    setEvidenceUploading(true);
    setEvidenceMessage("");
    try {
      await uploadTransactionEvidence(submittedTransaction.id, evidenceFile, evidenceFile.name);
      setEvidencePreview(null);
      setEvidenceFile(null);
      setEvidenceMessage("Photo evidence attached to the update. The manager will see it during review.");
      setEvidenceAttached(true);
    } catch (error) {
      setEvidenceMessage(
        error instanceof Error ? error.message : "The photo could not be uploaded.",
      );
    } finally {
      setEvidenceUploading(false);
    }
  }

  function speakClarificationQuestion(
    question = activeClarificationQuestion,
  ) {
    if (!question || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const spokenQuestion = question === "Which inventory action did you perform?"
      ? `${question} Please say receive, ship, transfer, cycle count, or damage.`
      : question;
    window.speechSynthesis.speak(createGuidanceUtterance(spokenQuestion));
  }

  function applyActiveTaskContext(result: InventoryExtraction) {
    if (!activeVoiceTask) return result;

    const taskAction: NonNullable<InventoryExtraction["fields"]["action"]> =
      activeVoiceTask.type === "RECEIVE"
        ? "RECEIVE"
        : ["PICK", "SHIP"].includes(activeVoiceTask.type)
          ? "SHIP"
          : activeVoiceTask.type === "TRANSFER"
              ? "TRANSFER"
              : ["DAMAGE", "DAMAGE_INSPECTION"].includes(activeVoiceTask.type)
                ? "DAMAGE"
                : "CYCLE_COUNT";
    const product = activeVoiceTask.product ?? result.fields.product;
    // A reservation shipment task carries a planned quantity, but the worker
    // states the quantity they actually shipped (partial shipments ship less
    // than the task quantity). The spoken quantity wins when the AI extracted
    // one; the task quantity is only the fallback so a confident statement is
    // never overwritten and a missing one never blocks confirmation.
    const quantity =
      activeVoiceTask.type === "SHIP"
        ? (result.fields.quantity ?? activeVoiceTask.quantity ?? null)
        : activeVoiceTask.quantity ?? result.fields.quantity;
    const sourceLocation =
      taskAction === "RECEIVE"
        ? result.fields.sourceLocation
        : activeVoiceTask.sourceLocation ??
          activeVoiceTask.location ??
          result.fields.sourceLocation;
    const destinationLocation =
      taskAction === "RECEIVE"
        ? activeVoiceTask.location ?? result.fields.destinationLocation
        : activeVoiceTask.destinationLocation ?? result.fields.destinationLocation;
    const trustedFields = new Set<string>(["action"]);
    if (activeVoiceTask.product) trustedFields.add("product");
    if (
      activeVoiceTask.type !== "SHIP" &&
      activeVoiceTask.quantity !== null &&
      activeVoiceTask.quantity !== undefined
    ) {
      trustedFields.add("quantity");
    }
    if (activeVoiceTask.sourceLocation) trustedFields.add("sourceLocation");
    if (activeVoiceTask.destinationLocation) trustedFields.add("destinationLocation");
    if (activeVoiceTask.location) {
      trustedFields.add(taskAction === "RECEIVE" ? "destinationLocation" : "sourceLocation");
    }

    const missingFields: string[] = [];
    if (!product) missingFields.push("product");
    if (quantity === null) missingFields.push("quantity");
    if (taskAction === "RECEIVE") {
      if (!destinationLocation) missingFields.push("destinationLocation");
    } else if (taskAction === "TRANSFER") {
      if (!sourceLocation) missingFields.push("sourceLocation");
      if (!destinationLocation) missingFields.push("destinationLocation");
    } else if (!sourceLocation) {
      missingFields.push("sourceLocation");
    }

    const lowConfidenceFields = result.lowConfidenceFields.filter(
      (field) => !trustedFields.has(field) && !missingFields.includes(field),
    );
    const fieldsNeedingClarification = [
      ...new Set([...missingFields, ...lowConfidenceFields]),
    ];
    const questions: Record<string, string> = {
      action: "Which inventory action did you perform?",
      product: "Which item does this update apply to?",
      quantity: "What quantity should be recorded?",
      sourceLocation: "Which location did the stock come from?",
      destinationLocation: "Where did you place the received stock?",
    };
    const fieldConfidence = {
      ...result.fieldConfidence,
      action: 1,
      product: activeVoiceTask.product ? 1 : result.fieldConfidence.product,
      quantity:
        activeVoiceTask.type === "SHIP"
          ? result.fields.quantity !== null && result.fields.quantity !== undefined
            ? result.fieldConfidence.quantity
            : activeVoiceTask.quantity !== null && activeVoiceTask.quantity !== undefined
              ? 1
              : result.fieldConfidence.quantity
          : activeVoiceTask.quantity !== null && activeVoiceTask.quantity !== undefined
            ? 1
            : result.fieldConfidence.quantity,
      sourceLocation:
        (activeVoiceTask.sourceLocation || activeVoiceTask.location) && taskAction !== "RECEIVE"
          ? 1
          : result.fieldConfidence.sourceLocation,
      destinationLocation:
        (activeVoiceTask.destinationLocation || activeVoiceTask.location) &&
        (taskAction === "RECEIVE" || taskAction === "TRANSFER")
          ? 1
          : result.fieldConfidence.destinationLocation,
    };
    const requiredConfidence = [
      fieldConfidence.action,
      fieldConfidence.product,
      fieldConfidence.quantity,
      ...(taskAction === "TRANSFER"
        ? [fieldConfidence.sourceLocation, fieldConfidence.destinationLocation]
        : taskAction === "RECEIVE"
          ? [fieldConfidence.destinationLocation]
          : [fieldConfidence.sourceLocation]),
    ];

    return {
      ...result,
      readyForConfirmation: fieldsNeedingClarification.length === 0,
      requiresManagerReview: ["CYCLE_COUNT", "DAMAGE"].includes(taskAction),
      confidence: Number(
        (
          requiredConfidence.reduce((sum, value) => sum + value, 0) /
          requiredConfidence.length
        ).toFixed(3),
      ),
      missingFields,
      lowConfidenceFields,
      clarificationQuestions: fieldsNeedingClarification.map(
        (field) => questions[field],
      ),
      fields: {
        ...result.fields,
        action: taskAction,
        product,
        quantity,
        sourceLocation,
        destinationLocation,
      },
      fieldConfidence,
    };
  }

  function applySelectedWorkflowContext(result: InventoryExtraction) {
    if (!selectedWorkflow || activeVoiceTask) return result;
    const selectedAction: NonNullable<
      InventoryExtraction["fields"]["action"]
    > =
      selectedWorkflow === "RECEIVE"
        ? "RECEIVE"
        : selectedWorkflow === "TRANSFER"
          ? "TRANSFER"
          : selectedWorkflow === "CYCLE_COUNT"
            ? "CYCLE_COUNT"
            : selectedWorkflow === "SHIP"
              ? "SHIP"
              : "DAMAGE";

    const missingFields = result.missingFields.filter(
      (field) => field !== "action",
    );
    const lowConfidenceFields = result.lowConfidenceFields.filter(
      (field) => field !== "action",
    );
    const unresolved = [...new Set([...missingFields, ...lowConfidenceFields])];
    const questions: Record<string, string> = {
      product: "Which item does this update apply to?",
      quantity: "What quantity should be recorded?",
      sourceLocation: "Which location did the stock come from?",
      destinationLocation: "Where did you place the received stock?",
    };

    return {
      ...result,
      readyForConfirmation: unresolved.length === 0,
      requiresManagerReview: ["CYCLE_COUNT", "DAMAGE"].includes(
        selectedAction,
      ),
      missingFields,
      lowConfidenceFields,
      clarificationQuestions: unresolved.map((field) => questions[field]),
      fields: { ...result.fields, action: selectedAction },
      fieldConfidence: { ...result.fieldConfidence, action: 1 },
    };
  }

  async function runExtraction(
    reviewedTranscript: string,
    evidenceId = transcription?.evidenceId,
  ) {
    setVoiceState("extracting");
    setMessage("");
    try {
      const workflowHints = { RECEIVE: "RECEIVE", SHIP: "SHIP", TRANSFER: "TRANSFER", CYCLE_COUNT: "CYCLE COUNT", DAMAGE: "DAMAGE" };
      const extractedResult = await extractInventoryDetails({
        transcript: selectedWorkflow ? `Selected workflow: ${workflowHints[selectedWorkflow]}. Worker statement: ${reviewedTranscript}` : reviewedTranscript,
        evidenceId,
      });
      const result = applyActiveTaskContext(
        applySelectedWorkflowContext(extractedResult),
      );
      setExtraction(result);
      setVoiceState("extracted");
      if (!result.readyForConfirmation) {
        speakClarificationQuestion(result.clarificationQuestions[0]);
      }
      setMessage(
        result.readyForConfirmation
          ? "Details are complete and ready for Warehouse Executive confirmation. No inventory stock was changed."
          : "The AI needs more information before this can be confirmed.",
      );
    } catch {
      setVoiceState("review");
      setMessage(
        "AI extraction was not available. Check Ollama and try again.",
      );
    }
  }

  async function saveTranscript() {
    if (!transcript.trim()) {
      setMessage("Enter or record a transcript before continuing.");
      return;
    }
    await runExtraction(transcript.trim());
  }

  function speakProposal() {
    if (!extraction?.readyForConfirmation) return;
    const fields = extraction.fields;
    const location =
      fields.sourceLocation?.name ?? fields.destinationLocation?.name ?? "";
    const statement = [
      `Action: ${formatAction(fields.action)}.`,
      fields.product ? `Item: ${fields.product.name}.` : "",
      fields.quantity === null
        ? ""
        : `Quantity: ${fields.quantity} ${fields.product?.unit ?? "units"}.`,
      location ? `Location: ${location}.` : "",
      `Condition: ${fields.condition.toLowerCase()}.`,
      "Please confirm this inventory update.",
    ]
      .filter(Boolean)
      .join(" ");
    window.speechSynthesis?.cancel();
    window.speechSynthesis?.speak(createGuidanceUtterance(statement));
  }

  async function confirmProposal() {
    if (!extraction?.readyForConfirmation) return;
    if (insufficientStockNotice) {
      setMessage(
        `Insufficient available stock. Requested ${insufficientStockNotice.requested}; available ${insufficientStockNotice.available}. Correct the quantity before confirming.`,
      );
      return;
    }
    setMessage("");
    try {
      let transaction = submittedTransaction;
      if (!transaction) {
        setSubmissionState("creating");
        clientRequestIdRef.current ??= `voice-${crypto.randomUUID()}`;
        // A recount task keeps its link to the original discrepancy case: the
        // transaction is created with the task id so the backend resolves the
        // original case instead of creating an unrelated duplicate.
        const recountTaskId =
          activeVoiceTask?.type === "RECOUNT" && activeVoiceTask.source === "ASSIGNED"
            ? activeVoiceTask.id
            : undefined;
        // A reservation shipment task links its Ship transaction to the task so
        // the backend applies the reservation-aware movement (on-hand AND
        // reserved decrease together) instead of a plain Ship.
        const shipmentTaskId =
          activeVoiceTask?.type === "SHIP" && activeVoiceTask.source === "ASSIGNED"
            ? activeVoiceTask.id
            : undefined;
        transaction = await createPendingInventoryTransaction(
          extraction,
          clientRequestIdRef.current,
          recountTaskId,
          shipmentTaskId,
        );
        setSubmittedTransaction(transaction);
      }
      setSubmissionState("confirming");
      const result = await confirmInventoryTransaction(transaction.id);
      setSubmittedTransaction(result.transaction);
      setConfirmationOutcome(result.outcome);
      setSubmissionState("complete");
      setSnapshot(await fetchInventorySnapshot());
      let taskCompletionMessage = "";
      if (activeVoiceTask) {
        if (activeVoiceTask.source === "ASSIGNED") {
          if (activeVoiceTask.type === "RECOUNT" || activeVoiceTask.type === "SHIP") {
            // The backend completes the linked task atomically while
            // confirming the result (a matching recount posts and closes the
            // case; a shipment posts and advances the reservation), so the
            // worker queue is refreshed here instead of completing the task a
            // second time.
            try {
              setAssignedTasks(await fetchInventoryTasks());
              taskCompletionMessage = ` Task “${activeVoiceTask.title}” is now complete.`;
              setActiveVoiceTask(null);
            } catch {
              taskCompletionMessage = " The inventory update was saved, but the task queue could not be refreshed. Reload the page to confirm the task is complete.";
            }
          } else {
            try {
              await completeInventoryTask(activeVoiceTask.id);
              setAssignedTasks(await fetchInventoryTasks());
              taskCompletionMessage = ` Task “${activeVoiceTask.title}” is now complete.`;
              setActiveVoiceTask(null);
            } catch {
              taskCompletionMessage = " The inventory update was saved, but the task remains in progress and can be completed after the task service reconnects.";
            }
          }
        } else {
          taskCompletionMessage = " The requested recount was submitted and will remain visible until the manager reviews it.";
          setActiveVoiceTask(null);
        }
      }
      setMessage(`${
        result.outcome === "POSTED"
          ? "Warehouse Executive confirmation complete. The validated stock movement was posted."
          : "Warehouse Executive confirmation complete. No stock changed; this transaction is waiting for manager review."
      }${taskCompletionMessage}`);
    } catch (error) {
      const networkUnavailable =
        !navigator.onLine || error instanceof TypeError;
      if (networkUnavailable) {
        try {
          clientRequestIdRef.current ??= `voice-${crypto.randomUUID()}`;
          await enqueueOfflineInventoryUpdate({
            ownerId: keycloak.subject ?? "local-worker",
            clientRequestId: clientRequestIdRef.current,
            extraction,
          });
          setSubmissionState("complete");
          setConfirmationOutcome(null);
          setMessage(
            "Update saved safely on this device. No stock changed. It will synchronize automatically when the connection returns.",
          );
          return;
        } catch {
          setSubmissionState("idle");
          setMessage(
            "The connection is offline and this device could not save the update. Keep this page open and try again.",
          );
          return;
        }
      }
      setSubmissionState("idle");
      const reason =
        error instanceof Error && error.message
          ? error.message
          : "The transaction could not be confirmed.";
      setMessage(
        `The transaction could not be confirmed. ${reason} Review the details and try again.`,
      );
    }
  }

  async function startClarificationRecording() {
    if (!activeClarificationQuestion) return;
    setMessage("");
    window.speechSynthesis?.cancel();

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setMessage("This browser does not support microphone recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
      ];
      const mimeType = preferredTypes.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () =>
        void processClarificationRecording(recorder.mimeType);
      recorder.start(250);
      setClarificationState("recording");
      setLiveTranscript("");
      startLiveTranscription();
    } catch {
      setMessage(
        "Microphone access was not available. Check the browser permission and try again.",
      );
    }
  }

  function stopClarificationRecording() {
    stopLiveTranscription();
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      setClarificationState("transcribing");
    }
  }

  async function processClarificationRecording(mimeType: string) {
    const recording = new Blob(chunksRef.current, {
      type: mimeType || "audio/webm",
    });
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setLiveTranscript("");
    const question = activeClarificationQuestion;

    try {
      const answer = await transcribeAudio(recording, { language: "en" });
      const spokenAnswer = answer.text.trim();
      if (!spokenAnswer) {
        setClarificationState("idle");
        setMessage("No clear answer was detected. Please answer again.");
        return;
      }

      setClarificationState("processing");
      const targetField =
        extraction?.missingFields[0] ??
        extraction?.lowConfidenceFields[0] ??
        "";
      const contextTranscript = extraction?.transcript ?? transcript;
      const refinedResult = await extractInventoryDetails({
        transcript: `${contextTranscript}\nClarification answer to "${question}": ${spokenAnswer}.`,
        evidenceId: transcription?.evidenceId,
      });
      const refined = applyActiveTaskContext(
        applySelectedWorkflowContext(refinedResult),
      );
      const unresolvedFields = new Set([
        ...refined.missingFields,
        ...refined.lowConfidenceFields,
      ]);
      const interpretedAnswer = formatClarificationValue(
        targetField,
        refined,
      );
      if (
        !targetField ||
        unresolvedFields.has(targetField) ||
        !interpretedAnswer
      ) {
        setClarificationState("idle");
        setMessage(
          `I heard “${spokenAnswer}”, but could not match it confidently. ${clarificationRetryHelp(targetField)}`,
        );
        speakClarificationQuestion(question);
        return;
      }

      setClarificationHistory((history) => [
        ...history,
        {
          question,
          rawAnswer: spokenAnswer,
          interpretedAnswer,
        },
      ]);
      setExtraction(refined);
      setClarificationState("idle");

      if (refined.readyForConfirmation) {
        setMessage(
          "All required details are complete and ready for Warehouse Executive confirmation. No inventory stock was changed.",
        );
      } else {
        setMessage(
          "Your answer was saved. Please answer only the next missing detail.",
        );
        speakClarificationQuestion(refined.clarificationQuestions[0]);
      }
    } catch {
      setClarificationState("idle");
      setMessage(
        "The clarification answer could not be processed. Please try again.",
      );
    }
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekFilteredTransactions = snapshot
    ? snapshot.transactions.filter(
        (transaction) =>
          historyRange === "ALL" ||
          new Date(transaction.createdAt) >= weekStart,
      )
    : [];
  const allWorkerTransactions = snapshot
    ? mapTransactions(
        weekFilteredTransactions,
        historyRange === "ALL" ? 200 : 100,
        historyRange === "ALL",
      )
    : [];
  const pendingHistoryStatuses = ["Pending", "Recount requested"];
  const managerReviewHistoryTypes = ["Cycle count", "Damage"];
  const displayedTransactions = allWorkerTransactions.filter((transaction) =>
    historyView === "PENDING"
      ? pendingHistoryStatuses.includes(transaction.status) &&
        managerReviewHistoryTypes.includes(transaction.type)
      : !pendingHistoryStatuses.includes(transaction.status),
  );
  const weekPostedCount = weekFilteredTransactions.filter(
    (transaction) => transaction.status === "POSTED",
  ).length;
  const weekPendingCount = weekFilteredTransactions.filter((transaction) =>
    ["PENDING", "RECOUNT_REQUESTED"].includes(transaction.status),
  ).length;
  const completedAssignedTasks = assignedTasks.filter(
    (task) => task.status === "COMPLETED",
  );
  const historySubtitle = snapshot
    ? historyRange === "WEEK"
      ? `${weekFilteredTransactions.length} update${weekFilteredTransactions.length === 1 ? "" : "s"} in the last 7 days · ${weekPostedCount} posted · ${weekPendingCount} waiting for review`
      : "Live data from the inventory database"
    : "Preview data until the inventory API is available";
  const todayKey = new Date().toDateString();
  const todayTransactions = snapshot
    ? snapshot.transactions.filter(
        (transaction) =>
          new Date(transaction.createdAt).toDateString() === todayKey,
      )
    : [];
  // The assigned task list is the source of truth for the worker queue. A
  // transaction keeps RECOUNT_REQUESTED in its audit history forever, so a
  // fallback card is only derived from transaction history when a genuinely
  // open recount task is linked to that transaction (via sourceTransactionId).
  // Completed or cancelled recounts never reappear, and when the task API is
  // unavailable the queue shows a refresh error instead of recreating
  // completed work from history.
  const openLinkedRecountTaskIds = new Set(
    assignedTasks
      .filter(
        (task) =>
          task.type === "RECOUNT" &&
          (task.status === "OPEN" || task.status === "IN_PROGRESS") &&
          task.sourceTransactionId,
      )
      .map((task) => task.sourceTransactionId),
  );
  const transactionTasks =
    snapshot && !taskLoadError
      ? snapshot.transactions
          .filter(
            (transaction) =>
              transaction.status === "RECOUNT_REQUESTED" &&
              openLinkedRecountTaskIds.has(transaction.id),
          )
          .map((transaction) => {
            // Fallback cards carry the linked task id so starting them keeps
            // the recount attached to the original case (never a duplicate).
            const linkedTask = assignedTasks.find(
              (task) => task.sourceTransactionId === transaction.id,
            );
            return {
              id: linkedTask?.id ?? transaction.id,
              title: `Recount ${transaction.product.name}`,
              detail: `${
                transaction.sourceLocation?.name ??
                transaction.destinationLocation?.name ??
                "Location not provided"
              } · ${transaction.quantity} ${transaction.product.unit}`,
              note:
                transaction.reviewNotes ??
                "A manager requested a new physical count.",
              urgent: true,
              type: "RECOUNT",
              dueAt: null as string | null,
            };
          })
      : [];
  const automaticTasks = assignedTasks.filter((task) => ["OPEN", "IN_PROGRESS"].includes(task.status)).map((task) => {
    const linkedCase = task.discrepancies?.[0] ?? null;
    const shipment = task.type === "SHIP" && task.reservationId
      ? {
          shipmentReference: task.shipmentReference ?? undefined,
          reservationReference: task.reservation?.request?.referenceNumber ?? undefined,
        }
      : {};
    return {
      id: task.id, title: task.title,
      type: task.type,
      dueAt: task.dueAt ?? null,
      detail: task.type === "TRANSFER"
        ? `${task.quantity ?? 0} ${task.product?.unit ?? "unit"} · ${task.sourceLocation?.name ?? "Source missing"} → ${task.destinationLocation?.name ?? "Destination missing"}${task.product ? ` · ${task.product.name}` : ""}`
        : task.type === "SHIP" && task.reservationId
          ? `${task.quantity ?? 0} ${task.product?.unit ?? "unit"} · ${task.sourceLocation?.name ?? "Location not provided"}${task.product ? ` · ${task.product.name}` : ""}${task.reservation?.request?.referenceNumber ? ` · Order ${task.reservation.request.referenceNumber}` : ""}`
          : `${task.location?.name ?? "Location not provided"}${task.product ? ` · ${task.product.name}` : ""}`,
      note: task.description ?? "Assigned inventory work.",
      urgent: task.priority === "HIGH" || task.priority === "URGENT",
      status: task.status, automatic: true,
      ...shipment,
      caseNumber: linkedCase?.caseNumber ?? undefined,
      caseExpected: linkedCase?.expectedQuantity ?? undefined,
      caseCounted: linkedCase?.countedQuantity ?? undefined,
      caseDifference: linkedCase?.differenceQuantity ?? undefined,
      planNumber: task.cycleCountPlan?.planNumber,
      planTitle: task.cycleCountPlan?.title,
      planCompleted: task.cycleCountPlan?.tasks?.filter((entry) => entry.status === "COMPLETED").length,
      planTotal: task.cycleCountPlan?.tasks?.length,
      blindCount: task.cycleCountPlan?.blindCount,
    };
  });
  const workerTasks = [...automaticTasks, ...transactionTasks.filter((candidate) => !automaticTasks.some((task) => task.title === candidate.title)).map((task) => ({ ...task, status: "WAITING", automatic: false }))];
  useEffect(() => {
    onPendingTaskCountChange?.(workerTasks.length);
  }, [onPendingTaskCountChange, workerTasks.length]);
  function taskWorkflow(type: string) {
    if (type === "RECEIVE") return "RECEIVE" as const;
    if (type === "PICK" || type === "SHIP") return "SHIP" as const;
    if (type === "TRANSFER") return "TRANSFER" as const;
    return "CYCLE_COUNT" as const;
  }
  async function startAssignedTask(taskId: string) {
    setTaskActionId(taskId);
    try {
      await startInventoryTask(taskId);
      setAssignedTasks(await fetchInventoryTasks());
      setMessage("Task started. Complete it after the physical work is done.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The task could not be started.");
    } finally {
      setTaskActionId(null);
    }
  }
  async function completeAssignedTask(taskId: string) {
    setTaskActionId(taskId);
    try {
      await completeInventoryTask(taskId);
      const [tasks, inventory] = await Promise.all([fetchInventoryTasks(), fetchInventorySnapshot()]);
      setAssignedTasks(tasks);
      setSnapshot(inventory);
      setMessage("Shipment task completed. Stock was posted and the reservation was updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The shipment could not be completed.");
    } finally {
      setTaskActionId(null);
    }
  }
  async function openTaskInVoice(taskId: string) {
    const task = assignedTasks.find((candidate) => candidate.id === taskId);
    if (!task) return;
    setTaskActionId(taskId);
    try {
      if (task.status === "OPEN") await startInventoryTask(taskId);
      const refreshedTasks = await fetchInventoryTasks();
      setAssignedTasks(refreshedTasks);
      const refreshedTask = refreshedTasks.find((candidate) => candidate.id === taskId) ?? task;
      setActiveVoiceTask({
        id: refreshedTask.id,
        title: refreshedTask.title,
        type: refreshedTask.type,
        description: refreshedTask.description,
        product: refreshedTask.product,
        location: refreshedTask.location,
        quantity: refreshedTask.quantity,
        sourceLocation: refreshedTask.sourceLocation,
        destinationLocation: refreshedTask.destinationLocation,
        shipmentReference: refreshedTask.shipmentReference,
        reservationReference: refreshedTask.reservation?.request?.referenceNumber,
        source: "ASSIGNED",
      });
      resetVoice();
      setSelectedWorkflow(taskWorkflow(task.type));
      setMessage(task.type === "TRANSFER"
        ? `Transfer task loaded. Confirm the assigned move from ${refreshedTask.sourceLocation?.name ?? "the source"} to ${refreshedTask.destinationLocation?.name ?? "the destination"} by voice.`
        : `Task loaded. Speak the actual quantity and any condition or reference required for “${task.title}”.`);
      onNavigate("Voice entry");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) { setMessage(error instanceof Error ? error.message : "Task status could not be updated."); }
    finally { setTaskActionId(null); }
  }
  function openRecountInVoice(taskId: string) {
    // Fallback recount cards only exist while a genuinely open linked recount
    // task is present, and carry that task's id. Opening the task keeps the
    // new count linked to the original case, so no duplicate discrepancy or
    // recount task is ever created and completed work is never replayed.
    const task = assignedTasks.find((candidate) => candidate.id === taskId);
    if (!task || !["OPEN", "IN_PROGRESS"].includes(task.status)) {
      setMessage(
        "The recount task could not be loaded. Refresh the page and try again.",
      );
      return;
    }
    void openTaskInVoice(task.id);
  }
  const cycleCountsToday = todayTransactions.filter(
    (transaction) => transaction.action === "CYCLE_COUNT",
  ).length;
  const postedToday = todayTransactions.filter(
    (transaction) => transaction.status === "POSTED",
  ).length;
  const cycleCountTransactions = todayTransactions.filter(
    (transaction) => transaction.action === "CYCLE_COUNT",
  );
  const postedTransactions = todayTransactions.filter(
    (transaction) => transaction.status === "POSTED",
  );
  const metricPageTransactions = page === "My transactions"
    ? todayTransactions
    : page === "Cycle counts"
      ? cycleCountTransactions
      : page === "Posted today"
        ? postedTransactions
        : [];
  const metricPageTitle = page === "My transactions"
    ? "Transactions created today"
    : page === "Cycle counts"
      ? "Cycle counts submitted today"
      : "Validated transactions posted today";
  async function handleCancelTransaction(transaction: ApiTransaction) {
    if (!window.confirm(
      `Cancel TX-${transaction.id.slice(0, 8).toUpperCase()} (${transaction.action} ${transaction.quantity} ${transaction.product.name})? No stock has changed yet, and the record will be marked as cancelled.`,
    )) return;
    setCancellingTransactionId(transaction.id);
    setMessage("");
    try {
      await cancelInventoryTransaction(transaction.id);
      setSnapshot(await fetchInventorySnapshot());
      setMessage(
        `TX-${transaction.id.slice(0, 8).toUpperCase()} was cancelled. No stock was changed.`,
      );
    } catch {
      setMessage(
        "The transaction could not be cancelled. Refresh and try again.",
      );
    } finally {
      setCancellingTransactionId(null);
    }
  }
  const insufficientStockNotice = extraction
    ? (() => {
        const { action, product, quantity, sourceLocation } = extraction.fields;
        if (!action || !product || quantity === null || !sourceLocation) return null;
        if (!STOCK_OUT_ACTIONS.has(action)) return null;
        const balance = snapshot?.balances.find(
          (candidate) =>
            candidate.product.id === product.id &&
            candidate.location.id === sourceLocation.id,
        );
        const available = balance ? Math.max(0, balance.quantity - balance.reservedQuantity) : 0;
        if (available >= quantity) return null;
        return { requested: quantity, available };
      })()
    : null;
  function formatLocationWithSource(
    location: { name: string } | null,
    source: string | null | undefined,
  ): string {
    if (!location) return "Not required / missing";
    if (source === "RECEIVING_DEFAULT") {
      return `${location.name} — selected automatically`;
    }
    if (source === "WORKER_ZONE") {
      return `${location.name} — your assigned zone`;
    }
    return location.name;
  }

  const extractedDetails = extraction
    ? [
        [
          "Action",
          extraction.fields.action?.replaceAll("_", " ") ?? "Not identified",
        ],
        [
          "Item name",
          extraction.fields.product
            ? `${extraction.fields.product.name} (${extraction.fields.product.sku})`
            : "Not identified",
        ],
        [
          "Number",
          extraction.fields.quantity === null
            ? "Not identified"
            : `${extraction.fields.quantity} ${extraction.fields.product?.unit ?? "units"}`,
        ],
        [
          "From shelf",
          formatLocationWithSource(
            extraction.fields.sourceLocation,
            extraction.sourceLocationSource,
          ),
        ],
        [
          "To shelf",
          formatLocationWithSource(
            extraction.fields.destinationLocation,
            extraction.destinationLocationSource,
          ),
        ],
        ["Item condition", extraction.fields.condition],
        [
          "Order or reference",
          extraction.fields.referenceNumber ?? "Not provided",
        ],
      ]
    : [];
  const activeTaskExample = activeVoiceTask
    ? (() => {
        const item = activeVoiceTask.product?.name ?? "the item";
        const place = activeVoiceTask.location?.name ?? "the shelf";
        if (activeVoiceTask.type === "RECEIVE") return "I received [number].";
        if (activeVoiceTask.type === "SHIP") {
          const order = activeVoiceTask.reservationReference ? ` for Order ${activeVoiceTask.reservationReference}` : "";
          return `I shipped [number] ${item} from ${activeVoiceTask.sourceLocation?.name ?? place}${order}.`;
        }
        if (activeVoiceTask.type === "PICK") return `I shipped [number] ${item} from ${place}.`;
        if (activeVoiceTask.type === "TRANSFER") return `I transferred ${activeVoiceTask.quantity ?? "[number]"} ${item} from ${activeVoiceTask.sourceLocation?.name ?? "the source"} to ${activeVoiceTask.destinationLocation?.name ?? "the destination"}.`;
        if (["DAMAGE", "DAMAGE_INSPECTION"].includes(activeVoiceTask.type)) return `I found [number] damaged ${item} on ${place}.`;
        return "I counted [number].";
      })()
    : "";

  async function checkMicrophoneAccess() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicrophoneStatus("Microphone is not supported in this browser");
      return;
    }
    setMicrophoneStatus("Checking…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicrophoneStatus("Microphone is ready");
    } catch {
      setMicrophoneStatus("Permission is blocked — allow microphone access in the browser");
    }
  }

  function testSpeaker() {
    if (!("speechSynthesis" in window)) {
      setSpeakerStatus("Speaker test is not supported in this browser");
      return;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(createGuidanceUtterance("Inventory Management voice guidance is working. Which inventory action did you perform?"));
    setSpeakerStatus("Test message played");
  }

  // Route to page components for non-voice-entry pages
  if (page === "Home" || page === "Overview") {
    return (
      <ExecutiveHome
        workerName={workerName}
        workerGreeting={workerGreeting}
        clockNow={clockNow}
        snapshot={snapshot}
        todayTransactions={todayTransactions}
        cycleCountsToday={cycleCountsToday}
        postedToday={postedToday}
        workerTasks={workerTasks}
        onNavigate={onNavigate}
        onStartVoiceWorkflow={startWorkflowFromHome}
        newTaskAlert={newTaskAlert}
        setNewTaskAlert={setNewTaskAlert}
      />
    );
  }

  if (page === "Task queue") {
    return (
      <ExecutiveTaskQueue
        workerTasks={workerTasks}
        taskActionId={taskActionId}
        lastTaskRefresh={lastTaskRefresh}
        completedAssignedTasks={completedAssignedTasks.length}
        taskLoadError={taskLoadError}
        message={message}
        onRefreshTasks={() => void refreshWorkerQueue()}
        onOpenTask={openTaskInVoice}
        onStartTask={(taskId) => void startAssignedTask(taskId)}
        onCompleteTask={(taskId) => void completeAssignedTask(taskId)}
        onOpenRecount={openRecountInVoice}
        onBack={() => { onNavigate("Home"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
      />
    );
  }

  if (page === "History") {
    const reviewActions = ["Cycle count", "Damage"];
    const pendingTxs = allWorkerTransactions.filter(
      (transaction) =>
        ["Pending", "Recount requested"].includes(transaction.status) &&
        reviewActions.includes(transaction.type),
    );
    const completedTxs = allWorkerTransactions.filter(
      (transaction) =>
        !["Pending", "Recount requested"].includes(transaction.status) ||
        !reviewActions.includes(transaction.type),
    );
    return (
      <ExecutiveHistory
        pendingTransactions={pendingTxs}
        completedTransactions={completedTxs}
        offlineQueueCount={pendingSyncCount ?? 0}
        deletingTransactionId={cancellingTransactionId}
        actionMessage={message}
        onDeletePending={(transactionId) => {
          const transaction = snapshot?.transactions.find(
            (candidate) =>
              `TX-${candidate.id.slice(0, 8).toUpperCase()}` === transactionId,
          );
          if (transaction) {
            void handleCancelTransaction(transaction);
            return;
          }
          setMessage(
            "The pending transaction could not be found. Refresh the page and try again.",
          );
        }}
        onBack={() => { onNavigate("Home"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
      />
    );
  }

  if (page === "Settings") {
    return (
      <ExecutiveSettings
        workerName={workerName}
        isOnline={isOnline ?? true}
        pendingSyncCount={pendingSyncCount ?? 0}
        syncState={syncState ?? "idle"}
        microphoneStatus={microphoneStatus}
        speakerStatus={speakerStatus}
        onCheckMicrophone={() => void checkMicrophoneAccess()}
        onTestSpeaker={testSpeaker}
        onSignOut={() => onSignOut?.()}
        onBack={() => { onNavigate("Home"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
      />
    );
  }

  return (
    <div className="dashboard-content page-dashboard worker-dashboard" data-active-page={page}>
      <div id="worker-overview" className="space-y-6">
        <section id="worker-overview-hero" className="hero-3d relative overflow-hidden rounded-[26px] border border-[#d9e6f8] p-6 text-white sm:p-7">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[48px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[#6ea5ff]/30 blur-3xl" />
          <div className="pointer-events-none absolute right-1/3 top-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#c4d8ff] backdrop-blur">
                <Sparkles size={13} />
                {new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(clockNow)}
              </div>
              <h1 className="mt-3 text-[24px] font-extrabold tracking-[-0.03em] sm:text-[30px]">
                {workerGreeting}, {workerName}
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm font-semibold leading-6 text-[#c6d7f6]">
                {snapshot
                  ? workerTasks.length > 0 || postedToday > 0
                    ? `${workerTasks.length} open task${workerTasks.length === 1 ? "" : "s"} and ${postedToday} update${postedToday === 1 ? "" : "s"} posted today — pick a tool below to continue.`
                    : "Your workspace is ready — record voice updates, complete tasks and track your activity from the toolbar below."
                  : "Live inventory data is loading from the warehouse service."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                <Clock3 size={18} className="text-[#a9c6ff]" />
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#9db9ef]">Live clock</p>
                  <p className="text-sm font-extrabold tabular-nums">{new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hour12: true }).format(clockNow)}</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                <ClipboardCheck size={18} className="text-[#ffd08a]" />
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#9db9ef]">Open tasks</p>
                  <p className="text-sm font-extrabold">{workerTasks.length} waiting</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                <ShieldCheck size={18} className="text-[#9dffce]" />
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#9db9ef]">Posted today</p>
                  <p className="text-sm font-extrabold">{postedToday} updates</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="My transactions" value={String(todayTransactions.length)} detail="Created today" icon={ArrowRightLeft} onClick={() => { onNavigate("My transactions"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          <MetricCard label="Cycle counts" value={String(cycleCountsToday)} detail="Submitted today" icon={ClipboardCheck} tone="violet" onClick={() => { onNavigate("Cycle counts"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          <MetricCard label="Open tasks" value={String(workerTasks.length)} detail={workerTasks.some((task) => task.urgent) ? "Recount action required" : "No urgent recounts"} icon={Clock3} tone="amber" onClick={() => { onNavigate("Task queue"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          <MetricCard label="Posted today" value={String(postedToday)} detail="Validated inventory updates" icon={ShieldCheck} tone="green" onClick={() => { onNavigate("Posted today"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </div>

        <section id="worker-overview-command" className="rounded-[24px] border border-[#d8e5f7] bg-white p-5 shadow-[0_18px_45px_rgba(16,42,86,0.1)]">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#155eef]">Quick toolbar</p>
            <h2 className="text-lg font-extrabold text-[#102a56]">Jump to any tool in one tap</h2>
            <p className="text-xs font-semibold text-[#8294ac]">Your most-used warehouse tools, right here — no menus required.</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-8">
            {([
              ["Voice entry", "Voice entry", Mic, "from-[#155eef] to-[#4a7df0]", undefined],
              ["Task queue", "Task queue", ClipboardCheck, "from-[#7257d6] to-[#9678f2]", workerTasks.length],
              ["Active items", "Active items", Boxes, "from-[#16865b] to-[#2fa97c]", snapshot?.products.length ?? 0],
              ["My history", "My history", FileClock, "from-[#be185d] to-[#ec4899]", undefined],
              ["My transactions", "My transactions", ArrowRightLeft, "from-[#d47b08] to-[#f0a13a]", todayTransactions.length],
              ["Cycle counts", "Cycle counts", CheckCircle2, "from-[#0e7490] to-[#38bdf8]", cycleCountsToday],
              ["Posted today", "Posted today", ShieldCheck, "from-[#16865b] to-[#22aa78]", postedToday],
              ["Settings", "Settings", Settings, "from-[#455b78] to-[#6e86a5]", undefined],
              ["Overview", "Home", LayoutDashboard, "from-[#4338ca] to-[#6366f1]", undefined],
            ] as Array<[string, string, typeof Boxes, string, number | undefined]>).map(([page, label, ToolIcon, tone, count]) => (
              <button
                key={page}
                type="button"
                onClick={() => { onNavigate(page); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="group relative flex min-h-[88px] flex-col items-start justify-between rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-3 text-left transition hover:-translate-y-1 hover:border-[#b9cff0] hover:bg-white hover:shadow-[0_12px_28px_rgba(16,45,82,0.1)]"
              >
                <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-[0_8px_18px_rgba(21,94,239,0.22)] transition group-hover:scale-110`}>
                  <ToolIcon size={18} />
                </span>
                <span className="mt-2 text-xs font-extrabold text-[#24466f]">{label}</span>
                {count !== undefined && count > 0 && (
                  <span className="absolute right-2.5 top-2.5 rounded-full bg-[#fff4df] px-2 py-0.5 text-[9px] font-extrabold text-[#b36d0c]">{count}</span>
                )}
              </button>
            ))}
          </div>
        </section>
      </div>

      {["My transactions", "Cycle counts", "Posted today"].includes(page) && (
        <section id="worker-metric-details" className="overflow-hidden rounded-[24px] border border-[#d8e4f3] bg-white shadow-[0_18px_48px_rgba(16,45,82,0.08)]">
          <div className="flex flex-col gap-4 border-b border-[#e6edf6] bg-[#f7faff] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">Detailed page</p>
              <h2 className="mt-1 text-xl font-extrabold text-[#102a56]">{metricPageTitle}</h2>
              <p className="mt-1 text-xs font-semibold text-[#7b8fa9]">Every record below is included in the number shown on the Overview card.</p>
            </div>
            <button type="button" onClick={() => { onNavigate("Overview"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-4 text-xs font-extrabold text-[#155eef]">
              <ChevronDown size={16} className="rotate-90" /> Back to Overview
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead><tr className="border-b border-[#e5ebf4] text-[10px] uppercase tracking-wider text-[#8295af]"><th className="px-5 py-3">Transaction</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Item</th><th className="px-5 py-3">Quantity</th><th className="px-5 py-3">Location</th><th className="px-5 py-3">Time</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Cancel</th></tr></thead>
              <tbody>{metricPageTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-[#eef2f7] last:border-0">
                  <td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#155eef]">TX-{transaction.id.slice(0, 8).toUpperCase()}</td>
                  <td className="whitespace-nowrap px-5 py-4 font-bold text-[#496482]">{formatAction(transaction.action as InventoryExtraction["fields"]["action"])}</td>
                  <td className="whitespace-nowrap px-5 py-4 font-extrabold text-[#24466f]">{transaction.product.name}</td>
                  <td className="whitespace-nowrap px-5 py-4 font-bold text-[#29466f]">{transaction.quantity} {transaction.product.unit}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-[#6c829f]">{transaction.sourceLocation?.name ?? transaction.destinationLocation?.name ?? "—"}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-[#6c829f]">{new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(new Date(transaction.createdAt))}</td>
                  <td className="whitespace-nowrap px-5 py-4"><span className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${transaction.status === "POSTED" ? "bg-[#eaf8f1] text-[#16865b]" : transaction.status === "REJECTED" ? "bg-[#fff0f0] text-[#b83b3b]" : transaction.status === "CANCELLED" ? "bg-[#eef2f7] text-[#7b8fa9]" : "bg-[#fff5df] text-[#a8670d]"}`}>{transaction.status.replaceAll("_", " ")}</span></td>
                  <td className="whitespace-nowrap px-5 py-4">{"PENDING" === transaction.status || "RECOUNT_REQUESTED" === transaction.status ? (
                    <button type="button" disabled={cancellingTransactionId === transaction.id} onClick={() => void handleCancelTransaction(transaction)} className="rounded-lg border border-[#efb5b5] px-3 py-1.5 text-[11px] font-extrabold text-[#b83f3f] transition hover:bg-[#fff2f2] disabled:opacity-50">{cancellingTransactionId === transaction.id ? "Cancelling…" : "Cancel"}</button>
                  ) : <span className="text-[#d3dbe6]">—</span>}</td>
                </tr>
              ))}{metricPageTransactions.length === 0 && <tr><td colSpan={8} className="px-6 py-12 text-center text-sm font-semibold text-[#7b8fa9]">No matching records were found for today.</td></tr>}</tbody>
            </table>
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <section id="voice-entry" className="scroll-mt-24 overflow-hidden rounded-[24px] border border-[#dfe8f4] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.065)]">
          <div className="border-b border-[#e8edf5] px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">Voice transaction</p>
                <h2 className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-[#102a56]">{voiceCopy.title}</h2>
                <p className="mt-1 text-sm text-[#778ba8]">{voiceCopy.detail}</p>
              </div>
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${voiceState === "recording" ? "animate-pulse bg-[#ffe8e8] text-[#d94343]" : "bg-[#edf4ff] text-[#155eef]"}`}>
                {voiceState === "extracted" ? <CheckCircle2 size={23} /> : voiceState === "extracting" ? <Sparkles size={23} /> : <Mic size={23} />}
              </div>
            </div>
          </div>

          {activeVoiceTask && <div className="mx-6 mt-5 rounded-[20px] border border-[#b9d0f8] bg-gradient-to-r from-[#edf4ff] to-[#f8fbff] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">Active assigned task</p>
                <h3 className="mt-1 text-base font-extrabold text-[#17345f]">{activeVoiceTask.title}</h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#617796]">{activeVoiceTask.description ?? "Complete this task using the verified voice workflow."}</p>
              </div>
              <span className="w-fit rounded-full bg-[#155eef] px-3 py-1 text-[10px] font-extrabold text-white">In progress</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["What to do", activeVoiceTask.type.replaceAll("_", " ")],
                ["Item name", activeVoiceTask.product?.name ?? "Say the item name"],
                ...(activeVoiceTask.type === "TRANSFER"
                  ? [
                      ["Pick from", activeVoiceTask.sourceLocation?.name ?? "Source not provided"],
                      ["Transfer to", activeVoiceTask.destinationLocation?.name ?? "Destination not provided"],
                    ]
                  : [[activeVoiceTask.type === "SHIP" ? "Ship from" : "Shelf or area", activeVoiceTask.sourceLocation?.name ?? activeVoiceTask.location?.name ?? "Say the shelf or area"]]),
                ["Quantity", activeVoiceTask.quantity ?? "Say the number you counted or moved"],
                ...(activeVoiceTask.type === "SHIP" && activeVoiceTask.shipmentReference ? [["Shipment reference", activeVoiceTask.shipmentReference]] : []),
                ...(activeVoiceTask.type === "SHIP" && activeVoiceTask.reservationReference ? [["Order reference", activeVoiceTask.reservationReference]] : []),
              ].map(([label, value]) => <div key={label} className="rounded-xl border border-white bg-white/80 px-3 py-3"><p className="text-[9px] font-extrabold uppercase tracking-wider text-[#8295af]">{label}</p><p className="mt-1 text-xs font-extrabold text-[#29466f]">{value}</p></div>)}
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#102f60] px-4 py-3 text-white"><Mic size={18} className="mt-0.5 shrink-0 text-[#8eb8ff]" /><div><p className="text-xs font-extrabold">Task details are already filled and protected</p><p className="mt-1 text-sm font-extrabold leading-6 text-white">“{activeTaskExample}”</p><p className="mt-1 text-[11px] leading-5 text-[#c5d7ee]">{activeVoiceTask.type === "TRANSFER" ? "Say the shown sentence to confirm the assigned product, quantity and route. Inventory changes only after your confirmation and validation." : activeVoiceTask.type === "SHIP" ? "Say or confirm the physical action, for example “Shipped [number] [item] from [shelf] for [order]”. The assigned product, shelf, shipment and order references are already filled in." : "Replace [number] with the real number. For Receive and Cycle Count, you do not need to repeat the item or location."}</p></div></div>
          </div>}

          <div className="p-6">
            {voiceState === "idle" && (
              <div className="grid place-items-center rounded-[22px] border border-dashed border-[#b9c9df] bg-[#f8fbff] px-5 py-10 text-center">
                <button
                  type="button"
                  onClick={() => void startRecording()}
                  className="grid h-20 w-20 place-items-center rounded-full bg-[#155eef] text-white shadow-[0_16px_34px_rgba(21,94,239,0.28)] transition hover:scale-105"
                  aria-label="Start microphone recording"
                >
                  <Mic size={30} />
                </button>
                <p className="mt-5 text-sm font-extrabold text-[#24466f]">Tap to start speaking</p>
                <p className="mt-1 text-xs text-[#8194ae]">Your browser will request microphone permission.</p>
                {message && (
                  <div className="mt-4 rounded-xl bg-[#fff5df] px-4 py-3 text-sm font-semibold text-[#916018]">
                    {message}
                  </div>
                )}
              </div>
            )}

            {voiceState === "recording" && (
              <div className="grid min-h-[225px] place-items-center rounded-[22px] bg-[#fff7f7] p-5 text-center">
                <div className="w-full max-w-lg">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center gap-1 rounded-full bg-[#d94343] text-white shadow-[0_15px_35px_rgba(217,67,67,0.24)]">
                    {[14, 28, 40, 24, 16].map((height, index) => (
                      <span key={index} className="w-1 animate-pulse rounded-full bg-white" style={{ height }} />
                    ))}
                  </div>
                  <p className="mt-5 text-sm font-extrabold text-[#7d2c2c]">Recording from your microphone…</p>
                  <p className="mt-1 text-xs text-[#a45a5a]">Speak clearly, then stop the recording.</p>
                  {(liveTranscriptSupported || liveTranscript) && (
                    <div className="mt-5 rounded-2xl border border-[#f3c6c6] bg-white p-4 text-left shadow-[0_8px_22px_rgba(201,63,63,0.08)]">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#a45a5a]">Live transcript</p>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d94343] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                          Live
                        </span>
                      </div>
                      <p className="mt-2 min-h-[3.5rem] text-sm font-semibold leading-6 text-[#5b2b2b]">
                        {liveTranscript || "Listening for speech…"}
                        {liveTranscript && <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse rounded-full bg-[#d94343] align-middle" />}
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="mt-5 rounded-xl bg-[#c93f3f] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(201,63,63,0.2)]"
                  >
                    Stop recording
                  </button>
                </div>
              </div>
            )}

            {voiceState === "transcribing" && (
              <div className="grid min-h-[225px] place-items-center rounded-[22px] bg-[#f6f9ff] text-center">
                <div>
                  <div className="mx-auto grid h-20 w-20 animate-pulse place-items-center rounded-full bg-[#155eef] text-white shadow-[0_15px_35px_rgba(21,94,239,0.22)]">
                    <Sparkles size={28} />
                  </div>
                  <p className="mt-5 text-sm font-extrabold text-[#24466f]">Whisper is transcribing…</p>
                  <p className="mt-1 text-xs text-[#8194ae]">The first recording may take longer while the model loads.</p>
                </div>
              </div>
            )}

            {voiceState === "extracting" && (
              <div className="grid min-h-[225px] place-items-center rounded-[22px] bg-[#f7f5ff] text-center">
                <div>
                  <div className="mx-auto grid h-20 w-20 animate-pulse place-items-center rounded-full bg-[#7257d6] text-white shadow-[0_15px_35px_rgba(114,87,214,0.22)]">
                    <Sparkles size={28} />
                  </div>
                  <p className="mt-5 text-sm font-extrabold text-[#3f3470]">Qwen is extracting inventory details…</p>
                  <p className="mt-1 text-xs text-[#8379aa]">Products and locations are checked against approved database records.</p>
                </div>
              </div>
            )}

            {(voiceState === "review" || voiceState === "extracted") && (
              <div>
                <div className="rounded-2xl border border-[#dfe7f2] bg-[#f8fafc] p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8396b0]">Transcript</p>
                  {voiceState === "review" ? (
                    <textarea
                      aria-label="Editable voice transcript"
                      value={transcript}
                      onChange={(event) => setTranscript(event.target.value)}
                      rows={4}
                      className="mt-2 w-full resize-y rounded-xl border border-[#d8e2ef] bg-white px-3 py-2 text-sm font-semibold leading-6 text-[#29466f] outline-none focus:border-[#6f9cff] focus:ring-4 focus:ring-[#e7efff]"
                    />
                  ) : (
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#29466f]">“{transcript}”</p>
                  )}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Language", transcription?.language?.toUpperCase() ?? "—"],
                    [
                      "Language confidence",
                      transcription
                        ? `${Math.round(transcription.languageProbability * 100)}%`
                        : "—",
                    ],
                    [
                      "Audio duration",
                      transcription ? `${transcription.duration.toFixed(1)} sec` : "—",
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-[#e3eaf3] px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a9bb3]">{label}</p>
                      <p className="mt-1 text-sm font-extrabold text-[#203f69]">{value}</p>
                    </div>
                  ))}
                </div>
                {voiceState === "extracted" && extraction && (
                  <div className="mt-5">
                    <div className={`rounded-2xl border p-4 ${
                      extraction.readyForConfirmation
                        ? "border-[#bde5d4] bg-[#f1fbf6]"
                        : "border-[#f1d69a] bg-[#fff9ec]"
                    }`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className={`text-[10px] font-extrabold uppercase tracking-[0.14em] ${
                            extraction.readyForConfirmation
                              ? "text-[#16865b]"
                              : "text-[#b36d0c]"
                          }`}>
                            AI extraction
                          </p>
                          <p className="mt-1 text-sm font-extrabold text-[#203f69]">
                            {extraction.readyForConfirmation
                              ? "Complete and ready for Warehouse Executive confirmation"
                              : "More information is required"}
                          </p>
                        </div>
                        <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#536b8b]">
                          {Math.round(extraction.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {extractedDetails.map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-[#e3eaf3] bg-white px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a9bb3]">{label}</p>
                          <p className="mt-1 text-sm font-extrabold capitalize text-[#203f69]">{value}</p>
                        </div>
                      ))}
                    </div>

                    {insufficientStockNotice && (
                      <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#f3c0c0] bg-[#fff1f1] px-4 py-3 text-sm font-semibold text-[#a12f2f]">
                        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                        <div>
                          <p className="font-extrabold">Insufficient available stock</p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-[#b04848]">
                            This update requests {insufficientStockNotice.requested} units, but only {insufficientStockNotice.available} are currently available at {extraction.fields.sourceLocation?.name ?? "the selected shelf"}. The warehouse service will not confirm the transaction until the quantity is corrected.
                          </p>
                        </div>
                      </div>
                    )}

                    {extraction.requiresManagerReview && (
                      <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#fff5df] px-4 py-3 text-sm font-semibold text-[#916018]">
                        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                        This action will require manager review after Warehouse Executive confirmation.
                      </div>
                    )}

                    {extraction.clarificationQuestions.length > 0 && (
                      <div className="mt-4 rounded-xl border border-[#f1d69a] bg-[#fffaf0] px-4 py-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-extrabold text-[#8b5a13]">
                              Please clarify only this detail:
                            </p>
                            <p className="mt-2 text-sm font-extrabold text-[#765522]">
                              • {activeClarificationQuestion}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => speakClarificationQuestion()}
                            className="flex w-fit items-center gap-2 rounded-lg border border-[#e5c77f] bg-white px-3 py-2 text-xs font-extrabold text-[#8b5a13]"
                          >
                            <Volume2 size={15} />
                            Hear question
                          </button>
                        </div>

                        {clarificationHistory.length > 0 && (
                          <div className="mt-4 space-y-2 border-t border-[#efdcae] pt-3">
                            {clarificationHistory.map((entry, index) => (
                              <div key={`${entry.question}-${index}`} className="text-xs">
                                <p className="font-semibold text-[#8d734b]">{entry.question}</p>
                                <p className="mt-1 font-semibold text-[#8d734b]">
                                  Raw speech: “{entry.rawAnswer}”
                                </p>
                                <p className="mt-0.5 font-extrabold text-[#16865b]">
                                  AI understood: {entry.interpretedAnswer}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-4">
                          {clarificationState === "idle" && (
                            <button
                              type="button"
                              onClick={() => void startClarificationRecording()}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#155eef] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(21,94,239,0.2)] sm:w-auto"
                            >
                              <Mic size={17} />
                              Answer this question by voice
                            </button>
                          )}
                          {clarificationState === "recording" && (
                            <div>
                              <button
                                type="button"
                                onClick={stopClarificationRecording}
                                className="flex w-full animate-pulse items-center justify-center gap-2 rounded-xl bg-[#c93f3f] px-5 py-3 text-sm font-extrabold text-white sm:w-auto"
                              >
                                <Mic size={17} />
                                Stop answer recording
                              </button>
                              {(liveTranscriptSupported || liveTranscript) && (
                                <div className="mt-3 rounded-xl border border-[#f3c6c6] bg-white px-3 py-2.5 text-left">
                                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#a45a5a]">Live answer</p>
                                  <p className="mt-1 text-sm font-semibold leading-6 text-[#5b2b2b]">
                                    {liveTranscript || "Listening for your answer…"}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          {clarificationState === "transcribing" && (
                            <p className="flex items-center gap-2 text-sm font-extrabold text-[#765522]">
                              <Sparkles size={17} className="animate-pulse" />
                              Converting your answer to text…
                            </p>
                          )}
                          {clarificationState === "processing" && (
                            <p className="flex items-center gap-2 text-sm font-extrabold text-[#765522]">
                              <Sparkles size={17} className="animate-pulse" />
                              Adding your answer to the existing details…
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {voiceState === "review" ? (
                  <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={resetVoice}
                      className="rounded-xl border border-[#d8e1ee] px-5 py-3 text-sm font-extrabold text-[#536b8b] hover:bg-[#f7f9fc]"
                    >
                      Record again
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveTranscript()}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#7257d6] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(114,87,214,0.2)]"
                    >
                      <Sparkles size={17} />
                      Extract inventory details
                    </button>
                  </div>
                ) : (
                  <div className="mt-5">
                    {submissionState === "complete" && (
                      <div className={`mb-4 rounded-xl border px-4 py-3 ${
                        confirmationOutcome === "POSTED"
                          ? "border-[#bde5d4] bg-[#f1fbf6] text-[#176f4e]"
                          : "border-[#f1d69a] bg-[#fff9ec] text-[#916018]"
                      }`}>
                        <p className="text-sm font-extrabold">
                          {confirmationOutcome === "POSTED"
                            ? "Transaction posted"
                            : "Pending manager review"}
                        </p>
                        <p className="mt-1 text-xs font-semibold">
                          Reference: TX-{submittedTransaction?.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                    )}
                    {submissionState === "complete" &&
                      submittedTransaction &&
                      ["DAMAGE", "RECEIVE"].includes(submittedTransaction.action) && (
                        <div className="mb-4 rounded-xl border border-[#d5e1f0] bg-[#f8fbff] px-4 py-4">
                          <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#0e7490]">
                            <Camera size={13} /> Photo evidence
                            {evidenceAttached && (
                              <span className="rounded-full bg-[#eaf8f1] px-2 py-0.5 text-[9px] normal-case text-[#16865b]">attached</span>
                            )}
                          </p>
                          {!evidencePreview ? (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#b9d0f8] bg-white px-3 py-2 text-[11px] font-extrabold text-[#155eef] transition hover:bg-[#eaf2ff]">
                                <ImagePlus size={13} />
                                Choose file
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  className="sr-only"
                                  onChange={(event) => prepareEvidencePhoto(event.target.files?.[0])}
                                />
                              </label>
                              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#b9d0f8] bg-white px-3 py-2 text-[11px] font-extrabold text-[#155eef] transition hover:bg-[#eaf2ff]">
                                <Camera size={13} />
                                Camera
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="sr-only"
                                  onChange={(event) => prepareEvidencePhoto(event.target.files?.[0])}
                                />
                              </label>
                              <p className="text-[10px] font-semibold text-[#8295af]">
                                Add a photo of the {submittedTransaction.action === "RECEIVE" ? "received goods" : "affected stock"} for the manager review.
                              </p>
                            </div>
                          ) : (
                            <div className="mt-2 rounded-xl border border-[#d5e1f0] bg-white p-3">
                              {/* eslint-disable-next-line @next/next/no-img-element -- Blob URL from a local file upload cannot be optimized by next/image. */}
                              <img src={evidencePreview} alt="Evidence photo preview" className="mx-auto max-h-40 rounded-lg object-contain" />
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <p className="truncate text-[11px] font-bold text-[#49617f]">{evidenceFile?.name}</p>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => { setEvidencePreview(null); setEvidenceFile(null); setEvidenceMessage(""); }}
                                    className="flex items-center gap-1 rounded-lg border border-[#efb5b5] bg-[#fff6f6] px-2.5 py-1.5 text-[10px] font-extrabold text-[#b83f3f]"
                                  >
                                    <Trash2 size={12} /> Remove
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void uploadEvidencePhoto()}
                                    disabled={evidenceUploading}
                                    className="rounded-lg bg-[#155eef] px-3 py-1.5 text-[10px] font-extrabold text-white disabled:opacity-60"
                                  >
                                    {evidenceUploading ? "Uploading…" : "Upload photo"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          {evidenceMessage && !evidencePreview && (
                            <p className={`mt-2 text-[11px] font-semibold ${evidenceAttached ? "text-[#16865b]" : "text-[#a73737]"}`}>{evidenceMessage}</p>
                          )}
                        </div>
                      )}
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
                      <button
                        type="button"
                        onClick={resetVoice}
                        className="rounded-xl border border-[#d8e1ee] px-5 py-3 text-sm font-extrabold text-[#536b8b] hover:bg-[#f7f9fc]"
                      >
                        Start another update
                      </button>
                      {submissionState !== "complete" && (
                        <button
                          type="button"
                          onClick={() => {
                            setExtraction(null);
                            setClarificationState("idle");
                            setClarificationHistory([]);
                            setSubmissionState("idle");
                            setSubmittedTransaction(null);
                            setConfirmationOutcome(null);
                            clientRequestIdRef.current = null;
                            setVoiceState("review");
                            setMessage("");
                            window.speechSynthesis?.cancel();
                          }}
                          className="flex items-center justify-center gap-2 rounded-xl border border-[#b8cae2] px-5 py-3 text-sm font-extrabold text-[#24466f]"
                        >
                          <RefreshCcw size={16} />
                          Correct details
                        </button>
                      )}
                      {extraction?.readyForConfirmation &&
                        submissionState !== "complete" && (
                          <>
                            <button
                              type="button"
                              onClick={speakProposal}
                              className="flex items-center justify-center gap-2 rounded-xl border border-[#8db0ea] bg-[#f5f8ff] px-5 py-3 text-sm font-extrabold text-[#155eef]"
                            >
                              <Volume2 size={16} />
                              Hear full details
                            </button>
                            <button
                              type="button"
                              onClick={() => void confirmProposal()}
                              disabled={
                                submissionState === "creating" ||
                                submissionState === "confirming"
                              }
                              className="flex items-center justify-center gap-2 rounded-xl bg-[#16865b] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(22,134,91,0.22)] disabled:cursor-wait disabled:opacity-65"
                            >
                              <CheckCircle2 size={17} />
                              {submissionState === "creating"
                                ? "Creating pending transaction…"
                                : submissionState === "confirming"
                                  ? "Confirming safely…"
                                  : "Confirm inventory update"}
                            </button>
                          </>
                        )}
                    </div>
                  </div>
                )}
                {message && (
                  <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${voiceState === "extracted" && extraction?.readyForConfirmation ? "bg-[#eaf8f1] text-[#176f4e]" : "bg-[#fff5df] text-[#916018]"}`}>
                    {message}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-[#e0e8f3] bg-white p-6 shadow-[0_14px_42px_rgba(16,45,82,0.055)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#7288a7]">Quick actions</p>
              <h2 className="mt-1 text-lg font-extrabold text-[#102a56]">Choose what you did</h2>
            </div>
            <Boxes size={21} className="text-[#155eef]" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              [ArrowDownToLine, "Receive stock", "New stock came in", "bg-[#eaf8f1] text-[#16865b]"],
              [PackageMinus, "Ship stock", "Stock was dispatched", "bg-[#edf4ff] text-[#155eef]"],
              [ArrowRightLeft, "Move stock", "Moved to another shelf", "bg-[#f2efff] text-[#7257d6]"],
              [ClipboardCheck, "Count stock", "Counted what is on the shelf", "bg-[#fff5df] text-[#d47b08]"],
              [AlertTriangle, "Damage stock", "Report unusable stock", "bg-[#fff0f5] text-[#be185d]"],
            ].map(([Icon, title, detail, tone], index) => {
              const workflow = (["RECEIVE", "SHIP", "TRANSFER", "CYCLE_COUNT", "DAMAGE"] as const)[index];
              const active = selectedWorkflow === workflow;
              return (
              <button key={String(title)} type="button" aria-pressed={active} onClick={() => chooseWorkflow(workflow)} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${active ? "border-[#155eef] bg-[#f4f8ff] shadow-[0_8px_22px_rgba(21,94,239,0.12)]" : "border-[#e4eaf3] hover:border-[#b9cae2]"}`}>
                <div className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
                  <Icon size={18} />
                </div>
                <p className="mt-3 text-sm font-extrabold text-[#203f69]">{String(title)}</p>
                <p className="mt-1 text-[11px] leading-4 text-[#8294ac]">{String(detail)}</p>
              </button>
            )})}
          </div>
          <div className="mt-5 rounded-2xl bg-[#0f376d] p-5 text-white">
            <div className="flex items-start gap-3">
              <ShieldCheck size={21} className="mt-0.5 shrink-0 text-[#8eb8ff]" />
              <div>
                <p className="text-sm font-extrabold">Warehouse Executive confirmation required</p>
                <p className="mt-1 text-xs leading-5 text-[#bcd0e9]">AI prepares the transaction. Inventory changes only after you confirm and business rules pass.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section id="worker-settings" className="rounded-[24px] border border-[#dce6f3] bg-white p-5 shadow-[0_14px_42px_rgba(16,45,82,0.055)] sm:p-6">
        <div className="flex flex-col gap-3 border-b border-[#e8eef6] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#155eef]">Warehouse Executive settings</p>
            <h2 className="mt-1 text-xl font-extrabold text-[#102a56]">Device and access checks</h2>
            <p className="mt-1 text-sm text-[#7489a6]">Make sure voice tools are ready before starting warehouse work.</p>
          </div>
          <button type="button" onClick={() => { onNavigate("Overview"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-4 text-xs font-extrabold text-[#155eef]"><ChevronDown size={15} className="rotate-90" /> Back to Home</button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article className="rounded-[20px] border border-[#dfe8f4] bg-[#f8fbff] p-5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e9f1ff] text-[#155eef]"><Mic size={21} /></span>
            <h3 className="mt-4 font-extrabold text-[#17345f]">Microphone access</h3>
            <p className="mt-1 min-h-10 text-xs font-semibold leading-5 text-[#7186a3]">{microphoneStatus}</p>
            <button type="button" onClick={() => void checkMicrophoneAccess()} className="mt-4 h-10 rounded-xl bg-[#155eef] px-4 text-xs font-extrabold text-white">Check microphone</button>
          </article>
          <article className="rounded-[20px] border border-[#dfe8f4] bg-[#f8fbff] p-5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eaf8f1] text-[#16865b]"><Volume2 size={21} /></span>
            <h3 className="mt-4 font-extrabold text-[#17345f]">Speaker guidance</h3>
            <p className="mt-1 min-h-10 text-xs font-semibold leading-5 text-[#7186a3]">{speakerStatus || "Test spoken clarification guidance on this device."}</p>
            <button type="button" onClick={testSpeaker} className="mt-4 h-10 rounded-xl bg-[#16865b] px-4 text-xs font-extrabold text-white">Test speaker</button>
          </article>
        </div>
        <div className="mt-5 flex flex-col gap-4 rounded-[20px] border border-[#dfe8f4] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f2efff] text-[#7257d6]"><ShieldCheck size={21} /></span><div><p className="font-extrabold text-[#17345f]">Secure role access</p><p className="mt-1 text-xs font-semibold text-[#7186a3]">Warehouse Executive · Central Warehouse · Role permissions active</p></div></div>
          <button type="button" onClick={() => { onNavigate("Voice entry"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="h-10 rounded-xl border border-[#b9cff0] bg-[#edf4ff] px-4 text-xs font-extrabold text-[#155eef]">Open Voice Entry</button>
        </div>
      </section>

      {newTaskAlert && <div role="status" aria-live="polite" className="mt-6 flex items-start justify-between gap-4 rounded-[20px] border border-[#b9d0f8] bg-gradient-to-r from-[#edf4ff] to-[#f7faff] p-4 shadow-[0_12px_30px_rgba(21,94,239,0.09)]"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#155eef] text-white"><BellRing size={19} /></span><div><p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#155eef]">New assignment</p><p className="mt-1 text-sm font-extrabold text-[#17345f]">{newTaskAlert}</p><p className="mt-1 text-xs font-semibold text-[#7186a3]">Open the task queue below to review and start the work.</p></div></div><button type="button" onClick={() => setNewTaskAlert("")} aria-label="Dismiss new task alert" className="rounded-lg p-2 text-[#6f84a3] transition hover:bg-white"><X size={17} /></button></div>}

      <section id="worker-task-queue" className="mt-6 scroll-mt-24 rounded-[24px] border border-[#e0e8f3] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.05)]">
        <div className="flex flex-col gap-3 border-b border-[#e9eef5] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#7257d6]">My assigned work</p>
            <h2 className="mt-1 text-lg font-extrabold text-[#102a56]">Task queue</h2>
            <p className="mt-1 text-xs text-[#8294ac]">Only assigned work and manager-requested recounts that you still need to perform.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 rounded-full bg-[#eaf8f1] px-3 py-1 text-[10px] font-extrabold text-[#16865b]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#20ad76]" />Live updates{lastTaskRefresh ? ` · ${new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(lastTaskRefresh)}` : ""}</span><span className="w-fit rounded-full bg-[#f2efff] px-3 py-1 text-xs font-extrabold text-[#6349c1]">{workerTasks.length} open · {completedAssignedTasks.length} done</span><button type="button" onClick={() => { onNavigate("Overview"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-3 text-xs font-extrabold text-[#155eef]"><ChevronDown size={15} className="rotate-90" /> Back to Overview</button></div>
        </div>
        {workerTasks.length === 0 ? (
          <div className="flex items-start gap-3 px-6 py-6">
            <CheckCircle2 size={21} className="mt-0.5 shrink-0 text-[#16865b]" />
            <div>
              <p className="text-sm font-extrabold text-[#24466f]">No open Warehouse Executive tasks</p>
              <p className="mt-1 text-xs leading-5 text-[#8294ac]">New recount requests and pending adjustments will appear here automatically.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#edf1f6]">
            {workerTasks.map((task) => (
              <div key={task.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${task.urgent ? "bg-[#fff1e3] text-[#c56c08]" : "bg-[#edf4ff] text-[#155eef]"}`}>
                    {task.urgent ? <RefreshCcw size={18} /> : <Clock3 size={18} />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-extrabold text-[#24466f]">{task.title}</p>
                      <span className="rounded-full bg-[#f2efff] px-2.5 py-1 text-[10px] font-extrabold text-[#6349c1]">{taskTypeLabel(task.type)}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${task.urgent ? "bg-[#fff1e3] text-[#a45d0b]" : "bg-[#edf4ff] text-[#155eef]"}`}>
                        {task.status === "IN_PROGRESS" ? "In progress" : task.urgent ? "Action required" : "Waiting for manager"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-[#6f84a1]">{task.detail}</p>
                    {task.dueAt && <p className="mt-1 text-xs font-extrabold text-[#d47b08]">{formatTaskDue(task.dueAt)}</p>}
                    <p className="mt-1 text-xs text-[#8a9bb1]">{task.note}</p>
                  </div>
                </div>
                {task.automatic ? (task.status === "OPEN" ? <button disabled={taskActionId === task.id} type="button" onClick={() => void openTaskInVoice(task.id)} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#155eef] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-60"><Mic size={15} /> Start with voice</button> : <button disabled={taskActionId === task.id} type="button" onClick={() => void openTaskInVoice(task.id)} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#16865b] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-60"><Mic size={15} /> Complete with voice</button>) : task.urgent ? <button type="button" onClick={() => openRecountInVoice(task.id)} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#d47b08] px-4 py-2.5 text-xs font-extrabold text-white"><Mic size={15} /> Start recount with voice</button> : <span className="shrink-0 rounded-xl border border-[#e3e9f2] bg-[#f7f9fc] px-4 py-2.5 text-[10px] font-extrabold text-[#7b8fa9]">Manager review pending</span>}
                {task.type === "SHIP" && (
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button disabled={taskActionId === task.id} type="button" onClick={() => void startAssignedTask(task.id)} className="rounded-xl border border-[#c9d8ee] bg-white px-3 py-2.5 text-xs font-extrabold text-[#155eef] disabled:opacity-60">Start task</button>
                    <button disabled={taskActionId === task.id} type="button" onClick={() => void completeAssignedTask(task.id)} className="rounded-xl bg-[#16865b] px-3 py-2.5 text-xs font-extrabold text-white disabled:opacity-60">Complete task</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {completedAssignedTasks.length > 0 && (
          <div className="border-t border-[#edf1f6] bg-[#fafbfd] px-6 py-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#8597af]">Recently completed by you</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {completedAssignedTasks.slice(0, 6).map((task) => (
                <div key={task.id} className="flex items-center gap-2 rounded-xl border border-[#e3e9f2] bg-white px-3 py-2.5">
                  <CheckCircle2 size={16} className="shrink-0 text-[#16865b]" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold text-[#29466f]">{task.title}</p>
                    <p className="text-[10px] font-semibold text-[#8a9bb1]">{taskTypeLabel(task.type)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section id="worker-history" className="mt-6 scroll-mt-24 rounded-[24px] border border-[#e0e8f3] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.05)]">
        <div className="flex flex-col gap-4 border-b border-[#e9eef5] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#102a56]">{historyRange === "WEEK" ? "This week's activity" : "My complete transaction history"}</h2>
            <p className="mt-1 text-xs text-[#8294ac]">
              {historySubtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border border-[#dce5f1] bg-[#f6f9fd] p-1" role="group" aria-label="History time range">
              <button type="button" aria-pressed={historyRange === "WEEK"} onClick={() => setHistoryRange("WEEK")} className={`rounded-lg px-4 py-2 text-xs font-extrabold transition ${historyRange === "WEEK" ? "bg-white text-[#155eef] shadow-sm" : "text-[#7186a3] hover:text-[#29466f]"}`}>Last 7 days</button>
              <button type="button" aria-pressed={historyRange === "ALL"} onClick={() => setHistoryRange("ALL")} className={`rounded-lg px-4 py-2 text-xs font-extrabold transition ${historyRange === "ALL" ? "bg-white text-[#155eef] shadow-sm" : "text-[#7186a3] hover:text-[#29466f]"}`}>All time</button>
            </div>
            <button type="button" aria-pressed={historyView === "PENDING"} onClick={() => setHistoryView("PENDING")} className={`rounded-xl px-4 py-2 text-xs font-extrabold ${historyView === "PENDING" ? "bg-[#fff1db] text-[#a46009] shadow-[0_8px_20px_rgba(164,96,9,0.12)]" : "border border-[#dce5f1] bg-white text-[#7186a3]"}`}>Pending</button>
            <button type="button" aria-pressed={historyView === "COMPLETED"} onClick={() => setHistoryView("COMPLETED")} className={`rounded-xl px-4 py-2 text-xs font-extrabold ${historyView === "COMPLETED" ? "bg-[#eaf8f1] text-[#16865b] shadow-[0_8px_20px_rgba(22,134,91,0.12)]" : "border border-[#dce5f1] bg-white text-[#7186a3]"}`}>Completed</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[#f8fafc] text-[10px] uppercase tracking-[0.12em] text-[#8597af]">
              <tr>
                {["Transaction", "Type", "Item", "Quantity", "Time", "Status"].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-6 py-3 font-extrabold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f6] text-sm">
              {displayedTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="whitespace-nowrap px-6 py-4 font-extrabold text-[#24466f]">{transaction.id}</td>
                  <td className="whitespace-nowrap px-6 py-4 font-semibold text-[#5f7594]">{transaction.type}</td>
                  <td className="whitespace-nowrap px-6 py-4 font-semibold text-[#29466f]">{transaction.item}</td>
                  <td className={`whitespace-nowrap px-6 py-4 font-extrabold ${transaction.quantity.startsWith("+") ? "text-[#16865b]" : "text-[#496483]"}`}>{transaction.quantity}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-[#7f92aa]">{transaction.time}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${transaction.status === "Posted" || transaction.status === "Approved" ? "bg-[#eaf8f1] text-[#16865b]" : transaction.status === "Rejected" ? "bg-[#fff0f0] text-[#b83b3b]" : "bg-[#fff5df] text-[#a8670d]"}`}>{transaction.status}</span>
                  </td>
                </tr>
              ))}
              {displayedTransactions.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-sm font-semibold text-[#7f92aa]">No {historyView === "PENDING" ? "pending" : "completed"} activity was found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section id="worker-active-items" className="overflow-hidden rounded-[24px] border border-[#e0e8f3] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.05)]">
        <div className="flex flex-col gap-4 border-b border-[#e9eef5] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#16865b]">Live inventory catalogue</p>
            <h2 className="mt-1 text-lg font-extrabold text-[#102a56]">Active items</h2>
            <p className="mt-1 text-xs text-[#8294ac]">Current on-hand information across every warehouse location — read-only.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eaf8f1] px-3 py-1 text-[10px] font-extrabold text-[#16865b]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#20ad76]" />Live from PostgreSQL</span>
            <span className="w-fit rounded-full bg-[#f2efff] px-3 py-1 text-xs font-extrabold text-[#6349c1]">{snapshot?.products.length ?? 0} active items</span>
            <button type="button" onClick={() => { onNavigate("Overview"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-3 text-xs font-extrabold text-[#155eef]"><ChevronDown size={15} className="rotate-90" /> Back to Overview</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[#f8fafc] text-[10px] uppercase tracking-[0.12em] text-[#8597af]">
              <tr>
                {["SKU (primary key)", "Product", "Unit", "Locations", "Available"].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-6 py-3 font-extrabold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f6] text-sm">
              {(snapshot?.products ?? []).map((product) => {
                const productBalances = (snapshot?.balances ?? []).filter(
                  (balance) => balance.product.id === product.id,
                );
                const available = productBalances.reduce(
                  (total, balance) =>
                    total + Math.max(0, balance.quantity - balance.reservedQuantity),
                  0,
                );
                const locationCodes = productBalances.map(
                  (balance) => balance.location.code,
                );
                return (
                  <tr key={product.id} className="hover:bg-[#f7faff]">
                    <td className="whitespace-nowrap px-6 py-4"><span className="rounded-lg border border-[#cfe0f8] bg-[#f4f8ff] px-2.5 py-1 font-mono text-xs font-extrabold text-[#155eef]">{product.sku}</span></td>
                    <td className="whitespace-nowrap px-6 py-4 font-extrabold text-[#24466f]">{product.name}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-[#647b99]">{product.unit}</td>
                    <td className="whitespace-nowrap px-6 py-4">{locationCodes.length > 0 ? locationCodes.map((code) => <span key={code} className="mr-1.5 inline-block rounded-full bg-[#edf4ff] px-2.5 py-1 text-[10px] font-extrabold text-[#155eef]">{code}</span>) : <span className="text-[#9aabc1]">No location</span>}</td>
                    <td className={`whitespace-nowrap px-6 py-4 text-lg font-black ${available > 0 ? "text-[#16865b]" : "text-[#a46009]"}`}>{available}</td>
                  </tr>
                );
              })}
              {snapshot && snapshot.products.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-sm font-semibold text-[#7f92aa]">No active items are in the catalogue yet.</td></tr>
              )}
              {!snapshot && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-sm font-semibold text-[#7f92aa]">Loading live inventory from the warehouse service…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}

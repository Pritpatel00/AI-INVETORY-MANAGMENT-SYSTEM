import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { z } from "zod";

import type { AuthenticatedUser } from "../auth/auth-user";
import { PrismaService } from "../prisma/prisma.service";

export interface WhisperResponse {
  text: string;
  language: string;
  languageProbability: number;
  duration: number;
  model: string;
  segments: Array<{ start: number; end: number; text: string }>;
}

const whisperSchema = z.object({
  success: z.literal(true).optional(),
  text: z.string(),
  language: z.string().min(1),
  languageProbability: z.number().min(0).max(1).optional(),
  duration: z.number().nonnegative().optional(),
  model: z.string().min(1).optional(),
  segments: z
    .array(
      z.object({
        start: z.number().nonnegative(),
        end: z.number().nonnegative(),
        text: z.string(),
      }),
    )
    .optional(),
});

@Injectable()
export class SpeechService {
  private readonly whisperApiUrl = process.env.WHISPER_API_URL?.trim();
  private readonly evidenceRoot = resolve(
    process.env.EVIDENCE_STORAGE_PATH ?? "../../.local/evidence",
  );

  constructor(private readonly prisma: PrismaService) {}

  private getWhisperEndpoint() {
    let endpoint: URL;
    try {
      endpoint = new URL(this.whisperApiUrl ?? "");
      if (!["http:", "https:"].includes(endpoint.protocol)) throw new Error();
      // Accept either the Pod base URL or its full /transcribe endpoint.
      const path = endpoint.pathname.replace(/\/+$/, "");
      endpoint.pathname = path.endsWith("/transcribe") ? path : `${path}/transcribe`;
    } catch {
      throw new ServiceUnavailableException("The speech-to-text service is not configured with a valid WHISPER_API_URL.");
    }
    return endpoint;
  }

  private async requestWhisper(
    audio: Express.Multer.File,
    language?: string,
    preview = false,
  ): Promise<WhisperResponse> {
    const endpoint = this.getWhisperEndpoint();
    const body = new FormData();
    body.append(
      "audio",
      new Blob([new Uint8Array(audio.buffer)], { type: audio.mimetype }),
      audio.originalname || "warehouse-recording.webm",
    );
    if (language) body.append("language", language);

    let result: unknown;
    const signal = AbortSignal.timeout(120_000);
    try {
      const response = await fetch(endpoint.toString(), {
        method: "POST",
        headers: preview ? { "X-Whisper-Preview": "true" } : undefined,
        // fetch supplies the multipart Content-Type including its boundary.
        body,
        signal,
      });
      if (!response.ok) {
        throw new BadGatewayException(
          `Speech transcription failed with status ${response.status}.`,
        );
      }
      try {
        result = await response.json();
      } catch (error) {
        if (signal.aborted) throw error;
        throw new BadGatewayException("The speech service returned an invalid response.");
      }
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      throw new ServiceUnavailableException(
        signal.aborted
          ? "Speech transcription timed out. Please try a shorter recording."
          : "The speech-to-text service is unavailable.",
      );
    }

    const parsed = whisperSchema.safeParse(result);
    if (!parsed.success) {
      throw new BadGatewayException("Speech transcription did not return a completed, valid result.");
    }
    const output = parsed.data;
    return {
      text: output.text,
      language: output.language,
      languageProbability: output.languageProbability ?? 0,
      duration: output.duration ?? 0,
      model: output.model ?? "faster-whisper",
      segments: output.segments ?? [],
    };
  }

  async preview(audio: Express.Multer.File, language?: string) {
    return this.requestWhisper(audio, language, true);
  }

  async transcribe(
    audio: Express.Multer.File,
    actor: AuthenticatedUser,
    language?: string,
  ) {
    const user = actor.email
      ? await this.prisma.user.findUnique({
          where: { email: actor.email.toLowerCase() },
        })
      : await this.prisma.user.findUnique({
          where: { employeeId: actor.username.toUpperCase() },
        });
    if (!user) {
      throw new ServiceUnavailableException(
        "The authenticated inventory user profile is unavailable.",
      );
    }

    // Validate configuration before creating any evidence files.
    this.getWhisperEndpoint();

    const extension = extname(audio.originalname).toLowerCase() || ".webm";
    const dateFolder = new Date().toISOString().slice(0, 10);
    const evidenceId = randomUUID();
    const storageKey = `voice/${dateFolder}/${evidenceId}${extension}`;
    const evidencePath = join(this.evidenceRoot, storageKey);
    await mkdir(dirname(evidencePath), { recursive: true });
    await writeFile(evidencePath, audio.buffer);

    try {
      const transcription = await this.requestWhisper(audio, language);
      const evidence = await this.prisma.voiceEvidence.create({
        data: {
          id: evidenceId,
          storageKey,
          originalFilename: audio.originalname || "warehouse-recording.webm",
          mimeType: audio.mimetype,
          sizeBytes: audio.size,
          transcript: transcription.text,
          language: transcription.language,
          languageProbability: transcription.languageProbability,
          duration: transcription.duration,
          createdById: user.id,
        },
      });

      return {
        ...transcription,
        evidenceId: evidence.id,
        storageKey: evidence.storageKey,
      };
    } catch (error) {
      await unlink(evidencePath).catch(() => undefined);
      throw error;
    }
  }
}

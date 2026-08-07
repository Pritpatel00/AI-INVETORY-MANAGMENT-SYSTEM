import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";

import type { AuthenticatedUser } from "../auth/auth-user";
import { PrismaService } from "../prisma/prisma.service";

interface WhisperResponse {
  text: string;
  language: string;
  languageProbability: number;
  duration: number;
  model: string;
  segments: Array<{ start: number; end: number; text: string }>;
}

@Injectable()
export class SpeechService {
  private readonly speechServiceUrl =
    process.env.SPEECH_SERVICE_URL ?? "http://127.0.0.1:5001";
  private readonly evidenceRoot = resolve(
    process.env.EVIDENCE_STORAGE_PATH ?? "../../.local/evidence",
  );

  constructor(private readonly prisma: PrismaService) {}

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

    const extension = extname(audio.originalname).toLowerCase() || ".webm";
    const dateFolder = new Date().toISOString().slice(0, 10);
    const evidenceId = randomUUID();
    const storageKey = `voice/${dateFolder}/${evidenceId}${extension}`;
    const evidencePath = join(this.evidenceRoot, storageKey);
    await mkdir(dirname(evidencePath), { recursive: true });
    await writeFile(evidencePath, audio.buffer);

    try {
      const form = new FormData();
      form.append(
        "audio",
        new Blob([new Uint8Array(audio.buffer)], { type: audio.mimetype }),
        audio.originalname || "warehouse-recording.webm",
      );
      if (language) form.append("language", language);

      let response: Response;
      try {
        response = await fetch(`${this.speechServiceUrl}/transcribe`, {
          method: "POST",
          body: form,
          signal: AbortSignal.timeout(120_000),
        });
      } catch {
        throw new ServiceUnavailableException(
          "The local speech-to-text service is unavailable.",
        );
      }

      if (!response.ok) {
        const details = await response.text();
        throw new BadGatewayException(
          `Speech transcription failed with status ${response.status}: ${details}`,
        );
      }

      const transcription = (await response.json()) as WhisperResponse;
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

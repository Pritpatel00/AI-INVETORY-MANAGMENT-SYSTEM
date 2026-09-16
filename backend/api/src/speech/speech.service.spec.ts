import { BadGatewayException, ServiceUnavailableException } from "@nestjs/common";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import type { AuthenticatedUser } from "../auth/auth-user";
import type { PrismaService } from "../prisma/prisma.service";
import { SpeechService } from "./speech.service";

jest.mock("node:fs/promises", () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

const actor: AuthenticatedUser = {
  subject: "worker", username: "worker", email: "worker@example.com", roles: ["worker"],
};
const audio = {
  buffer: Buffer.from([0, 1, 255, 42]), originalname: "recording.webm",
  mimetype: "audio/webm", size: 4,
} as Express.Multer.File;

describe("SpeechService persistent Whisper", () => {
  const originalEnv = { ...process.env };
  const prisma = {
    user: { findUnique: jest.fn() },
    voiceEvidence: { create: jest.fn() },
  };
  let fetchSpy: jest.SpyInstance;
  const service = () => new SpeechService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.WHISPER_API_URL = "https://whisper.example/";
    delete process.env.RUNPOD_API_KEY;
    delete process.env.RUNPOD_WHISPER_ENDPOINT_ID;
    prisma.user.findUnique.mockResolvedValue({ id: "worker-id" });
    prisma.voiceEvidence.create.mockImplementation(async ({ data }) => data);
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, text: "Receive ten boxes", language: "en" }),
    );
  });
  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it.each(["https://whisper.example/", "https://whisper.example/transcribe/"])(
    "uploads original audio using base or full URL %s and preserves the API contract", async (url) => {
      process.env.WHISPER_API_URL = url;
      const result = await service().transcribe(audio, actor, "en");
      const [endpoint, request] = fetchSpy.mock.calls[0];
      expect(endpoint).toBe("https://whisper.example/transcribe");
      expect(request.method).toBe("POST");
      expect(request.headers).toBeUndefined();
      expect(request.signal).toBeInstanceOf(AbortSignal);
      expect(request.body).toBeInstanceOf(FormData);
      const file = request.body.get("audio") as File;
      expect(file.name).toBe(audio.originalname);
      expect(file.type).toBe(audio.mimetype);
      expect(Buffer.from(await file.arrayBuffer())).toEqual(audio.buffer);
      expect(request.body.get("language")).toBe("en");
      expect(result).toEqual({
        text: "Receive ten boxes", language: "en", languageProbability: 0,
        duration: 0, model: "faster-whisper", segments: [],
        evidenceId: expect.any(String), storageKey: expect.any(String),
      });
      expect(writeFile).toHaveBeenCalledWith(expect.any(String), audio.buffer);
      expect(unlink).not.toHaveBeenCalled();
    },
  );

  it("omits an absent language hint", async () => {
    await service().transcribe(audio, actor);
    expect(fetchSpy.mock.calls[0][1].body.has("language")).toBe(false);
  });

  it.each([undefined, "not-a-url", "ftp://whisper.example"])(
    "rejects missing/invalid configuration without falling back to serverless: %s", async (url) => {
      if (url === undefined) delete process.env.WHISPER_API_URL;
      else process.env.WHISPER_API_URL = url;
      process.env.RUNPOD_WHISPER_ENDPOINT_ID = "old-endpoint";
      process.env.RUNPOD_API_KEY = "qwen-key";
      await expect(service().transcribe(audio, actor)).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(mkdir).not.toHaveBeenCalled();
    },
  );

  it.each([
    { success: false, text: "failed", language: "en" },
    { success: true, text: 123, language: "en" },
    { status: "COMPLETED", output: { transcription: "old format" } },
  ])("rejects failed/malformed results and removes evidence", async (body) => {
    fetchSpy.mockResolvedValue(Response.json(body));
    await expect(service().transcribe(audio, actor)).rejects.toBeInstanceOf(BadGatewayException);
    expect(prisma.voiceEvidence.create).not.toHaveBeenCalled();
    expect(unlink).toHaveBeenCalledWith(expect.any(String));
  });

  it.each(["http", "json", "network", "timeout", "body-timeout"])(
    "handles %s failures without storing transcript evidence", async (failure) => {
      if (failure === "http") fetchSpy.mockResolvedValue(new Response("private details", { status: 500 }));
      if (failure === "json") fetchSpy.mockResolvedValue(new Response("invalid json"));
      if (failure === "network") fetchSpy.mockRejectedValue(new TypeError("fetch failed"));
      if (failure.includes("timeout")) {
        const controller = new AbortController();
        jest.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
        fetchSpy.mockImplementation(async () => {
          controller.abort();
          if (failure === "timeout") throw new Error("aborted");
          return { ok: true, json: async () => { throw new Error("aborted body"); } };
        });
      }
      await expect(service().transcribe(audio, actor)).rejects.toBeInstanceOf(
        ["http", "json"].includes(failure) ? BadGatewayException : ServiceUnavailableException,
      );
      expect(prisma.voiceEvidence.create).not.toHaveBeenCalled();
      expect(unlink).toHaveBeenCalled();
      if (failure.includes("timeout")) expect(AbortSignal.timeout).toHaveBeenCalledWith(120_000);
    },
  );
});

import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { connect } from "node:net";

import { Public } from "../auth/public.decorator";
import { Roles } from "../auth/roles.decorator";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}
  @Get()
  @Public()
  @ApiOkResponse({ description: "The API is available." })
  check() {
    return {
      service: "nirka-inventory-api",
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("detailed")
  @Roles("administrator")
  async detailed() {
    const checkHttp = async (url: string) => {
      try { const response = await fetch(url, { signal: AbortSignal.timeout(2500) }); return response.ok; } catch { return false; }
    };
    const checkTcp = (host: string, port: number) => new Promise<boolean>((done) => {
      const socket = connect({ host, port });
      const finish = (result: boolean) => { socket.destroy(); done(result); };
      socket.setTimeout(2000);
      socket.once("connect", () => finish(true)); socket.once("timeout", () => finish(false)); socket.once("error", () => finish(false));
    });
    const checkDatabase = async () => { try { await this.prisma.$queryRaw`SELECT 1`; return true; } catch { return false; } };
    const checkStorage = async () => { try { await access(resolve(process.env.EVIDENCE_STORAGE_PATH ?? "../../.local/evidence")); return true; } catch { return false; } };
    const [database, speech, ai, queue, storage] = await Promise.all([
      checkDatabase(),
      checkHttp(`${process.env.SPEECH_SERVICE_URL ?? "http://127.0.0.1:5001"}/health`),
      checkHttp(`${process.env.OLLAMA_URL ?? "http://127.0.0.1:11434"}/api/tags`),
      checkTcp(process.env.VALKEY_HOST ?? "127.0.0.1", Number(process.env.VALKEY_PORT ?? 6379)),
      checkStorage(),
    ]);
    const services = [
      { key: "api", name: "Application API", healthy: true, detail: "Inventory API is responding" },
      { key: "database", name: "Inventory database", healthy: database, detail: database ? "PostgreSQL connection is available" : "PostgreSQL cannot be reached" },
      { key: "speech", name: "Speech service", healthy: speech, detail: speech ? "Voice transcription service is available" : "Speech service cannot be reached" },
      { key: "ai", name: "AI service", healthy: ai, detail: ai ? "Ollama model service is available" : "Ollama cannot be reached" },
      { key: "queue", name: "Notification queue", healthy: queue, detail: queue ? "Valkey queue is available" : "Valkey queue cannot be reached" },
      { key: "storage", name: "Evidence storage", healthy: storage, detail: storage ? "Voice evidence location is accessible" : "Evidence storage location is unavailable" },
    ];
    return { status: services.every((service) => service.healthy) ? "healthy" : "degraded", checkedAt: new Date().toISOString(), services };
  }
}

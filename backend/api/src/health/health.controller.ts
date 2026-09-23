import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { Public } from "../auth/public.decorator";
import { Roles } from "../auth/roles.decorator";
import { PrismaService } from "../prisma/prisma.service";

export type ServiceHealthStatus = "healthy" | "degraded" | "unavailable";

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
    const checkHttp = async (
      url: string,
      headers?: Record<string, string>,
    ) => {
      try {
        const response = await fetch(url, {
          headers,
          signal: AbortSignal.timeout(2500),
        });
        return response.ok;
      } catch {
        return false;
      }
    };
    const statusOf = (healthy: boolean): ServiceHealthStatus =>
      healthy ? "healthy" : "unavailable";
    const checkDatabase = async () => {
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        return true;
      } catch {
        return false;
      }
    };
    const ollamaUrl =
      process.env.OLLAMA_URL?.trim() ?? "http://127.0.0.1:11434";
    const ollamaHealth = checkHttp(`${ollamaUrl}/api/tags`);
    const checkSpeech = async () => {
      try {
        const url = new URL(process.env.WHISPER_API_URL?.trim() ?? "");
        if (!["http:", "https:"].includes(url.protocol)) return false;
        // The local Faster Whisper service exposes readiness at /health.
        url.pathname = url.pathname.replace(/\/+$/, "").replace(/\/transcribe$/, "") + "/health";
        return await checkHttp(url.toString());
      } catch {
        return false;
      }
    };
    const [web, database, keycloak, speech, ai] = await Promise.all([
      checkHttp(process.env.WEB_APP_ORIGIN ?? "http://localhost:3000"),
      checkDatabase(),
      checkHttp(process.env.KEYCLOAK_ISSUER ?? "http://localhost:8080/realms/nirka-inventory"),
      checkSpeech(),
      ollamaHealth,
    ]);
    const services = [
      { key: "web", name: "Web application", status: statusOf(web), detail: web ? "Web application is responding" : "Web application cannot be reached" },
      { key: "api", name: "NestJS API", status: "healthy", detail: "Inventory API is responding" },
      { key: "database", name: "PostgreSQL", status: statusOf(database), detail: database ? "PostgreSQL connection is available" : "PostgreSQL cannot be reached" },
      { key: "keycloak", name: "Keycloak", status: statusOf(keycloak), detail: keycloak ? "Keycloak identity service is available" : "Keycloak cannot be reached" },
      { key: "speech", name: "Speech-to-text", status: statusOf(speech), detail: speech ? "Voice transcription service is available" : "Speech-to-text service cannot be reached" },
      { key: "ai", name: "Local Ollama AI", status: statusOf(ai), detail: ai ? "Local Qwen model service is available" : "Local Ollama cannot be reached" },
    ];
    return { status: services.every((service) => service.status === "healthy") ? "healthy" : "degraded", checkedAt: new Date().toISOString(), services };
  }
}

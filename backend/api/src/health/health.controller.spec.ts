import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { RolesGuard } from "../auth/roles.guard";
import { ROLES_KEY } from "../auth/roles.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { HealthController } from "./health.controller";

const HEALTHY_RESPONSE = { ok: true, status: 200 };

function createController(databaseOk = true) {
  const prisma = {
    $queryRaw: jest.fn(async () => {
      if (!databaseOk) throw new Error("database is down");
      return [{ "?column?": 1 }];
    }),
  } as unknown as PrismaService;
  return { controller: new HealthController(prisma), prisma };
}

function createGuardContext(roles: string[]): ExecutionContext {
  return {
    getHandler: () => HealthController.prototype.detailed,
    getClass: () => HealthController,
    switchToHttp: () => ({
      getRequest: () => ({ authUser: { roles } }),
    }),
  } as unknown as ExecutionContext;
}

describe("HealthController", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.WEB_APP_ORIGIN = "http://localhost:3000";
    process.env.KEYCLOAK_ISSUER = "http://localhost:8080/realms/nirka-inventory";
    process.env.SPEECH_SERVICE_URL = "http://127.0.0.1:5001";
    process.env.RUNPOD_API_KEY = "runpod-test-key";
    process.env.RUNPOD_ENDPOINT_ID = "test-endpoint";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  describe("check", () => {
    it("reports the API is available without authentication", () => {
      const { controller } = createController();
      const result = controller.check();
      expect(result).toEqual({
        service: "nirka-inventory-api",
        status: "ok",
        timestamp: expect.any(String),
      });
    });
  });

  describe("detailed", () => {
    it("reports exactly the six active services with healthy statuses", async () => {
      const fetchMock = jest
        .spyOn(global, "fetch")
        .mockResolvedValue(HEALTHY_RESPONSE as Response);
      const { controller } = createController();

      const result = await controller.detailed();

      expect(result.status).toBe("healthy");
      expect(typeof result.checkedAt).toBe("string");
      expect(result.services.map((service) => service.key)).toEqual([
        "web",
        "api",
        "database",
        "keycloak",
        "speech",
        "ai",
      ]);
      expect(result.services.map((service) => service.name)).toEqual([
        "Web application",
        "NestJS API",
        "PostgreSQL",
        "Keycloak",
        "Speech-to-text",
        "Runpod AI",
      ]);
      for (const service of result.services) {
        expect(service.status).toBe("healthy");
        expect(typeof service.detail).toBe("string");
      }
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it("no longer contains the obsolete Notification queue or evidence-storage services", async () => {
      jest.spyOn(global, "fetch").mockResolvedValue(HEALTHY_RESPONSE as Response);
      const { controller } = createController();

      const result = await controller.detailed();

      expect(result.services.some((service) => service.key === "queue")).toBe(false);
      expect(result.services.some((service) => service.key === "storage")).toBe(false);
      expect(result.services.map((service) => service.name)).not.toContain("Notification queue");
      expect(JSON.stringify(result)).not.toMatch(/valkey/i);
      expect(JSON.stringify(result)).not.toMatch(/6379/);
    });

    it("probes the configured URLs for web, keycloak, speech and ai", async () => {
      process.env.WEB_APP_ORIGIN = "http://web.internal:4321";
      process.env.KEYCLOAK_ISSUER = "http://idp.internal:8080/realms/acme";
      process.env.SPEECH_SERVICE_URL = "http://speech.internal:9999";
      process.env.RUNPOD_ENDPOINT_ID = "runpod.internal-endpoint";
      const fetchMock = jest
        .spyOn(global, "fetch")
        .mockResolvedValue(HEALTHY_RESPONSE as Response);
      const { controller } = createController();

      await controller.detailed();

      const urls = fetchMock.mock.calls.map(([url]) => String(url));
      expect(urls).toContain("http://web.internal:4321");
      expect(urls).toContain("http://idp.internal:8080/realms/acme");
      expect(urls).toContain("http://speech.internal:9999/health");
      expect(urls).toContain(
        "https://api.runpod.ai/v2/runpod.internal-endpoint/health",
      );
      expect(fetchMock.mock.calls.find(([url]) =>
        String(url).includes("runpod.internal-endpoint"),
      )?.[1]).toMatchObject({
        headers: { Authorization: "Bearer runpod-test-key" },
      });
    });

    it("marks PostgreSQL unavailable and the overall health degraded when the database is down", async () => {
      jest.spyOn(global, "fetch").mockResolvedValue(HEALTHY_RESPONSE as Response);
      const { controller } = createController(false);

      const result = await controller.detailed();

      const database = result.services.find((service) => service.key === "database");
      expect(database?.status).toBe("unavailable");
      expect(database?.detail).toBe("PostgreSQL cannot be reached");
      expect(result.status).toBe("degraded");
    });

    it("marks Runpod AI unavailable when the model service does not respond", async () => {
      jest.spyOn(global, "fetch").mockResolvedValue({ ok: false, status: 503 } as Response);
      const { controller } = createController();

      const result = await controller.detailed();

      const ai = result.services.find((service) => service.key === "ai");
      expect(ai?.status).toBe("unavailable");
      expect(result.status).toBe("degraded");
      expect(
        result.services.find((service) => service.key === "database")?.status,
      ).toBe("healthy");
    });

    it("marks Keycloak unavailable when the identity server cannot be reached", async () => {
      jest.spyOn(global, "fetch").mockRejectedValue(new Error("connection refused"));
      const { controller } = createController();

      const result = await controller.detailed();

      expect(
        result.services.find((service) => service.key === "keycloak")?.status,
      ).toBe("unavailable");
      expect(result.status).toBe("degraded");
    });

    it("is restricted to administrators", () => {
      expect(
        Reflect.getMetadata(ROLES_KEY, HealthController.prototype.detailed),
      ).toEqual(["administrator"]);

      const guard = new RolesGuard(new Reflector());
      expect(
        guard.canActivate(createGuardContext(["administrator"])),
      ).toBe(true);

      expect(() => guard.canActivate(createGuardContext(["worker"]))).toThrow(
        ForbiddenException,
      );
      expect(() => guard.canActivate(createGuardContext(["manager"]))).toThrow(
        ForbiddenException,
      );
      expect(() => guard.canActivate(createGuardContext([]))).toThrow(
        ForbiddenException,
      );
    });
  });
});

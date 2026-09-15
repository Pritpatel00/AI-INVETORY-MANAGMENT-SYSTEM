import { generateKeyPairSync } from "node:crypto";
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { sign } from "jsonwebtoken";

import { PrismaService } from "../prisma/prisma.service";
import type { AuthenticatedRequest } from "./auth-user";
import { LocalJwtService } from "./local-jwt.service";
import { KeycloakAuthGuard } from "./keycloak-auth.guard";

function makeContext(request: AuthenticatedRequest) {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as never;
}

function makeRequest(path: string): AuthenticatedRequest {
  return {
    path,
    headers: {},
    socket: { remoteAddress: "127.0.0.1" },
  } as unknown as AuthenticatedRequest;
}

const baseUser: {
  id: string;
  employeeId: string;
  email: string;
  displayName: string;
  role: string;
  active: boolean;
  lastLoginAt: Date | null;
  mustChangePassword: boolean;
  authVersion: number;
  legacyKeycloakSubject: string | null;
} = {
  id: "user-1",
  employeeId: "WORKER1",
  email: "worker1@example.com",
  displayName: "Worker One",
  role: "WORKER",
  active: true,
  lastLoginAt: new Date(),
  mustChangePassword: false,
  authVersion: 0,
  legacyKeycloakSubject: null,
};

describe("KeycloakAuthGuard dual authentication", () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalIssuer = process.env.JWT_ISSUER;
  const originalAudience = process.env.JWT_AUDIENCE;
  const originalKeycloakIssuer = process.env.KEYCLOAK_ISSUER;
  const originalKeycloakAudience = process.env.KEYCLOAK_AUDIENCE;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret-that-is-at-least-32-bytes-long";
    process.env.JWT_ISSUER = "nirka-inventory-api";
    process.env.JWT_AUDIENCE = "nirka-inventory-api";
    process.env.KEYCLOAK_ISSUER = "https://keycloak.example.com/realms/nirka";
    process.env.KEYCLOAK_AUDIENCE = "nirka-inventory-api";
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
    process.env.JWT_ISSUER = originalIssuer;
    process.env.JWT_AUDIENCE = originalAudience;
    process.env.KEYCLOAK_ISSUER = originalKeycloakIssuer;
    process.env.KEYCLOAK_AUDIENCE = originalKeycloakAudience;
  });

  function createLocalGuard(user = baseUser, sessionOverrides = {}) {
    const localJwt = new LocalJwtService();
    const reflector = { getAllAndOverride: jest.fn(() => false) };
    const prisma = {
      user: {
        findUnique: jest.fn(async ({ where }: { where: { id?: string } }) =>
          where.id === user.id ? user : null,
        ),
        update: jest.fn(),
      },
      authSession: {
        findUnique: jest.fn(async () => ({
          id: "session-1",
          userId: user.id,
          expiresAt: new Date(Date.now() + 60_000),
          revokedAt: null,
          ...sessionOverrides,
        })),
      },
    };
    return {
      guard: new KeycloakAuthGuard(
        reflector as never,
        prisma as unknown as PrismaService,
        localJwt,
      ),
      localJwt,
      prisma,
    };
  }

  it("accepts local tokens on protected business routes and attaches canonical identity", async () => {
    const { guard, localJwt } = createLocalGuard();
    const request = makeRequest("/api/inventory/transactions");
    request.headers.authorization = `Bearer ${localJwt.signAccessToken({
      userId: baseUser.id,
      sessionId: "session-1",
      authVersion: 0,
    }).accessToken}`;

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
    expect(request.authUser).toMatchObject({
      provider: "local",
      userId: "user-1",
      employeeId: "WORKER1",
      displayName: "Worker One",
      role: "WORKER",
      roles: ["worker"],
    });
  });

  it("resolves local identity from the JWT subject and not token roles", async () => {
    const { guard, localJwt, prisma } = createLocalGuard({
      ...baseUser,
      role: "WORKER",
    });
    const request = makeRequest("/api/auth/me");
    request.headers.authorization = `Bearer ${localJwt.signAccessToken({
      userId: "user-1",
      sessionId: "session-1",
      authVersion: 0,
    }).accessToken}`;

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user-1" } }),
    );
    expect(request.authUser?.role).toBe("WORKER");
  });

  it("rejects local tokens when the database user is inactive", async () => {
    const { guard, localJwt } = createLocalGuard({ ...baseUser, active: false });
    const request = makeRequest("/api/inventory/transactions");
    request.headers.authorization = `Bearer ${localJwt.signAccessToken({
      userId: baseUser.id,
      sessionId: "session-1",
      authVersion: 0,
    }).accessToken}`;

    await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("does not restore a revoked local session after user reactivation", async () => {
    const { guard, localJwt } = createLocalGuard(baseUser, {
      revokedAt: new Date(),
    });
    const request = makeRequest("/api/auth/me");
    request.headers.authorization = `Bearer ${localJwt.signAccessToken({
      userId: baseUser.id,
      sessionId: "session-1",
      authVersion: 0,
    }).accessToken}`;

    await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("invalidates local access tokens when authVersion changes", async () => {
    const { guard, localJwt } = createLocalGuard({ ...baseUser, authVersion: 1 });
    const request = makeRequest("/api/auth/me");
    request.headers.authorization = `Bearer ${localJwt.signAccessToken({
      userId: baseUser.id,
      sessionId: "session-1",
      authVersion: 0,
    }).accessToken}`;

    await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("blocks local business access during forced-password state", async () => {
    const { guard, localJwt } = createLocalGuard({
      ...baseUser,
      mustChangePassword: true,
    });
    const request = makeRequest("/api/inventory/transactions");
    request.headers.authorization = `Bearer ${localJwt.signAccessToken({
      userId: baseUser.id,
      sessionId: "session-1",
      authVersion: 0,
    }).accessToken}`;

    await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  function createKeycloakGuard(
    user = baseUser,
    claims: Record<string, unknown> = {},
  ) {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    const reflector = { getAllAndOverride: jest.fn(() => false) };
    const prisma = {
      user: {
        findUnique: jest.fn(async ({ where }: { where: Record<string, string> }) => {
          if (where.legacyKeycloakSubject) {
            return where.legacyKeycloakSubject === user.legacyKeycloakSubject
              ? user
              : null;
          }
          if (where.employeeId) {
            return where.employeeId === user.employeeId ? user : null;
          }
          if (where.email) return where.email === user.email ? user : null;
          return null;
        }),
        update: jest.fn(),
      },
    };
    const guard = new KeycloakAuthGuard(
      reflector as never,
      prisma as unknown as PrismaService,
      new LocalJwtService(),
    );
    (guard as unknown as { keyClient: unknown }).keyClient = {
      getSigningKey: jest.fn(async () => ({
        getPublicKey: () => publicKey.export({ type: "spki", format: "pem" }),
      })),
    };
    const token = sign(
      {
        preferred_username: user.employeeId,
        email: user.email,
        realm_access: { roles: ["administrator"] },
        ...claims,
      },
      privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
      {
        algorithm: "RS256",
        keyid: "test-key",
        issuer: process.env.KEYCLOAK_ISSUER,
        audience: process.env.KEYCLOAK_AUDIENCE,
        subject: "keycloak-subject-1",
        expiresIn: "10m",
      },
    );
    return { guard, prisma, token };
  }

  it("maps a Keycloak token by legacy subject first and ignores realm roles", async () => {
    const { guard, token } = createKeycloakGuard({
      ...baseUser,
      role: "WORKER",
      legacyKeycloakSubject: "keycloak-subject-1",
    });
    const request = makeRequest("/api/inventory/transactions");
    request.headers.authorization = `Bearer ${token}`;

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
    expect(request.authUser).toMatchObject({
      provider: "keycloak",
      userId: "user-1",
      role: "WORKER",
      roles: ["worker"],
    });
  });

  it("falls back to employeeId and records the legacy Keycloak subject", async () => {
    const { guard, prisma, token } = createKeycloakGuard(baseUser);
    const request = makeRequest("/api/auth/me");
    request.headers.authorization = `Bearer ${token}`;

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: baseUser.id },
      data: { legacyKeycloakSubject: "keycloak-subject-1" },
    });
  });

  it("falls back to email when the Keycloak username is unavailable", async () => {
    const { guard, prisma, token } = createKeycloakGuard(baseUser, {
      preferred_username: undefined,
    });
    const request = makeRequest("/api/auth/me");
    request.headers.authorization = `Bearer ${token}`;

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: baseUser.id },
      data: { legacyKeycloakSubject: "keycloak-subject-1" },
    });
  });

  it("rejects unknown Keycloak users and inactive mapped users", async () => {
    const unknown = createKeycloakGuard(baseUser, {
      preferred_username: "UNKNOWN",
      email: "unknown@example.com",
    });
    const unknownRequest = makeRequest("/api/auth/me");
    unknownRequest.headers.authorization = `Bearer ${unknown.token}`;
    await expect(
      unknown.guard.canActivate(makeContext(unknownRequest)),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    const inactive = createKeycloakGuard({ ...baseUser, active: false });
    const inactiveRequest = makeRequest("/api/auth/me");
    inactiveRequest.headers.authorization = `Bearer ${inactive.token}`;
    await expect(
      inactive.guard.canActivate(makeContext(inactiveRequest)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("does not enforce local forced-password state for Keycloak sessions", async () => {
    const { guard, token } = createKeycloakGuard({
      ...baseUser,
      mustChangePassword: true,
    });
    const request = makeRequest("/api/inventory/transactions");
    request.headers.authorization = `Bearer ${token}`;

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
  });
});

import { UnauthorizedException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import {
  REFRESH_SESSION_ABSOLUTE_TTL_MS,
  REFRESH_SESSION_IDLE_TTL_MS,
} from "./auth.constants";
import { SessionService } from "./session.service";

describe("SessionService", () => {
  const now = new Date("2026-08-27T00:00:00.000Z");

  function createDatabase() {
    const transaction = {
      authRefreshToken: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      authSession: {
        updateMany: jest.fn(),
        update: jest.fn(),
      },
    };
    const database = {
      authSession: { create: jest.fn() },
      authRefreshToken: transaction.authRefreshToken,
      $transaction: jest.fn(async (callback: (tx: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    };
    return { database, transaction };
  }

  it("creates a 30-day session with a 7-day refresh-token window", async () => {
    const { database } = createDatabase();
    database.authSession.create.mockImplementation(async ({ data }) => ({
      id: data.id,
      expiresAt: data.expiresAt,
    }));
    const service = new SessionService(database as unknown as PrismaService);

    const issued = await service.createSession(
      "user-1",
      { userAgent: "test-agent", ipAddress: "127.0.0.1" },
      now,
    );
    const createInput = database.authSession.create.mock.calls[0][0];
    const nestedRefreshToken = createInput.data.refreshTokens.create;

    expect(issued.sessionId).toBe(createInput.data.id);
    expect(issued.rawToken).toEqual(expect.any(String));
    expect(issued.rawToken).not.toBe(nestedRefreshToken.tokenHash);
    expect(nestedRefreshToken.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(issued.expiresAt).toEqual(
      new Date(now.getTime() + REFRESH_SESSION_IDLE_TTL_MS),
    );
    expect(issued.sessionExpiresAt).toEqual(
      new Date(now.getTime() + REFRESH_SESSION_ABSOLUTE_TTL_MS),
    );
  });

  it("atomically marks a refresh token used and persists its replacement", async () => {
    const { database, transaction } = createDatabase();
    const service = new SessionService(database as unknown as PrismaService);
    const oldRawToken = "old-refresh-token";
    const session = {
      id: "session-1",
      userId: "user-1",
      createdAt: now,
      lastUsedAt: now,
      expiresAt: new Date(now.getTime() + REFRESH_SESSION_ABSOLUTE_TTL_MS),
      revokedAt: null,
      revokedReason: null,
      userAgent: null,
      ipAddress: null,
    };
    transaction.authRefreshToken.findUnique.mockResolvedValue({
      id: "refresh-1",
      sessionId: session.id,
      tokenHash: service.hashRefreshToken(oldRawToken),
      issuedAt: now,
      expiresAt: new Date(now.getTime() + REFRESH_SESSION_IDLE_TTL_MS),
      usedAt: null,
      session,
    });
    transaction.authRefreshToken.updateMany.mockResolvedValue({ count: 1 });

    const issued = await service.rotateRefreshToken(oldRawToken, now);
    const replacement = transaction.authRefreshToken.create.mock.calls[0][0];

    expect(transaction.authRefreshToken.updateMany).toHaveBeenCalledWith({
      where: { id: "refresh-1", usedAt: null },
      data: { usedAt: now },
    });
    expect(replacement.data.sessionId).toBe(session.id);
    expect(replacement.data.tokenHash).not.toBe(issued.rawToken);
    expect(replacement.data.tokenHash).toBe(service.hashRefreshToken(issued.rawToken));
    expect(transaction.authSession.update).toHaveBeenCalledWith({
      where: { id: session.id },
      data: { lastUsedAt: now },
    });
  });

  it("revokes the session when a refresh token is replayed", async () => {
    const { database, transaction } = createDatabase();
    const service = new SessionService(database as unknown as PrismaService);
    const session = {
      id: "session-1",
      userId: "user-1",
      createdAt: now,
      lastUsedAt: now,
      expiresAt: new Date(now.getTime() + REFRESH_SESSION_ABSOLUTE_TTL_MS),
      revokedAt: null,
      revokedReason: null,
      userAgent: null,
      ipAddress: null,
    };
    transaction.authRefreshToken.findUnique.mockResolvedValue({
      id: "refresh-1",
      sessionId: session.id,
      tokenHash: service.hashRefreshToken("replayed-token"),
      issuedAt: now,
      expiresAt: new Date(now.getTime() + REFRESH_SESSION_IDLE_TTL_MS),
      usedAt: now,
      session,
    });

    await expect(
      service.rotateRefreshToken("replayed-token", now),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(transaction.authSession.updateMany).toHaveBeenCalledWith({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: now, revokedReason: "refresh_token_reuse" },
    });
  });

  it("rejects an expired session and records the revocation", async () => {
    const { database, transaction } = createDatabase();
    const service = new SessionService(database as unknown as PrismaService);
    const session = {
      id: "session-1",
      userId: "user-1",
      createdAt: now,
      lastUsedAt: now,
      expiresAt: new Date(now.getTime() - 1),
      revokedAt: null,
      revokedReason: null,
      userAgent: null,
      ipAddress: null,
    };
    transaction.authRefreshToken.findUnique.mockResolvedValue({
      id: "refresh-1",
      sessionId: session.id,
      tokenHash: service.hashRefreshToken("expired-token"),
      issuedAt: now,
      expiresAt: new Date(now.getTime() + REFRESH_SESSION_IDLE_TTL_MS),
      usedAt: null,
      session,
    });

    await expect(service.rotateRefreshToken("expired-token", now)).rejects.toThrow(
      "refresh session is no longer active",
    );
    expect(transaction.authSession.updateMany).toHaveBeenCalledWith({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: now, revokedReason: "expired" },
    });
  });

  it("rejects an expired refresh token even when its session remains active", async () => {
    const { database, transaction } = createDatabase();
    const service = new SessionService(database as unknown as PrismaService);
    const session = {
      id: "session-1",
      userId: "user-1",
      createdAt: now,
      lastUsedAt: now,
      expiresAt: new Date(now.getTime() + REFRESH_SESSION_ABSOLUTE_TTL_MS),
      revokedAt: null,
      revokedReason: null,
      userAgent: null,
      ipAddress: null,
    };
    transaction.authRefreshToken.findUnique.mockResolvedValue({
      id: "refresh-1",
      sessionId: session.id,
      tokenHash: service.hashRefreshToken("expired-token"),
      issuedAt: now,
      expiresAt: new Date(now.getTime() - 1),
      usedAt: null,
      session,
    });

    await expect(service.rotateRefreshToken("expired-token", now)).rejects.toThrow(
      "refresh session is no longer active",
    );
    expect(transaction.authSession.updateMany).toHaveBeenCalledWith({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: now, revokedReason: "expired" },
    });
  });
});

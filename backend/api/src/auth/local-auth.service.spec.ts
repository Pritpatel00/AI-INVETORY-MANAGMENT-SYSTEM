import { UnauthorizedException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { ChangePasswordDto, LoginDto } from "./dto/local-auth.dto";
import { LocalAuthService } from "./local-auth.service";

const now = new Date("2026-08-27T00:00:00.000Z");

function makeUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "user-1",
    employeeId: "WORKER1",
    email: "worker1@example.com",
    displayName: "Worker One",
    role: "WORKER",
    shift: "Day",
    warehouseZone: "Zone A",
    active: true,
    lastLoginAt: null,
    passwordHash: "stored-password-hash",
    passwordChangedAt: null,
    mustChangePassword: false,
    authVersion: 0,
    ...overrides,
  };
}

function makeIssued(userId = "user-1") {
  return {
    userId,
    sessionId: "session-1",
    rawToken: "raw-refresh-token",
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    sessionExpiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
  };
}

function createService(user = makeUser()) {
  const transaction = {
    user: { update: jest.fn() },
    authSession: { updateMany: jest.fn() },
  };
  const prisma = {
    user: {
      findFirst: jest.fn(async () => user),
      findUnique: jest.fn(async () => user),
      update: jest.fn(async () => user),
    },
    $transaction: jest.fn(async (callback: (tx: typeof transaction) => unknown) =>
      callback(transaction),
    ),
  };
  const passwords = {
    verify: jest.fn(async () => true),
    hash: jest.fn(async () => "new-password-hash"),
  };
  const sessions = {
    createSession: jest.fn(async () => makeIssued(user.id as string)),
    rotateRefreshToken: jest.fn(async () => makeIssued(user.id as string)),
    revokeSession: jest.fn(),
    revokeRefreshToken: jest.fn(),
  };
  const jwt = {
    signAccessToken: jest.fn(() => ({
      accessToken: "access-token",
      tokenType: "Bearer" as const,
      expiresIn: 600,
    })),
    verifyAccessToken: jest.fn(() => ({ sid: "session-1" })),
  };
  const service = new LocalAuthService(
    prisma as unknown as PrismaService,
    passwords as never,
    sessions as never,
    jwt as never,
  );
  return { service, prisma, passwords, sessions, jwt, transaction };
}

describe("LocalAuthService", () => {
  it.each([
    ["ADMIN1", "ADMINISTRATOR"], ["MANAGER1", "MANAGER"], ["WORKER1", "WORKER"],
  ])("returns the canonical role after valid local login for %s", async (employeeId, role) => {
    const { service } = createService(makeUser({ employeeId, role }));
    const result = await service.login({ identifier: employeeId.toLowerCase(), password: "valid-test-password" });
    expect(result.response.user).toMatchObject({ employeeId, role });
  });
  it("successfully logs in a local user and returns no refresh token in the response", async () => {
    const { service, sessions, prisma } = createService();

    const result = await service.login(
      { identifier: "worker1@example.com", password: "password" } as LoginDto,
      { userAgent: "test", ipAddress: "127.0.0.1" },
    );

    expect(result.response).toMatchObject({
      accessToken: "access-token",
      tokenType: "Bearer",
      expiresIn: 600,
      user: { id: "user-1", role: "WORKER", localAuthEnabled: true },
    });
    expect(result.response).not.toHaveProperty("rawToken");
    expect(sessions.createSession).toHaveBeenCalledWith(
      "user-1",
      { userAgent: "test", ipAddress: "127.0.0.1" },
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { lastLoginAt: expect.any(Date) },
    });
  });

  it("returns a generic credentials error for a wrong password", async () => {
    const { service, passwords, sessions } = createService();
    passwords.verify.mockResolvedValue(false);

    await expect(
      service.login({ identifier: "WORKER1", password: "wrong" } as LoginDto),
    ).rejects.toEqual(new UnauthorizedException("Invalid credentials."));
    expect(sessions.createSession).not.toHaveBeenCalled();
  });

  it("rejects inactive users with the same generic credentials error", async () => {
    const { service, sessions } = createService(makeUser({ active: false }));

    await expect(
      service.login({ identifier: "WORKER1", password: "password" } as LoginDto),
    ).rejects.toEqual(new UnauthorizedException("Invalid credentials."));
    expect(sessions.createSession).not.toHaveBeenCalled();
  });

  it("rejects passwordless users from local login", async () => {
    const { service, sessions } = createService(makeUser({ passwordHash: null }));

    await expect(
      service.login({ identifier: "WORKER1", password: "password" } as LoginDto),
    ).rejects.toEqual(new UnauthorizedException("Invalid credentials."));
    expect(sessions.createSession).not.toHaveBeenCalled();
  });

  it("preserves mustChangePassword in the authenticated profile", async () => {
    const { service } = createService(makeUser({ mustChangePassword: true }));

    const result = await service.login({
      identifier: "WORKER1",
      password: "temporary-password",
    } as LoginDto);

    expect(result.response.user.mustChangePassword).toBe(true);
  });

  it("refreshes through the rotated session and never returns the raw token", async () => {
    const { service, sessions } = createService();

    const result = await service.refresh("old-refresh-token");

    expect(sessions.rotateRefreshToken).toHaveBeenCalledWith("old-refresh-token");
    expect(result.response).not.toHaveProperty("rawToken");
    expect(result.session.rawToken).toBe("raw-refresh-token");
  });

  it("revokes a local session idempotently on logout", async () => {
    const { service, sessions } = createService();

    await expect(service.logout("session-1", "refresh-token")).resolves.toBeUndefined();
    await expect(service.logout("session-1", "refresh-token")).resolves.toBeUndefined();
    expect(sessions.revokeSession).toHaveBeenCalledTimes(2);
    expect(sessions.revokeRefreshToken).toHaveBeenCalledTimes(2);
  });

  it("changes the password, increments authVersion, revokes old sessions, and issues a fresh session", async () => {
    const user = makeUser();
    const { service, passwords, sessions, transaction } = createService(user);
    const updatedUser = makeUser({
      passwordHash: "new-password-hash",
      passwordChangedAt: now,
      mustChangePassword: false,
      authVersion: 1,
    });
    transaction.user.update.mockResolvedValue(updatedUser);

    const result = await service.changePassword(
      "user-1",
      {
        currentPassword: "temporary-password",
        newPassword: "a-new-password-that-is-long-enough",
      } as ChangePasswordDto,
      { userAgent: "test" },
    );

    expect(passwords.hash).toHaveBeenCalledWith(
      "a-new-password-that-is-long-enough",
    );
    expect(transaction.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({
          passwordHash: "new-password-hash",
          mustChangePassword: false,
          authVersion: { increment: 1 },
        }),
      }),
    );
    expect(transaction.authSession.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", revokedAt: null },
      data: { revokedAt: expect.any(Date), revokedReason: "password_changed" },
    });
    expect(sessions.createSession).toHaveBeenCalledWith("user-1", {
      userAgent: "test",
    });
    expect(result.response.user).toMatchObject({
      mustChangePassword: false,
      localAuthEnabled: true,
    });
  });

  it("rejects a wrong current password before changing anything", async () => {
    const { service, passwords, sessions, prisma } = createService();
    passwords.verify.mockResolvedValue(false);

    await expect(
      service.changePassword("user-1", {
        currentPassword: "wrong",
        newPassword: "a-new-password-that-is-long-enough",
      } as ChangePasswordDto),
    ).rejects.toEqual(new UnauthorizedException("Current password is incorrect."));
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(sessions.createSession).not.toHaveBeenCalled();
  });

  it("returns the canonical PostgreSQL profile for /auth/me", async () => {
    const { service } = createService();

    await expect(service.me("user-1")).resolves.toMatchObject({
      id: "user-1",
      employeeId: "WORKER1",
      email: "worker1@example.com",
      role: "WORKER",
      active: true,
      authProvider: "local",
    });
  });
});

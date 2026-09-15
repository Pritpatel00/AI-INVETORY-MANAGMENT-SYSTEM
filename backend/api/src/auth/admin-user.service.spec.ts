import { ForbiddenException, ConflictException } from "@nestjs/common";
import { UserRole } from "@prisma/client";

import type { AuthenticatedUser } from "./auth-user";
import { AdminUserService } from "./admin-user.service";
import { KeycloakAdminService } from "./keycloak-admin.service";
import { PasswordService } from "./password.service";
import { SessionService } from "./session.service";
import { PrismaService } from "../prisma/prisma.service";

const actor: AuthenticatedUser = {
  subject: "admin-subject",
  username: "ADMIN1",
  employeeId: "ADMIN1",
  email: "admin@example.com",
  roles: ["administrator"],
  userId: "admin-1",
  role: UserRole.ADMINISTRATOR,
  provider: "local",
};

const worker = {
  id: "user-1",
  employeeId: "WORKER1",
  email: "worker1@example.com",
  displayName: "Worker One",
  role: UserRole.WORKER,
  shift: "Day",
  warehouseZone: "Zone A",
  active: true,
  lastLoginAt: null,
  mustChangePassword: false,
  authVersion: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { createdTransactions: 0, assignedTasks: 0 },
};

const input = {
  employeeId: "worker1",
  email: "worker1@example.com",
  displayName: "Worker One",
  role: "WORKER" as const,
  shift: "Day",
  warehouseZone: "Zone A",
  temporaryPassword: "Temporary@123",
};

function createService(overrides: Record<string, unknown> = {}) {
  const prisma: any = {
    user: {
      findFirst: jest.fn(async () => null),
      findUnique: jest.fn(async () => worker),
      create: jest.fn(async () => worker),
      update: jest.fn(async () => worker),
    },
    authSession: { updateMany: jest.fn(async () => ({ count: 1 })) },
    userAccessAudit: { create: jest.fn(async () => ({})), findMany: jest.fn() },
    $transaction: jest.fn(async (callback: (database: unknown) => unknown) =>
      callback(prisma),
    ),
  };
  const passwords = {
    hash: jest.fn(async () => "$argon2id$v=19$test-hash"),
  };
  const sessions = {};
  const keycloak = {
    syncCreateUser: jest.fn(async () => ({ status: "synchronized" as const })),
    syncUpdateUser: jest.fn(async () => ({ status: "synchronized" as const })),
    syncPasswordReset: jest.fn(async () => ({ status: "synchronized" as const })),
    syncStatus: jest.fn(async () => ({ status: "synchronized" as const })),
    ...overrides,
  };
  return {
    service: new AdminUserService(
      prisma as unknown as PrismaService,
      passwords as unknown as PasswordService,
      sessions as unknown as SessionService,
      keycloak as unknown as KeycloakAdminService,
    ),
    prisma,
    passwords,
    keycloak,
  };
}

describe("AdminUserService PostgreSQL-authoritative administration", () => {
  it("creates a local user with an Argon2id hash and forced password change", async () => {
    const { service, prisma, passwords, keycloak } = createService();

    const result = await service.create(input, actor);
    const createArgs = prisma.user.create.mock.calls[0][0];

    expect(passwords.hash).toHaveBeenCalledWith(input.temporaryPassword);
    expect(createArgs.data.passwordHash).toBe("$argon2id$v=19$test-hash");
    expect(createArgs.data.passwordHash).not.toBe(input.temporaryPassword);
    expect(createArgs.data).toEqual(
      expect.objectContaining({
        active: true,
        mustChangePassword: true,
        passwordChangedAt: null,
        authVersion: 0,
        role: UserRole.WORKER,
      }),
    );
    expect(prisma.userAccessAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "USER_CREATED",
        details: expect.not.stringContaining(input.temporaryPassword),
      }),
    });
    expect(keycloak.syncCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ temporaryPassword: input.temporaryPassword }),
    );
    expect(result.compatibilitySync).toEqual({ status: "synchronized" });
  });

  it.each([
    ["employeeId", { id: "existing-user" }],
    ["email", { id: "existing-user" }],
  ])("rejects duplicate %s without creating a user", async (_field, duplicate) => {
    const { service, prisma, passwords } = createService();
    prisma.user.findFirst.mockResolvedValue(duplicate);

    await expect(service.create(input, actor)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(passwords.hash).not.toHaveBeenCalled();
  });

  it("updates PostgreSQL first, increments authVersion, and revokes sessions on role change", async () => {
    const updated = { ...worker, role: UserRole.MANAGER, authVersion: 1 };
    const { service, prisma, keycloak } = createService();
    prisma.user.update.mockResolvedValue(updated);

    const result = await service.update(
      "user-1",
      { ...input, role: "MANAGER", shift: undefined, warehouseZone: undefined },
      actor,
    );

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({
          role: UserRole.MANAGER,
          authVersion: { increment: 1 },
        }),
      }),
    );
    expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", revokedAt: null },
      data: { revokedAt: expect.any(Date), revokedReason: "role_changed" },
    });
    expect(prisma.userAccessAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "USER_ROLE_CHANGED" }),
    });
    expect(keycloak.syncUpdateUser).toHaveBeenCalled();
    expect(result.compatibilitySync.status).toBe("synchronized");
  });

  it("does not roll back the authoritative update when Keycloak synchronization fails", async () => {
    const updated = { ...worker, displayName: "Updated Worker" };
    const { service, prisma } = createService({
      syncUpdateUser: jest.fn(async () => ({
        status: "failed" as const,
        message: "compatibility sync failed",
      })),
    });
    prisma.user.update.mockResolvedValue(updated);

    const result = await service.update(
      "user-1",
      { ...input, displayName: "Updated Worker" },
      actor,
    );

    expect(prisma.user.update).toHaveBeenCalled();
    expect(result.compatibilitySync).toEqual({
      status: "failed",
      message: "compatibility sync failed",
    });
  });

  it("records USER_UPDATED when profile fields change without a role change", async () => {
    const updated = { ...worker, displayName: "Updated Worker" };
    const { service, prisma } = createService();
    prisma.user.update.mockResolvedValue(updated);

    await service.update(
      "user-1",
      { ...input, displayName: "Updated Worker" },
      actor,
    );

    expect(prisma.userAccessAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "USER_UPDATED" }),
    });
  });

  it("resets and hashes a temporary password while revoking all local sessions", async () => {
    const { service, prisma, passwords, keycloak } = createService({
      syncPasswordReset: jest.fn(async () => ({
        status: "failed" as const,
        message: "compatibility sync failed",
      })),
    });

    const result = await service.resetPassword(
      "user-1",
      { temporaryPassword: "NewTemporary@456" },
      actor,
    );
    const updateArgs = prisma.user.update.mock.calls[0][0];

    expect(passwords.hash).toHaveBeenCalledWith("NewTemporary@456");
    expect(updateArgs.data.passwordHash).toBe("$argon2id$v=19$test-hash");
    expect(updateArgs.data.passwordHash).not.toBe("NewTemporary@456");
    expect(updateArgs.data).toEqual(
      expect.objectContaining({
        mustChangePassword: true,
        passwordChangedAt: expect.any(Date),
        authVersion: { increment: 1 },
      }),
    );
    expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", revokedAt: null },
      data: { revokedAt: expect.any(Date), revokedReason: "password_reset" },
    });
    expect(keycloak.syncPasswordReset).toHaveBeenCalled();
    expect(prisma.userAccessAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "PASSWORD_RESET",
        details: expect.not.stringContaining("NewTemporary@456"),
      }),
    });
    expect(result.compatibilitySync.status).toBe("failed");
  });

  it("deactivates locally first, increments authVersion, and revokes sessions", async () => {
    const updated = { ...worker, active: false, authVersion: 1 };
    const { service, prisma, keycloak } = createService({
      syncStatus: jest.fn(async () => ({
        status: "failed" as const,
        message: "compatibility sync failed",
      })),
    });
    prisma.user.update.mockResolvedValue(updated);

    const result = await service.setStatus("user-1", false, actor);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          active: false,
          authVersion: { increment: 1 },
        }),
      }),
    );
    expect(prisma.authSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", revokedAt: null },
        data: { revokedAt: expect.any(Date), revokedReason: "user_deactivated" },
      }),
    );
    expect(keycloak.syncStatus).toHaveBeenCalledWith({
      employeeId: worker.employeeId,
      active: false,
    });
    expect(prisma.userAccessAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "USER_DEACTIVATED" }),
    });
    expect(result.compatibilitySync.status).toBe("failed");
  });

  it("reactivates without restoring previously revoked sessions", async () => {
    const inactive = { ...worker, active: false, authVersion: 1 };
    const updated = { ...inactive, active: true };
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(inactive);
    prisma.user.update.mockResolvedValue(updated);

    await service.setStatus("user-1", true, actor);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { active: true } }),
    );
    expect(prisma.authSession.updateMany).not.toHaveBeenCalled();
    expect(prisma.userAccessAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "USER_ACTIVATED" }),
    });
  });

  it("preserves self-deactivation protection", async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({ ...worker, id: actor.userId });

    await expect(service.setStatus("admin-1", false, actor)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("keeps the local account when Keycloak creation synchronization fails", async () => {
    const { service, prisma } = createService({
      syncCreateUser: jest.fn(async () => ({
        status: "failed" as const,
        message: "PostgreSQL create succeeded, but the Keycloak compatibility mirror could not be synchronized.",
      })),
    });

    const result = await service.create(input, actor);

    expect(prisma.user.create).toHaveBeenCalled();
    expect(result.id).toBe(worker.id);
    expect(result.compatibilitySync.status).toBe("failed");
    expect((prisma.user as { delete?: jest.Mock }).delete).toBeUndefined();
  });

  it("preserves administrator update and reset restrictions", async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({
      ...worker,
      role: UserRole.ADMINISTRATOR,
    });

    await expect(service.update("user-1", input, actor)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(
      service.resetPassword("user-1", { temporaryPassword: "NewTemp@123" }, actor),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";

import type { AuthenticatedUser } from "./auth-user";
import { KeycloakAdminService, type CompatibilitySyncResult } from "./keycloak-admin.service";
import { PasswordService } from "./password.service";
import { SessionService } from "./session.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSystemUserDto } from "./dto/create-system-user.dto";
import { ResetSystemUserPasswordDto } from "./dto/reset-system-user-password.dto";
import { UpdateSystemUserDto } from "./dto/update-system-user.dto";

const ADMIN_USER_SELECT = {
  id: true,
  employeeId: true,
  email: true,
  displayName: true,
  role: true,
  shift: true,
  warehouseZone: true,
  active: true,
  lastLoginAt: true,
  mustChangePassword: true,
  authVersion: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { createdTransactions: true, assignedTasks: true } },
} as const;

@Injectable()
export class AdminUserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
    private readonly keycloak: KeycloakAdminService,
  ) {}

  list() {
    return this.prisma.user.findMany({
      orderBy: [{ active: "desc" }, { displayName: "asc" }],
      select: ADMIN_USER_SELECT,
    });
  }

  async create(input: CreateSystemUserDto, actor: AuthenticatedUser) {
    const employeeId = input.employeeId.trim().toUpperCase();
    const email = input.email.trim().toLowerCase();
    const displayName = input.displayName.trim();
    const role = this.toUserRole(input.role);
    const shift = role === UserRole.WORKER ? input.shift?.trim() || null : null;
    const warehouseZone =
      role === UserRole.WORKER ? input.warehouseZone?.trim() || null : null;
    await this.assertUnique(employeeId, email);

    const passwordHash = await this.passwords.hash(input.temporaryPassword);
    let createdUser;
    try {
      createdUser = await this.prisma.user.create({
        data: {
          employeeId,
          email,
          displayName,
          role,
          shift,
          warehouseZone,
          passwordHash,
          passwordChangedAt: null,
          mustChangePassword: true,
          authVersion: 0,
          active: true,
        },
        select: ADMIN_USER_SELECT,
      });
    } catch (error) {
      this.throwDuplicateConflict(error);
      throw error;
    }

    await this.recordAudit(
      "USER_CREATED",
      actor,
      createdUser,
      `Role: ${createdUser.role}; shift: ${createdUser.shift ?? "Not assigned"}; zone: ${createdUser.warehouseZone ?? "Not assigned"}`,
    );
    const compatibilitySync = await this.keycloak.syncCreateUser({
      employeeId,
      email,
      displayName,
      role: input.role,
      active: true,
      temporaryPassword: input.temporaryPassword,
    });
    return this.withCompatibilitySync(createdUser, compatibilitySync);
  }

  async update(id: string, input: UpdateSystemUserDto, actor: AuthenticatedUser) {
    const currentUser = await this.prisma.user.findUnique({ where: { id } });
    if (!currentUser) throw new NotFoundException("User account was not found.");
    if (currentUser.role === UserRole.ADMINISTRATOR) {
      throw new ForbiddenException(
        "Administrator accounts cannot be changed from this screen.",
      );
    }

    const employeeId = input.employeeId.trim().toUpperCase();
    const email = input.email.trim().toLowerCase();
    const displayName = input.displayName.trim();
    const role = this.toUserRole(input.role);
    const shift = role === UserRole.WORKER ? input.shift?.trim() || null : null;
    const warehouseZone =
      role === UserRole.WORKER ? input.warehouseZone?.trim() || null : null;
    await this.assertUnique(employeeId, email, id);

    const roleChanged = currentUser.role !== role;
    const now = new Date();
    const updatedUser = await this.prisma.$transaction(async (database) => {
      const updated = await database.user.update({
        where: { id },
        data: {
          employeeId,
          email,
          displayName,
          role,
          shift,
          warehouseZone,
          ...(roleChanged ? { authVersion: { increment: 1 } } : {}),
        },
        select: ADMIN_USER_SELECT,
      });
      if (roleChanged) {
        await database.authSession.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: now, revokedReason: "role_changed" },
        });
      }
      return updated;
    });

    await this.recordAudit(
      roleChanged ? "USER_ROLE_CHANGED" : "USER_UPDATED",
      actor,
      updatedUser,
      `Previous role: ${currentUser.role}; current role: ${updatedUser.role}; shift: ${updatedUser.shift ?? "Not assigned"}; zone: ${updatedUser.warehouseZone ?? "Not assigned"}`,
    );
    const compatibilitySync = await this.keycloak.syncUpdateUser({
      previousEmployeeId: currentUser.employeeId,
      employeeId,
      email,
      displayName,
      role: input.role,
      active: updatedUser.active,
    });
    return this.withCompatibilitySync(updatedUser, compatibilitySync);
  }

  async resetPassword(
    id: string,
    input: ResetSystemUserPasswordDto,
    actor: AuthenticatedUser,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User account was not found.");
    if (user.role === UserRole.ADMINISTRATOR) {
      throw new ForbiddenException(
        "Administrator passwords cannot be reset from this screen.",
      );
    }

    const now = new Date();
    const passwordHash = await this.passwords.hash(input.temporaryPassword);
    const updatedUser = await this.prisma.$transaction(async (database) => {
      const updated = await database.user.update({
        where: { id },
        data: {
          passwordHash,
          passwordChangedAt: now,
          mustChangePassword: true,
          authVersion: { increment: 1 },
        },
        select: ADMIN_USER_SELECT,
      });
      await database.authSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: now, revokedReason: "password_reset" },
      });
      return updated;
    });

    await this.recordAudit(
      "PASSWORD_RESET",
      actor,
      updatedUser,
      "Temporary password issued; password value was not recorded.",
    );
    const compatibilitySync = await this.keycloak.syncPasswordReset({
      employeeId: user.employeeId,
      temporaryPassword: input.temporaryPassword,
    });
    return {
      updated: true,
      userId: id,
      compatibilitySync,
    };
  }

  async setStatus(id: string, active: boolean, actor: AuthenticatedUser) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User account was not found.");

    const isCurrentUser = actor.userId
      ? actor.userId === user.id
      : user.employeeId === actor.username.toUpperCase() ||
        user.email === actor.email?.toLowerCase();
    if (isCurrentUser && !active) {
      throw new ForbiddenException(
        "You cannot deactivate your own Administrator account.",
      );
    }

    const now = new Date();
    const updatedUser = await this.prisma.$transaction(async (database) => {
      const updated = await database.user.update({
        where: { id },
        data: {
          active,
          ...(!active ? { authVersion: { increment: 1 } } : {}),
        },
        select: ADMIN_USER_SELECT,
      });
      if (!active) {
        await database.authSession.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: now, revokedReason: "user_deactivated" },
        });
      }
      return updated;
    });

    await this.recordAudit(
      active ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      actor,
      updatedUser,
    );
    const compatibilitySync = await this.keycloak.syncStatus({
      employeeId: user.employeeId,
      active,
    });
    return this.withCompatibilitySync(updatedUser, compatibilitySync);
  }

  listAudit() {
    return this.prisma.userAccessAudit.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  private async assertUnique(
    employeeId: string,
    email: string,
    excludeId?: string,
  ) {
    const duplicate = await this.prisma.user.findFirst({
      where: {
        ...(excludeId ? { id: { not: excludeId } } : {}),
        OR: [{ employeeId }, { email }],
      },
    });
    if (duplicate) {
      throw new ConflictException("Employee ID or email is already in use.");
    }
  }

  private toUserRole(role: "WORKER" | "MANAGER") {
    return role === "MANAGER" ? UserRole.MANAGER : UserRole.WORKER;
  }

  private throwDuplicateConflict(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException("Employee ID or email is already in use.");
    }
  }

  private withCompatibilitySync<T>(
    user: T,
    compatibilitySync: CompatibilitySyncResult,
  ) {
    return { ...user, compatibilitySync };
  }

  private recordAudit(
    action: string,
    actor: AuthenticatedUser,
    target: { id: string; employeeId: string; displayName: string },
    details?: string,
  ) {
    return this.prisma.userAccessAudit.create({
      data: {
        action,
        actorUsername: actor.username,
        actorEmail: actor.email?.toLowerCase() ?? null,
        targetUserId: target.id,
        targetEmployeeId: target.employeeId,
        targetDisplayName: target.displayName,
        details: details ?? null,
      },
    });
  }
}

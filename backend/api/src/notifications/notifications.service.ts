import { Injectable } from "@nestjs/common";
import { NotificationType, Prisma, UserRole } from "@prisma/client";

import type { AuthenticatedUser } from "../auth/auth-user";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an in-app notification for one user. When `client` is provided the
   * row is created inside the caller's transaction so stock changes and their
   * notifications commit together.
   */
  async createForUser(
    client: Prisma.TransactionClient | PrismaService,
    input: {
      userId: string;
      type: NotificationType;
      title: string;
      message: string;
      linkType?: string | null;
      linkId?: string | null;
    },
  ) {
    return client.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        linkType: input.linkType ?? null,
        linkId: input.linkId ?? null,
      },
    });
  }

  /**
   * Notify every active manager and administrator. Used when a new discrepancy
   * needs management attention. Runs inside the caller's transaction when a
   * client is provided.
   */
  async createForManagers(
    client: Prisma.TransactionClient | PrismaService,
    input: {
      type: NotificationType;
      title: string;
      message: string;
      linkType?: string | null;
      linkId?: string | null;
    },
  ) {
    const managers = await client.user.findMany({
      where: {
        active: true,
        role: { in: [UserRole.MANAGER, UserRole.ADMINISTRATOR] },
      },
      select: { id: true },
    });
    if (managers.length === 0) return;
    await client.notification.createMany({
      data: managers.map((manager) => ({
        userId: manager.id,
        type: input.type,
        title: input.title,
        message: input.message,
        linkType: input.linkType ?? null,
        linkId: input.linkId ?? null,
      })),
    });
  }

  /** List the current user's notifications, newest first. */
  async list(actor: AuthenticatedUser) {
    const user = await this.resolveUser(actor);
    return this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async unreadCount(actor: AuthenticatedUser) {
    const user = await this.resolveUser(actor);
    return this.prisma.notification.count({
      where: { userId: user.id, readAt: null },
    });
  }

  /** Mark one notification read (only if it belongs to the caller). */
  async markRead(id: string, actor: AuthenticatedUser) {
    const user = await this.resolveUser(actor);
    await this.prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { readAt: new Date() },
    });
    return { updated: true, id };
  }

  async markAllRead(actor: AuthenticatedUser) {
    const user = await this.resolveUser(actor);
    const result = await this.prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }

  private async resolveUser(actor: AuthenticatedUser) {
    const email = actor.email?.toLowerCase();
    const existing = email
      ? await this.prisma.user.findUnique({ where: { email } })
      : await this.prisma.user.findUnique({
          where: { employeeId: actor.username.toUpperCase() },
        });
    if (existing) return existing;

    const role = actor.roles.includes("administrator")
      ? UserRole.ADMINISTRATOR
      : actor.roles.includes("manager")
        ? UserRole.MANAGER
        : UserRole.WORKER;

    return this.prisma.user.create({
      data: {
        employeeId: actor.username.toUpperCase(),
        email: email ?? `${actor.username}@keycloak.local`,
        displayName: actor.username,
        role,
      },
    });
  }
}

import {
  BadGatewayException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";

import type { AuthenticatedUser } from "./auth-user";
import { CreateSystemUserDto } from "./dto/create-system-user.dto";
import { ResetSystemUserPasswordDto } from "./dto/reset-system-user-password.dto";
import { UpdateSystemUserDto } from "./dto/update-system-user.dto";
import { PrismaService } from "../prisma/prisma.service";

type KeycloakRole = {
  id: string;
  name: string;
  description?: string;
  composite?: boolean;
  clientRole?: boolean;
  containerId?: string;
};

type KeycloakUser = {
  id: string;
  username: string;
  email?: string;
  enabled?: boolean;
};

@Injectable()
export class KeycloakAdminService {
  private readonly issuer =
    process.env.KEYCLOAK_ISSUER ??
    "http://localhost:8080/realms/nirka-inventory";
  private readonly baseUrl =
    process.env.KEYCLOAK_BASE_URL ?? this.issuer.split("/realms/")[0];
  private readonly realm =
    process.env.KEYCLOAK_REALM ?? this.issuer.split("/realms/")[1];

  constructor(private readonly prisma: PrismaService) {}

  async createUser(input: CreateSystemUserDto, actor: AuthenticatedUser) {
    const employeeId = input.employeeId.trim().toUpperCase();
    const email = input.email.trim().toLowerCase();
    const displayName = input.displayName.trim();
    const shift = input.role === "WORKER" ? input.shift?.trim() || null : null;
    const warehouseZone = input.role === "WORKER" ? input.warehouseZone?.trim() || null : null;
    const duplicate = await this.prisma.user.findFirst({
      where: { OR: [{ employeeId }, { email }] },
    });
    if (duplicate) {
      throw new ConflictException("Employee ID or email is already in use.");
    }

    const accessToken = await this.getAdminToken();
    const [firstName, ...remainingNames] = displayName.split(/\s+/);
    const response = await this.keycloakRequest("/users", accessToken, {
      method: "POST",
      body: JSON.stringify({
        username: employeeId,
        email,
        firstName,
        lastName: remainingNames.join(" "),
        enabled: true,
        emailVerified: true,
        credentials: [
          {
            type: "password",
            value: input.temporaryPassword,
            temporary: true,
          },
        ],
      }),
    });

    const keycloakId = response.headers.get("location")?.split("/").pop();
    if (!keycloakId) {
      throw new BadGatewayException("Keycloak created the account but did not return its identifier.");
    }

    try {
      await this.setInventoryRoles(keycloakId, input.role, accessToken);

      const createdUser = await this.prisma.user.create({
        data: {
          employeeId,
          email,
          displayName,
          role: input.role === "MANAGER" ? UserRole.MANAGER : UserRole.WORKER,
          shift,
          warehouseZone,
          active: true,
        },
        select: this.userSelect,
      });
      await this.recordAudit(
        "USER_CREATED",
        actor,
        createdUser,
        `Role: ${createdUser.role}; shift: ${createdUser.shift ?? "Not assigned"}; zone: ${createdUser.warehouseZone ?? "Not assigned"}`,
      );
      return createdUser;
    } catch (error) {
      await this.keycloakRequest(`/users/${keycloakId}`, accessToken, {
        method: "DELETE",
      }).catch(() => undefined);
      throw error;
    }
  }

  async updateUser(id: string, input: UpdateSystemUserDto, actor: AuthenticatedUser) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User account was not found.");
    if (user.role === UserRole.ADMINISTRATOR) {
      throw new ForbiddenException("Administrator accounts cannot be changed from this screen.");
    }

    const employeeId = input.employeeId.trim().toUpperCase();
    const email = input.email.trim().toLowerCase();
    const displayName = input.displayName.trim();
    const shift = input.role === "WORKER" ? input.shift?.trim() || null : null;
    const warehouseZone = input.role === "WORKER" ? input.warehouseZone?.trim() || null : null;
    const duplicate = await this.prisma.user.findFirst({
      where: {
        id: { not: id },
        OR: [{ employeeId }, { email }],
      },
    });
    if (duplicate) {
      throw new ConflictException("Employee ID or email is already in use.");
    }

    const accessToken = await this.getAdminToken();
    const keycloakUser = await this.findKeycloakUser(user.employeeId, accessToken);
    if (!keycloakUser) {
      throw new NotFoundException("The matching Keycloak account was not found.");
    }
    const [firstName, ...remainingNames] = displayName.split(/\s+/);
    await this.keycloakRequest(`/users/${keycloakUser.id}`, accessToken, {
      method: "PUT",
      body: JSON.stringify({
        username: employeeId,
        email,
        firstName,
        lastName: remainingNames.join(" "),
        enabled: user.active,
        emailVerified: true,
      }),
    });
    await this.setInventoryRoles(keycloakUser.id, input.role, accessToken);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        employeeId,
        email,
        displayName,
        role: input.role === "MANAGER" ? UserRole.MANAGER : UserRole.WORKER,
        shift,
        warehouseZone,
      },
      select: this.userSelect,
    });
    await this.recordAudit(
      user.role === updatedUser.role ? "USER_UPDATED" : "USER_ROLE_CHANGED",
      actor,
      updatedUser,
      `Previous role: ${user.role}; current role: ${updatedUser.role}; shift: ${updatedUser.shift ?? "Not assigned"}; zone: ${updatedUser.warehouseZone ?? "Not assigned"}`,
    );
    return updatedUser;
  }

  async resetPassword(id: string, input: ResetSystemUserPasswordDto, actor: AuthenticatedUser) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User account was not found.");
    if (user.role === UserRole.ADMINISTRATOR) {
      throw new ForbiddenException("Administrator passwords cannot be reset from this screen.");
    }
    const accessToken = await this.getAdminToken();
    const keycloakUser = await this.findKeycloakUser(user.employeeId, accessToken);
    if (!keycloakUser) {
      throw new NotFoundException("The matching Keycloak account was not found.");
    }
    await this.keycloakRequest(
      `/users/${keycloakUser.id}/reset-password`,
      accessToken,
      {
        method: "PUT",
        body: JSON.stringify({
          type: "password",
          value: input.temporaryPassword,
          temporary: true,
        }),
      },
    );
    await this.keycloakRequest(`/users/${keycloakUser.id}/logout`, accessToken, {
      method: "POST",
    }).catch(() => undefined);
    await this.recordAudit("PASSWORD_RESET", actor, user, "Temporary password issued; password value was not recorded.");
    return { updated: true, userId: id };
  }

  async setUserStatus(
    id: string,
    active: boolean,
    actor: AuthenticatedUser,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User account was not found.");

    const isCurrentUser =
      user.employeeId === actor.username.toUpperCase() ||
      user.email === actor.email?.toLowerCase();
    if (isCurrentUser && !active) {
      throw new ForbiddenException("You cannot deactivate your own Administrator account.");
    }

    const accessToken = await this.getAdminToken();
    const keycloakUser = await this.findKeycloakUser(user.employeeId, accessToken);
    if (!keycloakUser) {
      throw new NotFoundException("The matching Keycloak account was not found.");
    }

    await this.keycloakRequest(`/users/${keycloakUser.id}`, accessToken, {
      method: "PUT",
      body: JSON.stringify({ enabled: active }),
    });
    if (!active) {
      await this.keycloakRequest(`/users/${keycloakUser.id}/logout`, accessToken, {
        method: "POST",
      }).catch(() => undefined);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { active },
      select: this.userSelect,
    });
    await this.recordAudit(active ? "USER_ACTIVATED" : "USER_DEACTIVATED", actor, updatedUser);
    return updatedUser;
  }

  listAudit() {
    return this.prisma.userAccessAudit.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  private readonly userSelect = {
    id: true,
    employeeId: true,
    email: true,
    displayName: true,
    role: true,
    shift: true,
    warehouseZone: true,
    active: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
    _count: { select: { createdTransactions: true, assignedTasks: true } },
  } as const;

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

  private async findKeycloakUser(username: string, accessToken: string) {
    const users = await this.keycloakJson<KeycloakUser[]>(
      `/users?username=${encodeURIComponent(username)}&exact=true`,
      accessToken,
    );
    return users[0] ?? null;
  }

  private async setInventoryRoles(
    keycloakUserId: string,
    role: "WORKER" | "MANAGER",
    accessToken: string,
  ) {
    const currentRoles = await this.keycloakJson<KeycloakRole[]>(
      `/users/${keycloakUserId}/role-mappings/realm`,
      accessToken,
    );
    const removableRoles = currentRoles.filter((currentRole) =>
      ["worker", "manager"].includes(currentRole.name),
    );
    if (removableRoles.length) {
      await this.keycloakRequest(
        `/users/${keycloakUserId}/role-mappings/realm`,
        accessToken,
        { method: "DELETE", body: JSON.stringify(removableRoles) },
      );
    }
    const roleNames = role === "MANAGER" ? ["worker", "manager"] : ["worker"];
    const desiredRoles = await Promise.all(
      roleNames.map((roleName) =>
        this.keycloakJson<KeycloakRole>(
          `/roles/${encodeURIComponent(roleName)}`,
          accessToken,
        ),
      ),
    );
    await this.keycloakRequest(
      `/users/${keycloakUserId}/role-mappings/realm`,
      accessToken,
      { method: "POST", body: JSON.stringify(desiredRoles) },
    );
  }

  private async getAdminToken() {
    const clientId = process.env.KEYCLOAK_USER_ADMIN_CLIENT_ID;
    const clientSecret = process.env.KEYCLOAK_USER_ADMIN_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new BadGatewayException(
        "The Keycloak user-management service account is not configured.",
      );
    }
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    });
    const response = await fetch(
      `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) {
      throw new BadGatewayException("Keycloak user-management authentication failed.");
    }
    const payload = (await response.json()) as { access_token?: string };
    if (!payload.access_token) {
      throw new BadGatewayException("Keycloak did not return a service token.");
    }
    return payload.access_token;
  }

  private async keycloakJson<T>(path: string, accessToken: string) {
    const response = await this.keycloakRequest(path, accessToken);
    return response.json() as Promise<T>;
  }

  private async keycloakRequest(
    path: string,
    accessToken: string,
    init: RequestInit = {},
  ) {
    let response: Response;
    try {
      response = await fetch(
        `${this.baseUrl}/admin/realms/${encodeURIComponent(this.realm)}${path}`,
        {
          ...init,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            ...init.headers,
          },
          signal: AbortSignal.timeout(5000),
        },
      );
    } catch {
      throw new BadGatewayException("Keycloak could not be reached.");
    }
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { errorMessage?: string; error?: string }
        | null;
      const message = payload?.errorMessage ?? payload?.error;
      if (response.status === 409) {
        throw new ConflictException(message ?? "The Keycloak account already exists.");
      }
      throw new BadGatewayException(message ?? `Keycloak request failed (${response.status}).`);
    }
    return response;
  }
}

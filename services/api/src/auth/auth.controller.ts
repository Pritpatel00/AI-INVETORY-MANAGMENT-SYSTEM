import { Body, Controller, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import type { AuthenticatedRequest } from "./auth-user";
import { CreateSystemUserDto } from "./dto/create-system-user.dto";
import { ResetSystemUserPasswordDto } from "./dto/reset-system-user-password.dto";
import { UpdateSystemUserStatusDto } from "./dto/update-system-user-status.dto";
import { UpdateSystemUserDto } from "./dto/update-system-user.dto";
import { KeycloakAdminService } from "./keycloak-admin.service";
import { Roles } from "./roles.decorator";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("authentication")
@ApiBearerAuth()
@Controller("auth")
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly keycloakAdmin: KeycloakAdminService,
  ) {}
  @Get("me")
  @Roles("worker", "manager", "administrator")
  @ApiOkResponse({ description: "The authenticated Keycloak user and roles." })
  me(@Req() request: AuthenticatedRequest) {
    return request.authUser;
  }

  @Get("manager-access")
  @Roles("manager", "administrator")
  @ApiOkResponse({ description: "The authenticated user has manager access." })
  managerAccess(@Req() request: AuthenticatedRequest) {
    return {
      allowed: true,
      username: request.authUser?.username,
      roles: request.authUser?.roles ?? [],
    };
  }

  @Get("users")
  @Roles("administrator")
  @ApiOkResponse({ description: "Application users synchronized from authenticated Keycloak sessions." })
  users() {
    return this.prisma.user.findMany({
      orderBy: [{ active: "desc" }, { displayName: "asc" }],
      select: {
        id: true, employeeId: true, email: true, displayName: true,
        role: true, active: true, lastLoginAt: true, createdAt: true, updatedAt: true,
        _count: { select: { createdTransactions: true, assignedTasks: true } },
      },
    });
  }

  @Post("users")
  @Roles("administrator")
  createUser(@Body() input: CreateSystemUserDto, @Req() request: AuthenticatedRequest) {
    return this.keycloakAdmin.createUser(input, request.authUser!);
  }

  @Patch("users/:id")
  @Roles("administrator")
  updateUser(@Param("id") id: string, @Body() input: UpdateSystemUserDto, @Req() request: AuthenticatedRequest) {
    return this.keycloakAdmin.updateUser(id, input, request.authUser!);
  }

  @Post("users/:id/reset-password")
  @Roles("administrator")
  resetUserPassword(
    @Param("id") id: string,
    @Body() input: ResetSystemUserPasswordDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.keycloakAdmin.resetPassword(id, input, request.authUser!);
  }

  @Get("user-audit")
  @Roles("administrator")
  userAccessAudit() {
    return this.keycloakAdmin.listAudit();
  }

  @Patch("users/:id/status")
  @Roles("administrator")
  updateUserStatus(
    @Param("id") id: string,
    @Body() input: UpdateSystemUserStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.keycloakAdmin.setUserStatus(
      id,
      input.active,
      request.authUser!,
    );
  }
}

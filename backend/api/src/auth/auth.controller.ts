import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";

import type { AuthenticatedRequest } from "./auth-user";
import { AdminUserService } from "./admin-user.service";
import { AuthCookieService } from "./auth-cookie.service";
import { AuthRateLimitGuard } from "./auth-rate-limit.guard";
import { LocalAuthService } from "./local-auth.service";
import { CreateSystemUserDto } from "./dto/create-system-user.dto";
import { ChangePasswordDto, InitializeAdministratorPasswordDto, LoginDto } from "./dto/local-auth.dto";
import { ResetSystemUserPasswordDto } from "./dto/reset-system-user-password.dto";
import { UpdateSystemUserStatusDto } from "./dto/update-system-user-status.dto";
import { UpdateSystemUserDto } from "./dto/update-system-user.dto";
import { Public } from "./public.decorator";
import { Roles } from "./roles.decorator";

@ApiTags("authentication")
@ApiBearerAuth()
@Controller("auth")
export class AuthController {
  constructor(
    private readonly adminUsers: AdminUserService,
    private readonly localAuth: LocalAuthService,
    private readonly cookies: AuthCookieService,
  ) {}

  @Get("csrf")
  @Public()
  @ApiOkResponse({ description: "Bootstraps an API-origin CSRF token." })
  csrf(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.cookies.assertAllowedOrigin(request);
    return { csrfToken: this.cookies.setCsrfCookie(response) };
  }

  @Post("login")
  @Public()
  @UseGuards(AuthRateLimitGuard)
  @ApiOkResponse({ description: "Creates a local access token and session." })
  async login(
    @Body() input: LoginDto,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Login starts without a refresh cookie, so CSRF is not required here.
    // Origin validation still prevents the configured browser origin from
    // being substituted by an untrusted web application.
    this.cookies.assertAllowedOrigin(request);
    const result = await this.localAuth.login(
      input,
      this.getSessionMetadata(request),
    );
    this.cookies.setAuthCookies(response, result.session);
    return result.response;
  }

  @Post("refresh")
  @Public()
  @UseGuards(AuthRateLimitGuard)
  @ApiOkResponse({ description: "Rotates the local refresh session." })
  async refresh(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.cookies.assertCsrf(request);
    const refreshToken = this.cookies.getRefreshToken(request);
    if (!refreshToken) {
      throw new UnauthorizedException("The refresh token is invalid or expired.");
    }
    const result = await this.localAuth.refresh(
      refreshToken,
      this.getSessionMetadata(request),
    );
    this.cookies.setAuthCookies(response, result.session);
    return result.response;
  }

  @Post("logout")
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    this.cookies.assertCsrf(request);
    await this.localAuth.logout(
      this.localAuth.getSessionIdFromAuthorizationHeader(
        request.headers.authorization,
      ),
      this.cookies.getRefreshToken(request),
    );
    this.cookies.clearAuthCookies(response);
  }

  @Get("me")
  @Roles("worker", "manager", "administrator")
  @ApiOkResponse({ description: "The canonical authenticated application user." })
  me(@Req() request: AuthenticatedRequest) {
    if (request.authUser?.userId) {
      return this.localAuth.me(
        request.authUser.userId,
        request.authUser.provider ?? "local",
      );
    }
    return request.authUser;
  }

  @Post("initialize-admin-password")
  @Roles("administrator")
  @UseGuards(AuthRateLimitGuard)
  initializeAdministratorPassword(
    @Body() input: InitializeAdministratorPasswordDto,
    @Req() request: AuthenticatedRequest,
  ) {
    this.cookies.assertCsrf(request);
    return this.localAuth.initializeAdministratorPassword(request.authUser, input.newPassword);
  }

  @Post("change-password")
  @UseGuards(AuthRateLimitGuard)
  @ApiOkResponse({ description: "Changes the local password and rotates the session." })
  async changePassword(
    @Body() input: ChangePasswordDto,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.cookies.assertCsrf(request);
    const userId = request.authUser?.userId;
    if (!userId) {
      throw new UnauthorizedException("A local authenticated session is required.");
    }
    const result = await this.localAuth.changePassword(
      userId,
      input,
      this.getSessionMetadata(request),
    );
    this.cookies.setAuthCookies(response, result.session);
    return result.response;
  }

  @Get("manager-access")
  @Roles("manager", "administrator")
  @ApiOkResponse({ description: "The authenticated user has manager access." })
  managerAccess(@Req() request: AuthenticatedRequest) {
    return {
      allowed: true,
      username: request.authUser?.username,
      roles: request.authUser?.role
        ? [request.authUser.role.toLowerCase()]
        : request.authUser?.roles ?? [],
    };
  }

  @Get("users")
  @Roles("administrator")
  @ApiOkResponse({ description: "Application users managed by PostgreSQL." })
  users() {
    return this.adminUsers.list();
  }

  @Post("users")
  @Roles("administrator")
  createUser(@Body() input: CreateSystemUserDto, @Req() request: AuthenticatedRequest) {
    return this.adminUsers.create(input, request.authUser!);
  }

  @Patch("users/:id")
  @Roles("administrator")
  updateUser(@Param("id") id: string, @Body() input: UpdateSystemUserDto, @Req() request: AuthenticatedRequest) {
    return this.adminUsers.update(id, input, request.authUser!);
  }

  @Post("users/:id/reset-password")
  @Roles("administrator")
  resetUserPassword(
    @Param("id") id: string,
    @Body() input: ResetSystemUserPasswordDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminUsers.resetPassword(id, input, request.authUser!);
  }

  @Get("user-audit")
  @Roles("administrator")
  userAccessAudit() {
    return this.adminUsers.listAudit();
  }

  @Patch("users/:id/status")
  @Roles("administrator")
  updateUserStatus(
    @Param("id") id: string,
    @Body() input: UpdateSystemUserStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminUsers.setStatus(
      id,
      input.active,
      request.authUser!,
    );
  }

  private getSessionMetadata(request: AuthenticatedRequest) {
    const userAgent = request.headers["user-agent"];
    return {
      userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
      ipAddress: request.ip ?? request.socket.remoteAddress,
    };
  }
}

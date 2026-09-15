import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";

import { AuthController } from "./auth.controller";
import { AdminUserService } from "./admin-user.service";
import { AuthCookieService } from "./auth-cookie.service";
import { AuthRateLimitGuard } from "./auth-rate-limit.guard";
import { AuthRateLimitService } from "./auth-rate-limit.service";
import { LocalAuthService } from "./local-auth.service";
import { LocalJwtService } from "./local-jwt.service";
import { KeycloakAuthGuard } from "./keycloak-auth.guard";
import { KeycloakAdminService } from "./keycloak-admin.service";
import { PasswordService } from "./password.service";
import { RolesGuard } from "./roles.guard";
import { SessionService } from "./session.service";

@Module({
  controllers: [AuthController],
  providers: [
    AdminUserService,
    AuthCookieService,
    AuthRateLimitGuard,
    AuthRateLimitService,
    LocalAuthService,
    LocalJwtService,
    KeycloakAdminService,
    PasswordService,
    SessionService,
    { provide: APP_GUARD, useClass: KeycloakAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [
    AdminUserService,
    AuthCookieService,
    LocalAuthService,
    LocalJwtService,
    PasswordService,
    SessionService,
  ],
})
export class AuthModule {}

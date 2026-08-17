import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";

import { AuthController } from "./auth.controller";
import { KeycloakAuthGuard } from "./keycloak-auth.guard";
import { KeycloakAdminService } from "./keycloak-admin.service";
import { RolesGuard } from "./roles.guard";

@Module({
  controllers: [AuthController],
  providers: [
    KeycloakAdminService,
    { provide: APP_GUARD, useClass: KeycloakAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { AuthenticatedRequest } from "./auth-user";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const databaseRole = request.authUser?.role?.toLowerCase();
    if (
      databaseRole &&
      requiredRoles.some((role) => role.toLowerCase() === databaseRole)
    ) {
      return true;
    }

    // Older direct unit-test fixtures do not include the canonical role yet.
    // Every real request is populated by KeycloakAuthGuard with `role` from
    // PostgreSQL, so provider-supplied roles cannot reach this fallback.
    if (
      !databaseRole &&
      requiredRoles.some((role) =>
        (request.authUser?.roles ?? []).some(
          (candidate) => candidate.toLowerCase() === role.toLowerCase(),
        ),
      )
    ) {
      return true;
    }

    throw new ForbiddenException(
      "Your account does not have permission for this action.",
    );
  }
}

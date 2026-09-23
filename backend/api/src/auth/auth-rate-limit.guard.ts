import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";

import type { AuthenticatedRequest } from "./auth-user";
import { AuthRateLimitService } from "./auth-rate-limit.service";

const WINDOW_MS = 15 * 60 * 1000;
const POLICIES: Record<string, number> = {
  login: 10,
  refresh: 30,
  "change-password": 10,
  "initialize-admin-password": 5,
};

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  constructor(private readonly rateLimiter: AuthRateLimitService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const scope = this.getScope(request.path);
    if (!scope) return true;

    const address = request.ip ?? request.socket.remoteAddress ?? "unknown";
    const userId = request.authUser?.userId ?? "anonymous";
    const allowed = this.rateLimiter.consume(
      `${scope}:${address}:${userId}`,
      POLICIES[scope],
      WINDOW_MS,
    );
    if (!allowed) {
      throw new HttpException(
        "Too many authentication attempts. Please try again later.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  private getScope(path: string): string | undefined {
    for (const scope of Object.keys(POLICIES)) {
      if (path.endsWith(`/auth/${scope}`)) return scope;
    }
    return undefined;
  }
}

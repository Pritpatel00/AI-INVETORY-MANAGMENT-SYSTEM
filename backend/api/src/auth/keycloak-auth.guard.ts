import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { decode, type JwtPayload, verify } from "jsonwebtoken";
// jwks-rsa is a CommonJS module using `export =`. The API tsconfig does not
// enable esModuleInterop, so a default import would compile to
// require("jwks-rsa").default and crash at runtime. `import * as` binds
// directly to the exported factory and works in both compile and runtime.
import * as jwksClient from "jwks-rsa";

import type { AuthenticatedRequest } from "./auth-user";
import { LocalJwtService } from "./local-jwt.service";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { PrismaService } from "../prisma/prisma.service";

type KeycloakPayload = JwtPayload & {
  preferred_username?: string;
  email?: string;
  realm_access?: { roles?: string[] };
};

const CANONICAL_USER_SELECT = {
  id: true,
  employeeId: true,
  email: true,
  displayName: true,
  role: true,
  active: true,
  lastLoginAt: true,
  mustChangePassword: true,
  authVersion: true,
  legacyKeycloakSubject: true,
} as const;

@Injectable()
export class KeycloakAuthGuard implements CanActivate {
  private readonly issuer =
    process.env.KEYCLOAK_ISSUER ??
    "http://localhost:8080/realms/nirka-inventory";
  private readonly audience =
    process.env.KEYCLOAK_AUDIENCE ?? "nirka-inventory-api";
  private readonly keyClient = jwksClient({
    jwksUri: `${this.issuer}/protocol/openid-connect/certs`,
    cache: true,
    cacheMaxEntries: 5,
    rateLimit: true,
  });

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly localJwt: LocalJwtService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const [scheme, token] = authorization?.split(" ") ?? [];

    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("A valid access token is required.");
    }

    const decoded = decode(token, { complete: true });
    if (decoded && typeof decoded !== "string" && decoded.header.alg === "HS256") {
      return this.authenticateLocalToken(token, request);
    }

    let payload: KeycloakPayload;
    try {
      const keyId = decoded?.header.kid;
      if (!keyId) throw new Error("Token key id is missing.");

      const signingKey = await this.keyClient.getSigningKey(keyId);
      payload = verify(token, signingKey.getPublicKey(), {
        algorithms: ["RS256"],
        issuer: this.issuer,
        audience: this.audience,
      }) as KeycloakPayload;

    } catch {
      throw new UnauthorizedException("The access token is invalid or expired.");
    }

    const applicationUser = await this.resolveKeycloakUser(payload);
    if (!applicationUser.active) {
      throw new UnauthorizedException("This user account has been deactivated.");
    }
    if (
      applicationUser &&
      (!applicationUser.lastLoginAt ||
        Date.now() - applicationUser.lastLoginAt.getTime() > 5 * 60 * 1000)
    ) {
      await this.prisma.user.update({
        where: { id: applicationUser.id },
        data: { lastLoginAt: new Date() },
      });
    }

    request.authUser = {
      subject: payload.sub ?? "",
      username: applicationUser.employeeId,
      employeeId: applicationUser.employeeId,
      email: applicationUser.email,
      displayName: applicationUser.displayName,
      role: applicationUser.role,
      // The PostgreSQL role is authoritative. Keycloak realm roles are not
      // copied into the request because they must never authorize an action.
      roles: [applicationUser.role.toLowerCase()],
      provider: "keycloak",
      userId: applicationUser.id,
      mustChangePassword: applicationUser.mustChangePassword,
      active: applicationUser.active,
    };
    return true;
  }

  private async resolveKeycloakUser(payload: KeycloakPayload) {
    const username = payload.preferred_username?.trim().toUpperCase();
    const email = payload.email?.trim().toLowerCase();

    let applicationUser = payload.sub
      ? await this.prisma.user.findUnique({
          where: { legacyKeycloakSubject: payload.sub },
          select: CANONICAL_USER_SELECT,
        })
      : null;

    if (!applicationUser && username) {
      applicationUser = await this.prisma.user.findUnique({
        where: { employeeId: username },
        select: CANONICAL_USER_SELECT,
      });
    }
    if (!applicationUser && email) {
      applicationUser = await this.prisma.user.findUnique({
        where: { email },
        select: CANONICAL_USER_SELECT,
      });
    }
    if (!applicationUser) {
      throw new UnauthorizedException(
        "The authenticated inventory user profile is unavailable.",
      );
    }

    if (payload.sub && !applicationUser.legacyKeycloakSubject) {
      await this.prisma.user.update({
        where: { id: applicationUser.id },
        data: { legacyKeycloakSubject: payload.sub },
      });
    }

    return applicationUser;
  }

  private async authenticateLocalToken(
    token: string,
    request: AuthenticatedRequest,
  ): Promise<boolean> {
    const claims = this.localJwt.verifyAccessToken(token);
    const [user, session] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: claims.sub },
        select: CANONICAL_USER_SELECT,
      }),
      this.prisma.authSession.findUnique({
        where: { id: claims.sid },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
          revokedAt: true,
        },
      }),
    ]);
    if (
      !user ||
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.userId !== user.id ||
      !user.active ||
      user.authVersion !== claims.av
    ) {
      throw new UnauthorizedException("The local session is no longer active.");
    }

    if (
      user.mustChangePassword &&
      !this.isForcedPasswordPath(request.path)
    ) {
      throw new ForbiddenException("A password change is required.");
    }

    request.authUser = {
      subject: user.id,
      userId: user.id,
      username: user.employeeId,
      employeeId: user.employeeId,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      roles: [user.role.toLowerCase()],
      provider: "local",
      sessionId: session.id,
      authVersion: user.authVersion,
      mustChangePassword: user.mustChangePassword,
      active: user.active,
    };
    return true;
  }

  private isForcedPasswordPath(path: string): boolean {
    return [
      "/auth/me",
      "/auth/change-password",
      "/auth/logout",
      "/auth/refresh",
    ].some((allowedPath) => path.endsWith(allowedPath));
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { decode, type JwtPayload, verify } from "jsonwebtoken";
import jwksClient = require("jwks-rsa");

import type { AuthenticatedRequest } from "./auth-user";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { PrismaService } from "../prisma/prisma.service";

type KeycloakPayload = JwtPayload & {
  preferred_username?: string;
  email?: string;
  realm_access?: { roles?: string[] };
};

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

    let payload: KeycloakPayload;
    try {
      const decoded = decode(token, { complete: true });
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

    const username = payload.preferred_username ?? "unknown";
    const email = payload.email?.toLowerCase();
    const applicationUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { employeeId: username.toUpperCase() },
          ...(email ? [{ email }] : []),
        ],
      },
      select: { id: true, active: true, lastLoginAt: true },
    });
    if (applicationUser?.active === false) {
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
      username,
      email: payload.email,
      roles: payload.realm_access?.roles ?? [],
    };
    return true;
  }
}

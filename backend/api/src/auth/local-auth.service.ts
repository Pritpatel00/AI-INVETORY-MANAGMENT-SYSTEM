import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import type { AuthenticatedUser } from "./auth-user";

import { PrismaService } from "../prisma/prisma.service";
import { ACCESS_TOKEN_TTL_SECONDS } from "./auth.constants";
import { ChangePasswordDto, LoginDto } from "./dto/local-auth.dto";
import { LocalJwtService } from "./local-jwt.service";
import { PasswordService } from "./password.service";
import type { AuthSessionMetadata, IssuedRefreshToken } from "./session.service";
import { SessionService } from "./session.service";

const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=65536,p=1,t=3$kNLES+4LyTwgbQEhjgIzEg$x+VMnftkfXBEHcy3Li+8NuNeTJgucm0LWdIS1mOJrw4";

const LOCAL_USER_SELECT = {
  id: true,
  employeeId: true,
  email: true,
  displayName: true,
  role: true,
  shift: true,
  warehouseZone: true,
  active: true,
  lastLoginAt: true,
  passwordHash: true,
  passwordChangedAt: true,
  mustChangePassword: true,
  authVersion: true,
} as const;

type LocalUserRecord = {
  id: string;
  employeeId: string;
  email: string;
  displayName: string;
  role: string;
  shift: string | null;
  warehouseZone: string | null;
  active: boolean;
  lastLoginAt: Date | null;
  passwordHash: string | null;
  passwordChangedAt: Date | null;
  mustChangePassword: boolean;
  authVersion: number;
};

export interface LocalAuthResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: ReturnType<LocalAuthService["toProfile"]>;
}

export interface LocalAuthResult {
  response: LocalAuthResponse;
  session: IssuedRefreshToken;
}

@Injectable()
export class LocalAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
    private readonly jwt: LocalJwtService,
  ) {}

  async login(
    input: LoginDto,
    metadata: AuthSessionMetadata = {},
  ): Promise<LocalAuthResult> {
    const user = await this.findByIdentifier(input.identifier);
    const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const validPassword = await this.passwords.verify(passwordHash, input.password);

    if (!user || !user.active || !user.passwordHash || !validPassword) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const issued = await this.sessions.createSession(user.id, metadata);
    const response = this.issueResponse(user, issued);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return { response, session: issued };
  }

  async refresh(
    rawRefreshToken: string,
    metadata: AuthSessionMetadata = {},
  ): Promise<LocalAuthResult> {
    const issued = await this.sessions.rotateRefreshToken(rawRefreshToken);
    const user = await this.findById(issued.userId);
    if (!user || !user.active) {
      await this.sessions.revokeSession(issued.sessionId, "inactive_user");
      throw new UnauthorizedException("The refresh token is invalid or expired.");
    }

    return {
      response: this.issueResponse(user, issued, metadata),
      session: issued,
    };
  }

  async logout(sessionId?: string, rawRefreshToken?: string): Promise<void> {
    if (sessionId) await this.sessions.revokeSession(sessionId, "logout");
    if (rawRefreshToken) {
      await this.sessions.revokeRefreshToken(rawRefreshToken, "logout");
    }
  }

  async me(userId: string, provider: "local" | "keycloak" = "local") {
    const user = await this.findById(userId);
    if (!user || !user.active) {
      throw new UnauthorizedException("This user account is not active.");
    }
    const localPasswordInitializationAvailable = provider === "keycloak" &&
      user.role === "ADMINISTRATOR" && !user.passwordHash &&
      !(await this.prisma.user.count({ where: {
        active: true, role: "ADMINISTRATOR", passwordHash: { not: null },
      } })) && !(await this.prisma.userAccessAudit.count({ where: {
        action: "ADMIN_LOCAL_PASSWORD_INITIALIZED",
      } }));
    return { ...this.toProfile(user, provider), localPasswordInitializationAvailable };
  }

  async initializeAdministratorPassword(actor: AuthenticatedUser | undefined, newPassword: string) {
    if (!actor?.userId || actor.provider !== "keycloak" || !actor.subject ||
        actor.role !== "ADMINISTRATOR") {
      throw new ForbiddenException("Verified administrator SSO is required.");
    }
    // Hash before acquiring a short database lock; never hold it during Argon2 work.
    const passwordHash = await this.passwords.hash(newPassword);
    await this.prisma.$transaction(async (tx) => {
      // Serialize bootstrap and other user writes, across API replicas. Checks
      // below run after the lock, so two administrators cannot both bootstrap.
      await tx.$executeRaw`LOCK TABLE public.users IN SHARE ROW EXCLUSIVE MODE`;
      const user = await tx.user.findUnique({ where: { id: actor.userId } });
      const existing = await tx.user.count({ where: {
        active: true, role: "ADMINISTRATOR", passwordHash: { not: null },
      } });
      const previouslyInitialized = await tx.userAccessAudit.count({ where: {
        action: "ADMIN_LOCAL_PASSWORD_INITIALIZED",
      } });
      if (!user || !user.active || user.role !== "ADMINISTRATOR" ||
          user.legacyKeycloakSubject !== actor.subject || user.passwordHash !== null ||
          existing || previouslyInitialized) {
        throw new ForbiddenException("Administrator password initialization is unavailable.");
      }
      const now = new Date();
      await tx.user.update({ where: { id: user.id }, data: {
        passwordHash, passwordChangedAt: now, mustChangePassword: false,
        authVersion: { increment: 1 },
      } });
      await tx.authSession.updateMany({ where: { userId: user.id, revokedAt: null },
        data: { revokedAt: now, revokedReason: "password_initialized" } });
      // The durable audit event also prevents re-enabling bootstrap after a
      // later deactivation. Failure to write the audit rolls back the password.
      await tx.userAccessAudit.create({ data: {
        action: "ADMIN_LOCAL_PASSWORD_INITIALIZED",
        actorUsername: user.employeeId, actorEmail: user.email,
        targetUserId: user.id, targetEmployeeId: user.employeeId,
        targetDisplayName: user.displayName,
        details: "Own local credential initialized through verified legacy SSO.",
      } });
    }, { isolationLevel: "ReadCommitted", timeout: 10000 });
    // Keep the current SSO session; the administrator can explicitly sign out
    // and verify local login. Never return the hash or change the SSO password.
    return this.me(actor.userId, "keycloak");
  }

  async changePassword(
    userId: string,
    input: ChangePasswordDto,
    metadata: AuthSessionMetadata = {},
  ): Promise<LocalAuthResult> {
    const user = await this.findById(userId);
    const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const validPassword = await this.passwords.verify(
      passwordHash,
      input.currentPassword,
    );
    if (!user || !user.active || !user.passwordHash || !validPassword) {
      throw new UnauthorizedException("Current password is incorrect.");
    }

    const now = new Date();
    const nextPasswordHash = await this.passwords.hash(input.newPassword);
    const updatedUser = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.user.update({
        where: { id: userId },
        data: {
          passwordHash: nextPasswordHash,
          passwordChangedAt: now,
          mustChangePassword: false,
          authVersion: { increment: 1 },
        },
        select: LOCAL_USER_SELECT,
      });
      await transaction.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now, revokedReason: "password_changed" },
      });
      return updated as LocalUserRecord;
    });

    const issued = await this.sessions.createSession(userId, metadata);
    return { response: this.issueResponse(updatedUser, issued), session: issued };
  }

  getSessionIdFromAuthorizationHeader(
    authorization?: string,
  ): string | undefined {
    const [scheme, token] = authorization?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token) return undefined;
    try {
      return this.jwt.verifyAccessToken(token).sid;
    } catch {
      return undefined;
    }
  }

  private async findByIdentifier(identifier: string): Promise<LocalUserRecord | null> {
    const normalized = identifier.trim();
    if (!normalized) return null;
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { employeeId: normalized.toUpperCase() },
          { email: normalized.toLowerCase() },
        ],
      },
      select: LOCAL_USER_SELECT,
    }) as Promise<LocalUserRecord | null>;
  }

  private async findById(userId: string): Promise<LocalUserRecord | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: LOCAL_USER_SELECT,
    }) as Promise<LocalUserRecord | null>;
  }

  private issueResponse(
    user: LocalUserRecord,
    issued: IssuedRefreshToken,
    _metadata: AuthSessionMetadata = {},
  ): LocalAuthResponse {
    const accessToken = this.jwt.signAccessToken({
      userId: user.id,
      sessionId: issued.sessionId,
      authVersion: user.authVersion,
    });
    return {
      ...accessToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: this.toProfile(user),
    };
  }

  private toProfile(
    user: LocalUserRecord,
    provider: "local" | "keycloak" = "local",
  ) {
    return {
      id: user.id,
      employeeId: user.employeeId,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      shift: user.shift,
      warehouseZone: user.warehouseZone,
      active: user.active,
      lastLoginAt: user.lastLoginAt,
      mustChangePassword: user.mustChangePassword,
      localAuthEnabled: Boolean(user.passwordHash),
      authProvider: provider,
    };
  }
}

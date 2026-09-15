import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash, randomBytes, randomUUID } from "node:crypto";

import { PrismaService } from "../prisma/prisma.service";
import {
  REFRESH_SESSION_ABSOLUTE_TTL_MS,
  REFRESH_SESSION_IDLE_TTL_MS,
  REFRESH_TOKEN_BYTES,
} from "./auth.constants";

export interface AuthSessionMetadata {
  userAgent?: string;
  ipAddress?: string;
}

export interface IssuedRefreshToken {
  userId: string;
  sessionId: string;
  rawToken: string;
  expiresAt: Date;
  sessionExpiresAt: Date;
}

type RotationResult =
  | { kind: "success"; issued: IssuedRefreshToken }
  | { kind: "rejected"; message: string };

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(
    userId: string,
    metadata: AuthSessionMetadata = {},
    now = new Date(),
  ): Promise<IssuedRefreshToken> {
    const sessionId = randomUUID();
    const sessionExpiresAt = new Date(
      now.getTime() + REFRESH_SESSION_ABSOLUTE_TTL_MS,
    );
    const rawToken = this.createRawRefreshToken();
    const refreshTokenExpiresAt = this.getRefreshTokenExpiry(
      now,
      sessionExpiresAt,
    );

    const session = await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId,
        createdAt: now,
        lastUsedAt: now,
        expiresAt: sessionExpiresAt,
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
        refreshTokens: {
          create: {
            tokenHash: this.hashRefreshToken(rawToken),
            issuedAt: now,
            expiresAt: refreshTokenExpiresAt,
          },
        },
      },
      select: { id: true, expiresAt: true },
    });

    return {
      userId,
      sessionId: session.id,
      rawToken,
      expiresAt: refreshTokenExpiresAt,
      sessionExpiresAt: session.expiresAt,
    };
  }

  async rotateRefreshToken(
    rawToken: string,
    now = new Date(),
  ): Promise<IssuedRefreshToken> {
    const tokenHash = this.hashRefreshToken(rawToken);
    const result = await this.prisma.$transaction(async (transaction) => {
      const current = await transaction.authRefreshToken.findUnique({
        where: { tokenHash },
        include: { session: true },
      });

      if (!current) {
        return {
          kind: "rejected",
          message: "The refresh token is invalid or expired.",
        } satisfies RotationResult;
      }

      if (current.usedAt) {
        await transaction.authSession.updateMany({
          where: { id: current.sessionId, revokedAt: null },
          data: { revokedAt: now, revokedReason: "refresh_token_reuse" },
        });
        return {
          kind: "rejected",
          message: "The refresh token has already been used.",
        } satisfies RotationResult;
      }

      const idleExpired =
        now.getTime() - current.session.lastUsedAt.getTime() >
        REFRESH_SESSION_IDLE_TTL_MS;
      const expired =
        current.expiresAt <= now || current.session.expiresAt <= now;
      if (current.session.revokedAt || idleExpired || expired) {
        await transaction.authSession.updateMany({
          where: { id: current.sessionId, revokedAt: null },
          data: {
            revokedAt: now,
            revokedReason: current.session.revokedAt
              ? undefined
              : idleExpired
                ? "idle_timeout"
                : "expired",
          },
        });
        return {
          kind: "rejected",
          message: "The refresh session is no longer active.",
        } satisfies RotationResult;
      }

      const markedUsed = await transaction.authRefreshToken.updateMany({
        where: { id: current.id, usedAt: null },
        data: { usedAt: now },
      });
      if (markedUsed.count !== 1) {
        await transaction.authSession.updateMany({
          where: { id: current.sessionId, revokedAt: null },
          data: { revokedAt: now, revokedReason: "refresh_token_reuse" },
        });
        return {
          kind: "rejected",
          message: "The refresh token has already been used.",
        } satisfies RotationResult;
      }

      const nextRawToken = this.createRawRefreshToken();
      const nextExpiresAt = this.getRefreshTokenExpiry(
        now,
        current.session.expiresAt,
      );
      await transaction.authRefreshToken.create({
        data: {
          sessionId: current.sessionId,
          tokenHash: this.hashRefreshToken(nextRawToken),
          issuedAt: now,
          expiresAt: nextExpiresAt,
        },
      });
      await transaction.authSession.update({
        where: { id: current.sessionId },
        data: { lastUsedAt: now },
      });

      return {
        kind: "success",
        issued: {
          userId: current.session.userId,
          sessionId: current.sessionId,
          rawToken: nextRawToken,
          expiresAt: nextExpiresAt,
          sessionExpiresAt: current.session.expiresAt,
        },
      } satisfies RotationResult;
    });

    if (result.kind === "rejected") {
      throw new UnauthorizedException(result.message);
    }
    return result.issued;
  }

  async revokeSession(
    sessionId: string,
    reason = "logout",
    now = new Date(),
  ): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: now, revokedReason: reason },
    });
  }

  async revokeUserSessions(
    userId: string,
    reason: string,
    now = new Date(),
  ): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now, revokedReason: reason },
    });
  }

  async revokeRefreshToken(
    rawToken: string,
    reason = "logout",
    now = new Date(),
  ): Promise<void> {
    const refreshToken = await this.prisma.authRefreshToken.findUnique({
      where: { tokenHash: this.hashRefreshToken(rawToken) },
      select: { sessionId: true },
    });
    if (refreshToken) {
      await this.revokeSession(refreshToken.sessionId, reason, now);
    }
  }

  hashRefreshToken(rawToken: string): string {
    return createHash("sha256").update(rawToken, "utf8").digest("hex");
  }

  private createRawRefreshToken(): string {
    return randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");
  }

  private getRefreshTokenExpiry(now: Date, sessionExpiresAt: Date): Date {
    return new Date(
      Math.min(
        sessionExpiresAt.getTime(),
        now.getTime() + REFRESH_SESSION_IDLE_TTL_MS,
      ),
    );
  }
}

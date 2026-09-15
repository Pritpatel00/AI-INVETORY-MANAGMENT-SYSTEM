import { Injectable, UnauthorizedException, type OnModuleInit } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  sign,
  verify,
  type JwtPayload,
  type SignOptions,
} from "jsonwebtoken";

import {
  ACCESS_TOKEN_TTL_SECONDS,
  JWT_SECRET_MIN_BYTES,
  LOCAL_ACCESS_TOKEN_TYPE,
  LOCAL_ACCESS_TOKEN_VERSION,
} from "./auth.constants";

export interface LocalAccessTokenInput {
  userId: string;
  sessionId: string;
  authVersion: number;
}

export interface LocalAccessTokenClaims extends JwtPayload {
  iss: string;
  aud: string;
  sub: string;
  sid: string;
  jti: string;
  av: number;
  token_type: typeof LOCAL_ACCESS_TOKEN_TYPE;
  version: typeof LOCAL_ACCESS_TOKEN_VERSION;
}

export interface SignedAccessToken {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
}

@Injectable()
export class LocalJwtService implements OnModuleInit {
  private readonly issuer =
    process.env.JWT_ISSUER ?? "nirka-inventory-api";
  private readonly audience =
    process.env.JWT_AUDIENCE ?? "nirka-inventory-api";

  onModuleInit() {
    if (process.env.NODE_ENV?.trim().toLowerCase() === "production") {
      this.getSecret();
    }
  }

  signAccessToken(input: LocalAccessTokenInput): SignedAccessToken {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const payload = {
      sub: input.userId,
      sid: input.sessionId,
      jti: randomUUID(),
      nbf: nowInSeconds,
      av: input.authVersion,
      token_type: LOCAL_ACCESS_TOKEN_TYPE,
      version: LOCAL_ACCESS_TOKEN_VERSION,
    };
    const options: SignOptions = {
      algorithm: "HS256",
      issuer: this.issuer,
      audience: this.audience,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };

    return {
      accessToken: sign(payload, this.getSecret(), options),
      tokenType: "Bearer",
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  verifyAccessToken(token: string): LocalAccessTokenClaims {
    try {
      const payload = verify(token, this.getSecret(), {
        algorithms: ["HS256"],
        issuer: this.issuer,
        audience: this.audience,
      });

      if (typeof payload === "string" || !this.hasRequiredClaims(payload)) {
        throw new Error("Local access token claims are invalid.");
      }

      return payload;
    } catch {
      throw new UnauthorizedException(
        "The local access token is invalid or expired.",
      );
    }
  }

  private getSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret || Buffer.byteLength(secret, "utf8") < JWT_SECRET_MIN_BYTES) {
      throw new Error(
        `JWT_SECRET must be configured with at least ${JWT_SECRET_MIN_BYTES} bytes.`,
      );
    }
    return secret;
  }

  private hasRequiredClaims(
    payload: JwtPayload,
  ): payload is LocalAccessTokenClaims {
    return (
      payload.iss === this.issuer &&
      payload.aud === this.audience &&
      typeof payload.sub === "string" &&
      payload.sub.length > 0 &&
      typeof payload.sid === "string" &&
      payload.sid.length > 0 &&
      typeof payload.jti === "string" &&
      payload.jti.length > 0 &&
      typeof payload.av === "number" &&
      Number.isInteger(payload.av) &&
      payload.av >= 0 &&
      payload.token_type === LOCAL_ACCESS_TOKEN_TYPE &&
      payload.version === LOCAL_ACCESS_TOKEN_VERSION
    );
  }
}

import { ForbiddenException, Injectable } from "@nestjs/common";
import { randomBytes, timingSafeEqual } from "node:crypto";

import type { Request } from "express";

import {
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_COOKIE_PATH,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  REFRESH_COOKIE_NAME,
} from "./auth.constants";
import type { IssuedRefreshToken } from "./session.service";

type SameSite = "lax" | "none";

export interface CookieResponse {
  setHeader(name: string, value: string | string[]): void;
}

@Injectable()
export class AuthCookieService {
  get sameSite(): SameSite {
    if (process.env.NODE_ENV?.trim().toLowerCase() === "production") {
      return "none";
    }
    const configured = process.env.AUTH_COOKIE_SAMESITE?.trim().toLowerCase();
    if (configured === "lax") return configured;
    // SameSite=None is not valid without Secure and is never needed for local
    // HTTP development, so local development always uses Lax.
    return "lax";
  }

  get secure(): boolean {
    if (process.env.NODE_ENV?.trim().toLowerCase() === "production") {
      return true;
    }
    const configured = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();
    return configured === "true";
  }

  setAuthCookies(
    response: CookieResponse,
    issued: IssuedRefreshToken,
  ): void {
    const csrfToken = this.createCsrfToken();
    response.setHeader("Set-Cookie", [
      serializeCookie(REFRESH_COOKIE_NAME, issued.rawToken, {
        httpOnly: true,
        maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
        sameSite: this.sameSite,
        secure: this.secure,
      }),
      serializeCookie(CSRF_COOKIE_NAME, csrfToken, {
        httpOnly: false,
        maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
        sameSite: this.sameSite,
        secure: this.secure,
      }),
    ]);
  }

  setCsrfCookie(response: CookieResponse): string {
    const csrfToken = this.createCsrfToken();
    response.setHeader(
      "Set-Cookie",
      serializeCookie(CSRF_COOKIE_NAME, csrfToken, {
        httpOnly: false,
        maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
        sameSite: this.sameSite,
        secure: this.secure,
      }),
    );
    return csrfToken;
  }

  clearAuthCookies(response: CookieResponse): void {
    response.setHeader("Set-Cookie", [
      serializeCookie(REFRESH_COOKIE_NAME, "", {
        httpOnly: true,
        maxAge: 0,
        sameSite: this.sameSite,
        secure: this.secure,
      }),
      serializeCookie(CSRF_COOKIE_NAME, "", {
        httpOnly: false,
        maxAge: 0,
        sameSite: this.sameSite,
        secure: this.secure,
      }),
    ]);
  }

  getRefreshToken(request: Request): string | undefined {
    return this.getCookie(request, REFRESH_COOKIE_NAME);
  }

  assertAllowedOrigin(request: Request): void {
    const origin = this.getHeader(request, "origin");
    if (!origin) return;

    const configuredOrigin = (
      process.env.WEB_APP_ORIGIN ?? "http://localhost:3000"
    ).replace(/^['"]|['"]$/g, "");
    if (origin !== configuredOrigin) {
      throw new ForbiddenException("The request origin is not allowed.");
    }
  }

  assertCsrf(request: Request): void {
    this.assertAllowedOrigin(request);
    if (this.sameSite !== "none") return;

    const cookieToken = this.getCookie(request, CSRF_COOKIE_NAME);
    const headerToken = this.getHeader(request, CSRF_HEADER_NAME);
    if (!cookieToken || !headerToken) {
      throw new ForbiddenException("A valid CSRF token is required.");
    }

    const cookieBuffer = Buffer.from(cookieToken, "utf8");
    const headerBuffer = Buffer.from(headerToken, "utf8");
    if (
      cookieBuffer.length !== headerBuffer.length ||
      !timingSafeEqual(cookieBuffer, headerBuffer)
    ) {
      throw new ForbiddenException("A valid CSRF token is required.");
    }
  }

  private getCookie(request: Request, name: string): string | undefined {
    const header = request.headers.cookie;
    if (!header) return undefined;

    for (const part of header.split(";")) {
      const separator = part.indexOf("=");
      if (separator < 0) continue;
      const key = part.slice(0, separator).trim();
      if (key !== name) continue;
      const value = part.slice(separator + 1).trim();
      try {
        return decodeURIComponent(value);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  private getHeader(request: Request, name: string): string | undefined {
    const value = request.headers[name];
    return Array.isArray(value) ? value[0] : value;
  }

  private createCsrfToken() {
    return randomBytes(32).toString("base64url");
  }
}

export function serializeCookie(
  name: string,
  value: string,
  options: {
    httpOnly: boolean;
    maxAge: number;
    sameSite: SameSite;
    secure: boolean;
  },
): string {
  const sameSite = options.sameSite === "none" ? "None" : "Lax";
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${AUTH_COOKIE_PATH}`,
    `Max-Age=${options.maxAge}`,
    ...(options.secure ? ["Secure"] : []),
    `SameSite=${sameSite}`,
  ];
  if (options.httpOnly) parts.push("HttpOnly");
  return parts.join("; ");
}

export const ACCESS_TOKEN_TTL_SECONDS = 10 * 60;
export const REFRESH_SESSION_ABSOLUTE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const REFRESH_SESSION_IDLE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const REFRESH_TOKEN_BYTES = 32;
export const JWT_SECRET_MIN_BYTES = 32;
export const PASSWORD_MIN_LENGTH = 12;

export const REFRESH_COOKIE_NAME = "nirka_refresh";
export const CSRF_COOKIE_NAME = "nirka_csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";
export const AUTH_COOKIE_PATH = "/api/auth";
export const AUTH_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export const LOCAL_ACCESS_TOKEN_TYPE = "access" as const;
export const LOCAL_ACCESS_TOKEN_VERSION = 1 as const;

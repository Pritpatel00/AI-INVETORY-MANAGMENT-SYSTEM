import { AuthCookieService } from "./auth-cookie.service";
import type { Request } from "express";

describe("AuthCookieService", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSameSite = process.env.AUTH_COOKIE_SAMESITE;
  const originalSecure = process.env.AUTH_COOKIE_SECURE;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.AUTH_COOKIE_SAMESITE = originalSameSite;
    process.env.AUTH_COOKIE_SECURE = originalSecure;
  });

  it("uses Secure HttpOnly cross-site-safe cookies in production", () => {
    process.env.NODE_ENV = "production";
    delete process.env.AUTH_COOKIE_SAMESITE;
    process.env.AUTH_COOKIE_SECURE = "true";
    const service = new AuthCookieService();
    const response = { setHeader: jest.fn() };

    service.setAuthCookies(response, {
      userId: "user-1",
      sessionId: "session-1",
      rawToken: "opaque-refresh-token",
      expiresAt: new Date(),
      sessionExpiresAt: new Date(),
    });

    const cookies = response.setHeader.mock.calls[0][1] as string[];
    const refreshCookie = cookies.find((cookie) => cookie.startsWith("nirka_refresh="));
    const csrfCookie = cookies.find((cookie) => cookie.startsWith("nirka_csrf="));

    expect(refreshCookie).toEqual(expect.stringContaining("Secure"));
    expect(refreshCookie).toEqual(expect.stringContaining("HttpOnly"));
    expect(refreshCookie).toEqual(expect.stringContaining("SameSite=None"));
    expect(refreshCookie).toEqual(expect.stringContaining("Path=/api/auth"));
    expect(refreshCookie).not.toEqual(expect.stringContaining("nirka_csrf"));
    expect(csrfCookie).toEqual(expect.stringContaining("Secure"));
    expect(csrfCookie).toEqual(expect.stringContaining("SameSite=None"));
    expect(csrfCookie).not.toEqual(expect.stringContaining("HttpOnly"));
  });

  it("uses non-Secure Lax cookies for local HTTP development", () => {
    process.env.NODE_ENV = "development";
    delete process.env.AUTH_COOKIE_SAMESITE;
    process.env.AUTH_COOKIE_SECURE = "false";
    const service = new AuthCookieService();
    const response = { setHeader: jest.fn() };

    expect(service.sameSite).toBe("lax");
    expect(service.secure).toBe(false);
    service.setAuthCookies(response, {
      userId: "user-1",
      sessionId: "session-1",
      rawToken: "opaque-refresh-token",
      expiresAt: new Date(),
      sessionExpiresAt: new Date(),
    });
    const cookies = response.setHeader.mock.calls[0][1] as string[];
    expect(cookies[0]).not.toContain("Secure");
    expect(cookies[0]).toContain("SameSite=Lax");
  });

  it("does not permit insecure SameSite=None settings in local HTTP", () => {
    process.env.NODE_ENV = "development";
    process.env.AUTH_COOKIE_SAMESITE = "none";
    process.env.AUTH_COOKIE_SECURE = "false";
    const service = new AuthCookieService();

    expect(service.sameSite).toBe("lax");
    expect(service.secure).toBe(false);
  });

  it("requires a matching CSRF header for cross-site cookie requests", () => {
    process.env.NODE_ENV = "production";
    delete process.env.AUTH_COOKIE_SAMESITE;
    process.env.AUTH_COOKIE_SECURE = "true";
    const service = new AuthCookieService();
    const request = {
      headers: {
        cookie: "nirka_csrf=csrf-value",
        origin: "http://localhost:3000",
        "x-csrf-token": "csrf-value",
      },
    } as unknown as Request;

    expect(() => service.assertCsrf(request)).not.toThrow();
    request.headers["x-csrf-token"] = "wrong";
    expect(() => service.assertCsrf(request)).toThrow("valid CSRF token");
  });

  it("rejects a cross-site request when the CSRF cookie or header is missing", () => {
    process.env.NODE_ENV = "production";
    const service = new AuthCookieService();
    const request = {
      headers: { origin: "http://localhost:3000" },
    } as unknown as Request;

    expect(() => service.assertCsrf(request)).toThrow("valid CSRF token");
  });

  it("bootstraps a readable API-origin CSRF cookie and returns the same token", () => {
    process.env.NODE_ENV = "production";
    delete process.env.AUTH_COOKIE_SAMESITE;
    process.env.AUTH_COOKIE_SECURE = "true";
    const service = new AuthCookieService();
    const response = { setHeader: jest.fn() };

    const token = service.setCsrfCookie(response);
    const cookie = response.setHeader.mock.calls[0][1] as string;

    expect(token).toHaveLength(43);
    expect(cookie).toContain(`nirka_csrf=${token}`);
    expect(cookie).toContain("Path=/api/auth");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=None");
    expect(cookie).not.toContain("HttpOnly");
  });

  it("does not require CSRF for login, but still allows exact origin validation", () => {
    process.env.NODE_ENV = "production";
    delete process.env.AUTH_COOKIE_SAMESITE;
    process.env.AUTH_COOKIE_SECURE = "true";
    const service = new AuthCookieService();
    const request = {
      headers: { origin: "http://localhost:3000" },
    } as unknown as Request;

    expect(() => service.assertAllowedOrigin(request)).not.toThrow();
  });
});

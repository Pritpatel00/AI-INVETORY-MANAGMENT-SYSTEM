import type { AuthenticatedRequest } from "./auth-user";
import { AuthController } from "./auth.controller";

describe("AuthController local endpoints", () => {
  it("returns the API-origin CSRF token and sets its readable cookie", () => {
    const cookies = {
      assertAllowedOrigin: jest.fn(),
      setCsrfCookie: jest.fn(() => "csrf-token-value"),
    };
    const controller = new AuthController(
      {} as never,
      {} as never,
      cookies as never,
    );
    const request = { headers: { origin: "https://app.example.com" } } as AuthenticatedRequest;
    const response = { setHeader: jest.fn() } as never;

    expect(controller.csrf(request, response)).toEqual({
      csrfToken: "csrf-token-value",
    });
    expect(cookies.assertAllowedOrigin).toHaveBeenCalledWith(request);
    expect(cookies.setCsrfCookie).toHaveBeenCalledWith(response);
  });

  it("uses exact origin validation but does not require CSRF to start login", async () => {
    const result = {
      response: { accessToken: "access-token" },
      session: { sessionId: "session-1", rawToken: "opaque-token" },
    };
    const cookies = {
      assertAllowedOrigin: jest.fn(),
      setAuthCookies: jest.fn(),
    };
    const localAuth = {
      login: jest.fn(async () => result),
    };
    const controller = new AuthController(
      {} as never,
      localAuth as never,
      cookies as never,
    );
    const request = {
      headers: { origin: "https://app.example.com", "user-agent": "test" },
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
    } as AuthenticatedRequest;
    const response = {} as never;

    await expect(controller.login(
      { identifier: "WORKER1", password: "not-a-real-password" },
      request,
      response,
    )).resolves.toEqual(result.response);
    expect(cookies.assertAllowedOrigin).toHaveBeenCalledWith(request);
    expect(cookies.setAuthCookies).toHaveBeenCalledWith(response, result.session);
    expect(localAuth.login).toHaveBeenCalled();
  });

  it("returns the canonical local PostgreSQL profile from /auth/me", async () => {
    const profile = {
      id: "user-1",
      employeeId: "WORKER1",
      email: "worker1@example.com",
      displayName: "Worker One",
      role: "WORKER",
      active: true,
      mustChangePassword: false,
      localAuthEnabled: true,
      authProvider: "local",
    };
    const localAuth = { me: jest.fn(async () => profile) };
    const controller = new AuthController(
      {} as never,
      localAuth as never,
      {} as never,
    );
    const request = {
      authUser: {
        subject: "user-1",
        userId: "user-1",
        username: "WORKER1",
        roles: ["worker"],
        provider: "local" as const,
      },
    } as AuthenticatedRequest;

    await expect(controller.me(request)).resolves.toEqual(profile);
    expect(localAuth.me).toHaveBeenCalledWith("user-1", "local");
  });
});

import { UnauthorizedException } from "@nestjs/common";

import { LocalJwtService } from "./local-jwt.service";

describe("LocalJwtService", () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalIssuer = process.env.JWT_ISSUER;
  const originalAudience = process.env.JWT_AUDIENCE;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret-that-is-at-least-32-bytes-long";
    process.env.JWT_ISSUER = "nirka-inventory-api";
    process.env.JWT_AUDIENCE = "nirka-inventory-api";
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
    process.env.JWT_ISSUER = originalIssuer;
    process.env.JWT_AUDIENCE = originalAudience;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("issues the exact local access-token shape without mutable roles", () => {
    const service = new LocalJwtService();
    const result = service.signAccessToken({
      userId: "user-1",
      sessionId: "session-1",
      authVersion: 0,
    });
    const claims = service.verifyAccessToken(result.accessToken);

    expect(result).toMatchObject({ tokenType: "Bearer", expiresIn: 600 });
    expect(claims).toMatchObject({
      iss: "nirka-inventory-api",
      aud: "nirka-inventory-api",
      sub: "user-1",
      sid: "session-1",
      av: 0,
      token_type: "access",
      version: 1,
    });
    expect(claims.jti).toEqual(expect.any(String));
    expect(claims.iat).toEqual(expect.any(Number));
    expect(claims.nbf).toEqual(expect.any(Number));
    expect(claims.exp).toEqual(expect.any(Number));
    expect(claims).not.toHaveProperty("role");
    expect(claims).not.toHaveProperty("active");
  });

  it("rejects tampered tokens", () => {
    const service = new LocalJwtService();
    const token = service.signAccessToken({
      userId: "user-1",
      sessionId: "session-1",
      authVersion: 0,
    }).accessToken;
    const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;

    expect(() => service.verifyAccessToken(tampered)).toThrow(
      UnauthorizedException,
    );
  });

  it("requires a strong configured secret", () => {
    process.env.JWT_SECRET = "too-short";
    const service = new LocalJwtService();

    expect(() =>
      service.signAccessToken({
        userId: "user-1",
        sessionId: "session-1",
        authVersion: 0,
      }),
    ).toThrow("JWT_SECRET must be configured");
  });

  it("rejects a missing or weak secret during production module startup", () => {
    process.env.NODE_ENV = "production";
    delete process.env.JWT_SECRET;

    expect(() => new LocalJwtService().onModuleInit()).toThrow(
      "JWT_SECRET must be configured",
    );

    process.env.JWT_SECRET = "too-short";

    expect(() => new LocalJwtService().onModuleInit()).toThrow(
      "JWT_SECRET must be configured",
    );
  });
});

import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { validate } from "class-validator";
import { randomBytes } from "node:crypto";
import type { AuthenticatedUser } from "./auth-user";
import { LocalAuthService } from "./local-auth.service";
import { PasswordService } from "./password.service";
import { InitializeAdministratorPasswordDto } from "./dto/local-auth.dto";
import { AuthController } from "./auth.controller";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { Reflector } from "@nestjs/core";
import { KeycloakAuthGuard } from "./keycloak-auth.guard";
import { RolesGuard } from "./roles.guard";

const actor: AuthenticatedUser = {
  userId: "admin-id", subject: "verified-sso-subject", username: "ADMIN1",
  role: "ADMINISTRATOR", roles: ["administrator"], provider: "keycloak",
};

function setup(overrides = {}) {
  const user = {
    id: "admin-id", employeeId: "ADMIN1", email: "admin1@nirka.local",
    displayName: "Administrator", role: "ADMINISTRATOR", active: true,
    passwordHash: null as string | null, passwordChangedAt: null,
    mustChangePassword: false, authVersion: 0, lastLoginAt: null,
    legacyKeycloakSubject: actor.subject, ...overrides,
  };
  let auditCount = 0;
  const db: any = {
    user: {
      findUnique: jest.fn(async () => user),
      findFirst: jest.fn(async () => user),
      count: jest.fn(async () => user.active && user.passwordHash ? 1 : 0),
      update: jest.fn(async ({ data }) => {
        Object.assign(user, { ...data, authVersion: data.authVersion ? user.authVersion + 1 : user.authVersion });
        return user;
      }),
    },
    authSession: { updateMany: jest.fn(async () => ({ count: 0 })) },
    userAccessAudit: {
      count: jest.fn(async () => auditCount),
      create: jest.fn(async () => { auditCount++; return {}; }),
    },
    $executeRaw: jest.fn(async () => 0),
    $transaction: jest.fn(async (callback) => callback(db)),
  };
  const passwords = new PasswordService();
  const hash = jest.spyOn(passwords, "hash");
  const sessions = { createSession: jest.fn(async () => ({ userId: user.id, sessionId: "session" })) };
  const jwt = { signAccessToken: jest.fn(() => ({ accessToken: "test", tokenType: "Bearer", expiresIn: 600 })) };
  const service = new LocalAuthService(db, passwords, sessions as never, jwt as never);
  return { service, db, user, hash, passwords, sessions };
}

describe("one-time administrator local credential initialization", () => {
  const password = randomBytes(24).toString("base64url");

  it("denies ADMIN1 without a hash, initializes with Argon2id, then permits local login", async () => {
    const { service, db, user, passwords } = setup();
    await expect(service.login({ identifier: "admin1", password })).rejects.toEqual(new UnauthorizedException("Invalid credentials."));
    const result = await service.initializeAdministratorPassword(actor, password);
    expect(result.localAuthEnabled).toBe(true);
    expect(result).not.toHaveProperty("passwordHash");
    expect(user.passwordHash).toMatch(/^\$argon2id\$/);
    expect(await passwords.verify(user.passwordHash!, password)).toBe(true);
    expect(user.passwordChangedAt).toBeInstanceOf(Date);
    expect(user.authVersion).toBe(1);
    expect(user.mustChangePassword).toBe(false);
    expect(db.$executeRaw.mock.calls[0][0][0]).toContain("LOCK TABLE public.users IN SHARE ROW EXCLUSIVE MODE");
    expect(db.authSession.updateMany).toHaveBeenCalledWith({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: expect.any(Date), revokedReason: "password_initialized" } });
    expect(db.userAccessAudit.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "ADMIN_LOCAL_PASSWORD_INITIALIZED", targetUserId: user.id }) });
    expect(JSON.stringify(db.userAccessAudit.create.mock.calls)).not.toContain(password);
    const login = await service.login({ identifier: " admin1 ", password });
    expect(login.response.user.role).toBe("ADMINISTRATOR");
    expect(db.user.findFirst).toHaveBeenLastCalledWith(expect.objectContaining({ where: { OR: [{ employeeId: "ADMIN1" }, { email: "admin1" }] } }));
    await expect(service.initializeAdministratorPassword(actor, password)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it.each([undefined, { ...actor, provider: "local" }, { ...actor, role: "MANAGER" }, { ...actor, subject: "" }])("rejects unauthenticated/local/non-admin callers", async (identity) => {
    const { service, hash, db } = setup();
    await expect(service.initializeAdministratorPassword(identity as AuthenticatedUser, password)).rejects.toBeInstanceOf(ForbiddenException);
    expect(hash).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it.each([{ active: false }, { role: "WORKER" }, { legacyKeycloakSubject: "different-subject" }, { passwordHash: "existing-credential" }])("rechecks canonical account eligibility inside the transaction: %j", async (overrides) => {
    const { service, db } = setup(overrides);
    await expect(service.initializeAdministratorPassword(actor, password)).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("does not allow a second administrator or reopen after a prior bootstrap", async () => {
    const { service, db } = setup();
    db.user.count.mockResolvedValue(1);
    await expect(service.initializeAdministratorPassword(actor, password)).rejects.toBeInstanceOf(ForbiddenException);
    db.user.count.mockResolvedValue(0);
    db.userAccessAudit.count.mockResolvedValue(1);
    await expect(service.initializeAdministratorPassword(actor, password)).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("only advertises initialization to authenticated SSO administrators", async () => {
    const { service } = setup();
    expect((await service.me("admin-id", "keycloak")).localPasswordInitializationAvailable).toBe(true);
    expect((await service.me("admin-id", "local")).localPasswordInitializationAvailable).toBe(false);
  });

  it("requires CSRF and is not a public endpoint", () => {
    const initialize = jest.fn();
    const cookies = { assertCsrf: jest.fn(() => { throw new ForbiddenException(); }) };
    const controller = new AuthController({} as never, { initializeAdministratorPassword: initialize } as never, cookies as never);
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, controller.initializeAdministratorPassword)).not.toBe(true);
    expect(() => controller.initializeAdministratorPassword({ newPassword: password }, {} as never)).toThrow(ForbiddenException);
    expect(initialize).not.toHaveBeenCalled();
  });

  it("the real global guards reject unauthenticated and non-admin requests to initialization", async () => {
    const request: any = { headers: {}, path: "/api/auth/initialize-admin-password" };
    const context: any = {
      getHandler: () => AuthController.prototype.initializeAdministratorPassword,
      getClass: () => AuthController,
      switchToHttp: () => ({ getRequest: () => request }),
    };
    const reflector = new Reflector();
    const authGuard = new KeycloakAuthGuard(reflector, {} as never, {} as never);
    await expect(authGuard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    request.authUser = { ...actor, role: "WORKER" };
    expect(() => new RolesGuard(reflector).canActivate(context)).toThrow(ForbiddenException);
  });

  it("validates password length without adding a default", async () => {
    const input = new InitializeAdministratorPasswordDto();
    input.newPassword = "short";
    expect(await validate(input)).not.toHaveLength(0);
    input.newPassword = password;
    expect(await validate(input)).toHaveLength(0);
    Object.assign(input, { userId: "another-administrator" });
    expect(await validate(input, { whitelist: true, forbidNonWhitelisted: true })).not.toHaveLength(0);
  });
});

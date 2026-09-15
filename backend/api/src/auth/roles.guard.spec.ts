import { ForbiddenException } from "@nestjs/common";

import { RolesGuard } from "./roles.guard";

function makeContext(authUser: Record<string, unknown>) {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ authUser }) }),
  } as never;
}

describe("RolesGuard database-authoritative roles", () => {
  it("uses the canonical PostgreSQL role instead of Keycloak realm roles", () => {
    const reflector = {
      getAllAndOverride: jest.fn(() => ["administrator"]),
    };
    const guard = new RolesGuard(reflector as never);

    expect(() =>
      guard.canActivate(
        makeContext({ role: "WORKER", roles: ["administrator"] }),
      ),
    ).toThrow(ForbiddenException);
  });

  it("takes a role downgrade effect on the next request", () => {
    const reflector = {
      getAllAndOverride: jest.fn(() => ["administrator"]),
    };
    const guard = new RolesGuard(reflector as never);
    const request = { role: "ADMINISTRATOR", roles: ["administrator"] };

    expect(guard.canActivate(makeContext(request))).toBe(true);
    request.role = "WORKER";
    expect(() => guard.canActivate(makeContext(request))).toThrow(
      ForbiddenException,
    );
  });
});

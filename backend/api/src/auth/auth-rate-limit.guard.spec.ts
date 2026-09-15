import { HttpException } from "@nestjs/common";

import { AuthRateLimitGuard } from "./auth-rate-limit.guard";
import { AuthRateLimitService } from "./auth-rate-limit.service";

describe("AuthRateLimitGuard", () => {
  it("limits repeated login attempts by client address", () => {
    const limiter = new AuthRateLimitService();
    const guard = new AuthRateLimitGuard(limiter);
    const request = {
      path: "/api/auth/login",
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
      authUser: undefined,
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as never;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(guard.canActivate(context)).toBe(true);
    }
    expect(() => guard.canActivate(context)).toThrow(HttpException);
    try {
      guard.canActivate(context);
    } catch (error) {
      expect((error as HttpException).getStatus()).toBe(429);
    }
  });
});

import { UnauthorizedException } from "@nestjs/common";

import { resolveCanonicalUser } from "./canonical-user";

describe("resolveCanonicalUser", () => {
  it("uses canonical userId and never auto-provisions an unknown actor", async () => {
    const prisma = {
      user: {
        findUnique: jest.fn(async () => null),
        create: jest.fn(),
      },
    };

    await expect(
      resolveCanonicalUser(prisma as never, {
        subject: "keycloak-subject",
        username: "UNKNOWN",
        roles: ["administrator"],
        userId: "missing-user",
        role: "WORKER",
        provider: "keycloak",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "missing-user" },
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});

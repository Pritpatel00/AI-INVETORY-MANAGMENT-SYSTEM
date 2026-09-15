import { UnauthorizedException } from "@nestjs/common";

import type { PrismaService } from "../prisma/prisma.service";
import type { AuthenticatedUser } from "./auth-user";

/**
 * Resolves the already-authenticated PostgreSQL user. Requests produced by
 * either authentication provider always carry userId; the identifier
 * fallback exists only for older direct service callers and test fixtures.
 * It never creates a user.
 */
export async function resolveCanonicalUser(
  prisma: PrismaService,
  actor: AuthenticatedUser,
) {
  if (actor.userId) {
    const user = await prisma.user.findUnique({ where: { id: actor.userId } });
    if (!user) throw authenticatedUserUnavailable();
    return user;
  }

  const email = actor.email?.toLowerCase();
  const user = email
    ? await prisma.user.findUnique({ where: { email } })
    : await prisma.user.findUnique({
        where: { employeeId: actor.employeeId?.toUpperCase() ?? actor.username.toUpperCase() },
      });
  if (!user) throw authenticatedUserUnavailable();
  return user;
}

export function getAuthenticatedEmail(actor: AuthenticatedUser): string | undefined {
  return actor.email?.toLowerCase();
}

export function getAuthenticatedEmployeeId(actor: AuthenticatedUser): string {
  return (actor.employeeId ?? actor.username).toUpperCase();
}

export function hasApplicationRole(
  actor: AuthenticatedUser,
  requiredRoles: readonly string[],
  databaseRole?: string,
): boolean {
  const role = (databaseRole ?? actor.role)?.toLowerCase();
  if (role) return requiredRoles.some((required) => required.toLowerCase() === role);

  // Compatibility for direct service unit fixtures created before the
  // canonical auth-user contract. Real requests always have databaseRole or
  // actor.role populated by the dual-auth guard.
  return requiredRoles.some((required) =>
    actor.roles?.some((legacyRole) => legacyRole.toLowerCase() === required.toLowerCase()),
  );
}

function authenticatedUserUnavailable(): UnauthorizedException {
  return new UnauthorizedException(
    "The authenticated inventory user profile is unavailable.",
  );
}

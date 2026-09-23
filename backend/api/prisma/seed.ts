import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

// Fresh-start seed: this script only creates the local demonstration users.
// Employee IDs match the Keycloak usernames (worker1, manager1, admin1) so
// authenticated requests resolve to pre-provisioned database rows.
// New users are SSO-only until credentials are securely initialized. Existing
// passwords are never overwritten. See docs/local-auth-initialization.md.
//
// It deliberately creates NO inventory transactions, products, balances or
// locations. The clean product catalogue and opening balances come from
// `seed-catalog.ts` (`npm run db:seed:catalog`).
async function main() {
  await prisma.user.upsert({
    where: { email: "worker1@nirka.local" },
    update: {
      employeeId: "WORKER1",
      displayName: "Warehouse Worker",
      role: UserRole.WORKER,
    },
    create: {
      employeeId: "WORKER1",
      email: "worker1@nirka.local",
      displayName: "Warehouse Worker",
      role: UserRole.WORKER,
    },
  });

  await prisma.user.upsert({
    where: { email: "manager1@nirka.local" },
    update: {
      employeeId: "MANAGER1",
      displayName: "Inventory Manager",
      role: UserRole.MANAGER,
    },
    create: {
      employeeId: "MANAGER1",
      email: "manager1@nirka.local",
      displayName: "Inventory Manager",
      role: UserRole.MANAGER,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin1@nirka.local" },
    update: {
      employeeId: "ADMIN1",
      displayName: "Inventory Administrator",
      role: UserRole.ADMINISTRATOR,
    },
    create: {
      employeeId: "ADMIN1",
      email: "admin1@nirka.local",
      displayName: "Inventory Administrator",
      role: UserRole.ADMINISTRATOR,
    },
  });

  console.log("Demo users ready: worker1, manager1, admin1.");
  console.warn("No local passwords are seeded. Use administrator legacy SSO to initialize the first administrator credential, then User Management to set manager/worker temporary passwords. See docs/local-auth-initialization.md.");
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });

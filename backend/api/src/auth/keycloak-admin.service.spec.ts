import { KeycloakAdminService } from "./keycloak-admin.service";

describe("KeycloakAdminService compatibility synchronizer", () => {
  const originalClientId = process.env.KEYCLOAK_USER_ADMIN_CLIENT_ID;
  const originalClientSecret = process.env.KEYCLOAK_USER_ADMIN_CLIENT_SECRET;

  afterEach(() => {
    process.env.KEYCLOAK_USER_ADMIN_CLIENT_ID = originalClientId;
    process.env.KEYCLOAK_USER_ADMIN_CLIENT_SECRET = originalClientSecret;
  });

  it("returns a non-sensitive failure result when Keycloak sync cannot start", async () => {
    delete process.env.KEYCLOAK_USER_ADMIN_CLIENT_ID;
    delete process.env.KEYCLOAK_USER_ADMIN_CLIENT_SECRET;
    const service = new KeycloakAdminService();

    const result = await service.syncCreateUser({
      employeeId: "WORKER1",
      email: "worker1@example.com",
      displayName: "Worker One",
      role: "WORKER",
      active: true,
      temporaryPassword: "Temporary@123",
    });

    expect(result.status).toBe("failed");
    expect(JSON.stringify(result)).not.toContain("Temporary@123");
    expect(JSON.stringify(result)).not.toContain("KEYCLOAK_USER_ADMIN_CLIENT_SECRET");
  });
});

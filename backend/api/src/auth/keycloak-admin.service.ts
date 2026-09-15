import { Injectable } from "@nestjs/common";

export type CompatibilitySyncResult =
  | { status: "synchronized" }
  | { status: "failed"; message: string };

type KeycloakRole = {
  id: string;
  name: string;
  description?: string;
  composite?: boolean;
  clientRole?: boolean;
  containerId?: string;
};

type KeycloakUser = {
  id: string;
  username: string;
  email?: string;
  enabled?: boolean;
};

type SyncUserInput = {
  employeeId: string;
  email: string;
  displayName: string;
  role: "WORKER" | "MANAGER";
  active: boolean;
};

@Injectable()
export class KeycloakAdminService {
  private readonly issuer =
    process.env.KEYCLOAK_ISSUER ??
    "http://localhost:8080/realms/nirka-inventory";
  private readonly baseUrl =
    process.env.KEYCLOAK_BASE_URL ?? this.issuer.split("/realms/")[0];
  private readonly realm =
    process.env.KEYCLOAK_REALM ?? this.issuer.split("/realms/")[1];

  async syncCreateUser(
    input: SyncUserInput & { temporaryPassword: string },
  ): Promise<CompatibilitySyncResult> {
    return this.runSync("create", async () => {
      const accessToken = await this.getAdminToken();
      const [firstName, ...remainingNames] = input.displayName.split(/\s+/);
      const response = await this.keycloakRequest("/users", accessToken, {
        method: "POST",
        body: JSON.stringify({
          username: input.employeeId,
          email: input.email,
          firstName,
          lastName: remainingNames.join(" "),
          enabled: input.active,
          emailVerified: true,
          credentials: [
            {
              type: "password",
              value: input.temporaryPassword,
              temporary: true,
            },
          ],
        }),
      });
      const keycloakId = response.headers.get("location")?.split("/").pop();
      if (!keycloakId) throw new Error("Keycloak did not return an identifier.");
      await this.syncRoleInternal(keycloakId, input.role, accessToken);
    });
  }

  async syncUpdateUser(
    input: SyncUserInput & { previousEmployeeId: string },
  ): Promise<CompatibilitySyncResult> {
    return this.runSync("update", async () => {
      const accessToken = await this.getAdminToken();
      const keycloakUser = await this.findKeycloakUser(
        input.previousEmployeeId,
        accessToken,
      );
      if (!keycloakUser) throw new Error("The matching Keycloak user was not found.");

      const [firstName, ...remainingNames] = input.displayName.split(/\s+/);
      await this.keycloakRequest(`/users/${keycloakUser.id}`, accessToken, {
        method: "PUT",
        body: JSON.stringify({
          username: input.employeeId,
          email: input.email,
          firstName,
          lastName: remainingNames.join(" "),
          enabled: input.active,
          emailVerified: true,
        }),
      });
      await this.syncRoleInternal(keycloakUser.id, input.role, accessToken);
    });
  }

  async syncPasswordReset(input: {
    employeeId: string;
    temporaryPassword: string;
  }): Promise<CompatibilitySyncResult> {
    return this.runSync("password reset", async () => {
      const accessToken = await this.getAdminToken();
      const keycloakUser = await this.findKeycloakUser(input.employeeId, accessToken);
      if (!keycloakUser) throw new Error("The matching Keycloak user was not found.");
      await this.keycloakRequest(
        `/users/${keycloakUser.id}/reset-password`,
        accessToken,
        {
          method: "PUT",
          body: JSON.stringify({
            type: "password",
            value: input.temporaryPassword,
            temporary: true,
          }),
        },
      );
      await this.keycloakRequest(`/users/${keycloakUser.id}/logout`, accessToken, {
        method: "POST",
      }).catch(() => undefined);
    });
  }

  async syncStatus(input: {
    employeeId: string;
    active: boolean;
  }): Promise<CompatibilitySyncResult> {
    return this.runSync("status", async () => {
      const accessToken = await this.getAdminToken();
      const keycloakUser = await this.findKeycloakUser(input.employeeId, accessToken);
      if (!keycloakUser) throw new Error("The matching Keycloak user was not found.");
      await this.keycloakRequest(`/users/${keycloakUser.id}`, accessToken, {
        method: "PUT",
        body: JSON.stringify({ enabled: input.active }),
      });
      if (!input.active) {
        await this.keycloakRequest(`/users/${keycloakUser.id}/logout`, accessToken, {
          method: "POST",
        }).catch(() => undefined);
      }
    });
  }

  async syncRole(input: {
    employeeId: string;
    role: "WORKER" | "MANAGER";
  }): Promise<CompatibilitySyncResult> {
    return this.runSync("role", async () => {
      const accessToken = await this.getAdminToken();
      const keycloakUser = await this.findKeycloakUser(input.employeeId, accessToken);
      if (!keycloakUser) throw new Error("The matching Keycloak user was not found.");
      await this.syncRoleInternal(keycloakUser.id, input.role, accessToken);
    });
  }

  private async syncRoleInternal(
    keycloakUserId: string,
    role: "WORKER" | "MANAGER",
    accessToken: string,
  ) {
    const currentRoles = await this.keycloakJson<KeycloakRole[]>(
      `/users/${keycloakUserId}/role-mappings/realm`,
      accessToken,
    );
    const removableRoles = currentRoles.filter((currentRole) =>
      ["worker", "manager"].includes(currentRole.name),
    );
    if (removableRoles.length) {
      await this.keycloakRequest(
        `/users/${keycloakUserId}/role-mappings/realm`,
        accessToken,
        { method: "DELETE", body: JSON.stringify(removableRoles) },
      );
    }
    const roleNames = role === "MANAGER" ? ["worker", "manager"] : ["worker"];
    const desiredRoles = await Promise.all(
      roleNames.map((roleName) =>
        this.keycloakJson<KeycloakRole>(
          `/roles/${encodeURIComponent(roleName)}`,
          accessToken,
        ),
      ),
    );
    await this.keycloakRequest(
      `/users/${keycloakUserId}/role-mappings/realm`,
      accessToken,
      { method: "POST", body: JSON.stringify(desiredRoles) },
    );
  }

  private async runSync(
    operation: string,
    action: () => Promise<void>,
  ): Promise<CompatibilitySyncResult> {
    try {
      await action();
      return { status: "synchronized" };
    } catch {
      return {
        status: "failed",
        message: `PostgreSQL ${operation} succeeded, but the Keycloak compatibility mirror could not be synchronized.`,
      };
    }
  }

  private async findKeycloakUser(username: string, accessToken: string) {
    const users = await this.keycloakJson<KeycloakUser[]>(
      `/users?username=${encodeURIComponent(username)}&exact=true`,
      accessToken,
    );
    return users[0] ?? null;
  }

  private async getAdminToken() {
    const clientId = process.env.KEYCLOAK_USER_ADMIN_CLIENT_ID;
    const clientSecret = process.env.KEYCLOAK_USER_ADMIN_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error("Keycloak admin credentials are missing.");

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    });
    const response = await fetch(
      `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) throw new Error("Keycloak admin authentication failed.");
    const payload = (await response.json()) as { access_token?: string };
    if (!payload.access_token) throw new Error("Keycloak did not return an admin token.");
    return payload.access_token;
  }

  private async keycloakJson<T>(path: string, accessToken: string) {
    const response = await this.keycloakRequest(path, accessToken);
    return response.json() as Promise<T>;
  }

  private async keycloakRequest(
    path: string,
    accessToken: string,
    init: RequestInit = {},
  ) {
    const response = await fetch(
      `${this.baseUrl}/admin/realms/${encodeURIComponent(this.realm)}${path}`,
      {
        ...init,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          ...init.headers,
        },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) throw new Error(`Keycloak request failed (${response.status}).`);
    return response;
  }
}

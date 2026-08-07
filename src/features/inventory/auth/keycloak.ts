import Keycloak from "keycloak-js";

import type { Role } from "../types";

export const keycloak = new Keycloak({
  url: "http://localhost:8080",
  realm: "nirka-inventory",
  clientId: "nirka-inventory-web",
});

let initialization: Promise<boolean> | null = null;

export function initializeKeycloak() {
  if (!initialization) {
    initialization = keycloak.init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      checkLoginIframe: false,
    });
  }
  return initialization;
}

export function canUseRole(role: Role) {
  if (role === "administrator") {
    return keycloak.hasRealmRole("administrator");
  }

  if (role === "manager") {
    return (
      keycloak.hasRealmRole("manager") ||
      keycloak.hasRealmRole("administrator")
    );
  }

  return (
    keycloak.hasRealmRole("worker") ||
    keycloak.hasRealmRole("manager") ||
    keycloak.hasRealmRole("administrator")
  );
}

export function getAuthenticatedDisplayName() {
  const claims = keycloak.tokenParsed as
    | { name?: string; preferred_username?: string }
    | undefined;
  return claims?.name ?? claims?.preferred_username ?? "Inventory user";
}

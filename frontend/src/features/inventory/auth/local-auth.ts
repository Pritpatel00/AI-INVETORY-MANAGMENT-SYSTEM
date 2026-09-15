import { useCallback, useEffect, useState } from "react";

import {
  changeLocalPassword,
  loginLocal,
  logoutLocal,
  refreshLocalSession,
  setInventoryAccessToken,
  setInventoryAuthFailureHandler,
  type ApiAuthenticatedUser,
  type ApiAuthProvider,
} from "../api/inventory-api";
import type { Role } from "../types";

export type CanonicalUser = ApiAuthenticatedUser;

const roleToWorkspace: Record<CanonicalUser["role"], Role> = {
  WORKER: "worker",
  MANAGER: "manager",
  ADMINISTRATOR: "administrator",
};

export function workspaceForUser(user: CanonicalUser): Role {
  return roleToWorkspace[user.role];
}

/** Workspace selection controls navigation only; it never grants access. */
export function userCanUseWorkspace(user: CanonicalUser, workspace: Role) {
  return workspaceForUser(user) === workspace;
}

export function offlineOwnerForUser(user: CanonicalUser) {
  return `nirka-user:${user.id}`;
}

export interface LocalAuthState {
  ready: boolean;
  loading: boolean;
  user: CanonicalUser | null;
  provider: ApiAuthProvider | null;
  error: string;
  login: (identifier: string, password: string) => Promise<CanonicalUser>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<CanonicalUser>;
  logout: () => Promise<void>;
  adoptExternalSession: (user: CanonicalUser) => void;
  clearSession: () => void;
  clearError: () => void;
}

export function useLocalAuth(): LocalAuthState {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<CanonicalUser | null>(null);
  const [provider, setProvider] = useState<ApiAuthProvider | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setInventoryAuthFailureHandler(() => {
      if (!active) return;
      setUser(null);
      setProvider(null);
      setError("Your secure session expired. Please sign in again.");
    });

    // Local refresh is always attempted before Keycloak fallback is allowed.
    refreshLocalSession()
      .then((result) => {
        if (!active) return;
        setUser(result.user);
        setProvider("local");
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
      setInventoryAuthFailureHandler();
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    setLoading(true);
    setError("");
    try {
      const result = await loginLocal(identifier, password);
      setUser(result.user);
      setProvider("local");
      return result.user;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Invalid credentials.";
      setError(message);
      throw cause;
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    setError("");
    try {
      const result = await changeLocalPassword(currentPassword, newPassword);
      setUser(result.user);
      setProvider("local");
      return result.user;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Password change failed.";
      setError(message);
      throw cause;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await logoutLocal();
    } finally {
      setUser(null);
      setProvider(null);
      setLoading(false);
    }
  }, []);

  const adoptExternalSession = useCallback((externalUser: CanonicalUser) => {
    setUser(externalUser);
    setProvider("keycloak");
    setError("");
  }, []);

  const clearSession = useCallback(() => {
    setInventoryAccessToken();
    setUser(null);
    setProvider(null);
  }, []);

  const clearError = useCallback(() => setError(""), []);

  return {
    ready,
    loading,
    user,
    provider,
    error,
    login,
    changePassword,
    logout,
    adoptExternalSession,
    clearSession,
    clearError,
  };
}

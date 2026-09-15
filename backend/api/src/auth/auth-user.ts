import type { Request } from "express";

export interface AuthenticatedUser {
  subject: string;
  username: string;
  email?: string;
  roles: string[];
  userId?: string;
  employeeId?: string;
  displayName?: string;
  role?: string;
  provider?: "keycloak" | "local";
  sessionId?: string;
  authVersion?: number;
  mustChangePassword?: boolean;
  active?: boolean;
}

export type AuthenticatedRequest = Request & {
  authUser?: AuthenticatedUser;
};

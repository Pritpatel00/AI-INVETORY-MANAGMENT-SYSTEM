import type { Request } from "express";

export interface AuthenticatedUser {
  subject: string;
  username: string;
  email?: string;
  roles: string[];
}

export type AuthenticatedRequest = Request & {
  authUser?: AuthenticatedUser;
};

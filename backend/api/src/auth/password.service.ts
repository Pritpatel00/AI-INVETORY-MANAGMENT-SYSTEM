import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";

export const ARGON2ID_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 64 * 1024,
  timeCost: 3,
  parallelism: 1,
} as const;

@Injectable()
export class PasswordService {
  hash(password: string): Promise<string> {
    return argon2.hash(password, ARGON2ID_OPTIONS);
  }

  async verify(passwordHash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(passwordHash, password);
    } catch {
      // A malformed or unsupported stored hash must behave like a failed
      // password check, not become an authentication-server error.
      return false;
    }
  }
}

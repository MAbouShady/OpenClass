import bcrypt from "bcryptjs";
import type { PasswordHasher } from "@/modules/auth/domain/password-hasher";

const SALT_ROUNDS = 12;

export class BcryptPasswordHasher implements PasswordHasher {
  hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
  }

  verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  }
}

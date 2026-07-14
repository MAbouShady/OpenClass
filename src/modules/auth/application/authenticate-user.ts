import { err, ok, type Result } from "@/shared/domain/result";
import { InvalidCredentialsError } from "@/modules/auth/domain/errors";
import type { PasswordHasher } from "@/modules/auth/domain/password-hasher";
import type { User } from "@/modules/auth/domain/user";
import type { UserRepository } from "@/modules/auth/domain/user-repository";
import {
  authenticateUserSchema,
  type AuthenticateUserInput,
} from "@/modules/auth/application/authenticate-user.schema";

export type AuthenticateUserDeps = {
  readonly userRepository: UserRepository;
  readonly passwordHasher: PasswordHasher;
};

export async function authenticateUser(
  deps: AuthenticateUserDeps,
  input: AuthenticateUserInput,
): Promise<Result<User, InvalidCredentialsError>> {
  const { email, password } = authenticateUserSchema.parse(input);

  const existing = await deps.userRepository.findByEmail(email);
  if (!existing) {
    return err(new InvalidCredentialsError());
  }

  if (!existing.passwordHash) {
    return err(new InvalidCredentialsError());
  }
  const valid = await deps.passwordHasher.verify(password, existing.passwordHash);
  if (!valid) {
    return err(new InvalidCredentialsError());
  }

  return ok({
    id: existing.id,
    name: existing.name,
    email: existing.email,
    role: existing.role,
    bio: existing.bio,
    photoUrl: existing.photoUrl,
    coverUrl: existing.coverUrl,
    coverOffsetY: existing.coverOffsetY,
    accentColor: existing.accentColor,
    paymentDetails: existing.paymentDetails,
    locale: existing.locale,
  });
}

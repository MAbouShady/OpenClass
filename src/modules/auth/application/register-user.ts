import { err, ok, type Result } from "@/shared/domain/result";
import { EmailAlreadyTakenError } from "@/modules/auth/domain/errors";
import type { PasswordHasher } from "@/modules/auth/domain/password-hasher";
import type { User } from "@/modules/auth/domain/user";
import type { UserRepository } from "@/modules/auth/domain/user-repository";
import {
  registerUserSchema,
  type RegisterUserInput,
} from "@/modules/auth/application/register-user.schema";

export type RegisterUserDeps = {
  readonly userRepository: UserRepository;
  readonly passwordHasher: PasswordHasher;
};

export async function registerUser(
  deps: RegisterUserDeps,
  input: RegisterUserInput,
): Promise<Result<User, EmailAlreadyTakenError>> {
  const { name, phone, email, password, role, locale } = registerUserSchema.parse(input);

  if (phone) {
    const existingByPhone = await deps.userRepository.findByPhone(phone);
    if (existingByPhone) {
      return err(new EmailAlreadyTakenError(phone));
    }
  }
  if (email) {
    const existingByEmail = await deps.userRepository.findByEmail(email);
    if (existingByEmail) {
      return err(new EmailAlreadyTakenError(email));
    }
  }

  const passwordHash = await deps.passwordHasher.hash(password);
  const user = await deps.userRepository.create({ name, phone, email, passwordHash, role, locale });

  return ok({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio,
    photoUrl: user.photoUrl,
    coverUrl: user.coverUrl,
    accentColor: user.accentColor,
    paymentDetails: user.paymentDetails,
    locale: user.locale,
  });
}

import type { User } from "@/modules/auth/domain/user";
import type { UserRepository } from "@/modules/auth/domain/user-repository";
import {
  updateProfileSchema,
  type UpdateProfileSchemaInput,
} from "@/modules/auth/application/update-profile.schema";

export type UpdateProfileDeps = {
  readonly userRepository: UserRepository;
};

export async function updateProfile(
  deps: UpdateProfileDeps,
  userId: string,
  input: UpdateProfileSchemaInput,
): Promise<User> {
  const parsed = updateProfileSchema.parse(input);
  const user = await deps.userRepository.updateProfile(userId, parsed);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio,
    locale: user.locale,
  };
}

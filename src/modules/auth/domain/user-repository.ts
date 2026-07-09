import type { User, UserWithCredentials } from "@/modules/auth/domain/user";
import type { Role } from "@/modules/auth/domain/role";

export type CreateUserInput = {
  readonly name: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: Role;
  readonly locale: string;
};

export type UpdateProfileInput = {
  readonly name: string;
  readonly bio: string | null;
};

export interface UserRepository {
  findByEmail(email: string): Promise<UserWithCredentials | null>;
  findById(id: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<UserWithCredentials>;
  updateProfile(id: string, input: UpdateProfileInput): Promise<User>;
}

import type { User, UserWithCredentials } from "@/modules/auth/domain/user";
import type { Role } from "@/modules/auth/domain/role";

export type CreateUserInput = {
  readonly name: string;
  readonly phone?: string | null;
  readonly email?: string | null;
  readonly passwordHash: string | null;
  readonly role: Role;
  readonly locale: string;
};

export type UpdateProfileInput = {
  readonly name: string;
  readonly bio: string | null;
  readonly photoUrl: string | null;
  readonly coverUrl: string | null;
  readonly coverOffsetY: number;
  readonly accentColor: string | null;
  readonly paymentDetails: string | null;
  readonly locale: string;
};

export type CreateSecretaryInput = {
  readonly name: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly teacherId: string;
};

export interface UserRepository {
  findByEmail(email: string): Promise<UserWithCredentials | null>;
  findByPhone(phone: string): Promise<UserWithCredentials | null>;
  findById(id: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<UserWithCredentials>;
  findOrCreateByPhone(phone: string, name: string): Promise<User>;
  updateProfile(id: string, input: UpdateProfileInput): Promise<User>;
  findSecretariesByTeacherId(teacherId: string): Promise<User[]>;
  createSecretary(input: CreateSecretaryInput): Promise<User>;
  deleteById(id: string): Promise<void>;
}

import type { Role } from "@/modules/auth/domain/role";

export type User = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: Role;
  readonly bio: string | null;
  readonly locale: string;
};

export type UserWithCredentials = User & {
  readonly passwordHash: string;
};

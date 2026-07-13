import type { Role } from "@/modules/auth/domain/role";

export type User = {
  readonly id: string;
  readonly name: string;
  readonly email: string | null;
  readonly role: Role;
  readonly bio: string | null;
  readonly photoUrl: string | null;
  readonly coverUrl: string | null;
  readonly accentColor: string | null;
  readonly paymentDetails: string | null;
  readonly locale: string;
};

export type UserWithCredentials = User & {
  readonly passwordHash: string | null;
};

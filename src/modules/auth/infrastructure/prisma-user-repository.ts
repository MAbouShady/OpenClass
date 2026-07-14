import { prisma } from "@/shared/infrastructure/prisma/client";
import type {
  CreateUserInput,
  UpdateProfileInput,
  UserRepository,
} from "@/modules/auth/domain/user-repository";
import type { User, UserWithCredentials } from "@/modules/auth/domain/user";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toUser(row: any): User {
  return {
    id: row.id as string,
    name: row.name as string,
    email: (row.email as string | null) ?? null,
    role: row.role,
    bio: (row.bio as string | null) ?? null,
    photoUrl: (row.photoUrl as string | null) ?? null,
    coverUrl: (row.coverUrl as string | null) ?? null,
    coverOffsetY: (row.coverOffsetY as number | null) ?? 50,
    accentColor: (row.accentColor as string | null) ?? null,
    paymentDetails: (row.paymentDetails as string | null) ?? null,
    locale: (row.locale as string) ?? "en",
  };
}

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<UserWithCredentials | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return { ...toUser(user), passwordHash: user.passwordHash };
  }

  async findByPhone(phone: string): Promise<UserWithCredentials | null> {
    const user = await prisma.user.findFirst({ where: { phone } });
    if (!user) return null;
    return { ...toUser(user), passwordHash: user.passwordHash };
  }

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return toUser(user);
  }

  async create(input: CreateUserInput): Promise<UserWithCredentials> {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        passwordHash: input.passwordHash,
        role: input.role,
        locale: input.locale,
      },
    });
    return { ...toUser(user), passwordHash: user.passwordHash };
  }

  async findOrCreateByPhone(phone: string, name: string): Promise<User> {
    const existing = await prisma.user.findFirst({ where: { phone } });
    if (existing) return toUser(existing);
    const created = await prisma.user.create({
      data: { name, phone, email: null, passwordHash: null, role: "STUDENT", locale: "ar" },
    });
    return toUser(created);
  }

  async updateProfile(id: string, input: UpdateProfileInput): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: input.name,
        bio: input.bio,
        photoUrl: input.photoUrl,
        coverUrl: input.coverUrl,
        coverOffsetY: input.coverOffsetY,
        accentColor: input.accentColor,
        paymentDetails: input.paymentDetails,
        locale: input.locale,
      },
    });
    return toUser(user);
  }
}

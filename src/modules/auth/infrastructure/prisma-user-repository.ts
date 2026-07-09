import { prisma } from "@/shared/infrastructure/prisma/client";
import type {
  CreateUserInput,
  UpdateProfileInput,
  UserRepository,
} from "@/modules/auth/domain/user-repository";
import type { User, UserWithCredentials } from "@/modules/auth/domain/user";

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<UserWithCredentials | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(input: CreateUserInput): Promise<UserWithCredentials> {
    return prisma.user.create({ data: input });
  }

  async updateProfile(id: string, input: UpdateProfileInput): Promise<User> {
    return prisma.user.update({ where: { id }, data: input });
  }
}

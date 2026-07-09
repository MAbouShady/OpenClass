import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { authenticateUser } from "@/modules/auth/application/authenticate-user";
import { authenticateUserSchema } from "@/modules/auth/application/authenticate-user.schema";
import { BcryptPasswordHasher } from "@/modules/auth/infrastructure/bcrypt-password-hasher";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";

const userRepository = new PrismaUserRepository();
const passwordHasher = new BcryptPasswordHasher();

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = authenticateUserSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const result = await authenticateUser({ userRepository, passwordHasher }, parsed.data);
        if (!result.ok) return null;

        return result.value;
      },
    }),
  ],
});

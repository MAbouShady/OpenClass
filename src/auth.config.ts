import type { NextAuthConfig } from "next-auth";
import { env } from "@/shared/config/env";

export const authConfig = {
  secret: env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.locale = user.locale;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.role) session.user.role = token.role as string;
      if (token.locale) session.user.locale = token.locale as string;
      return session;
    },
  },
} satisfies NextAuthConfig;

import type { DefaultSession } from "next-auth";
import type { Role } from "@/modules/auth/domain/role";

declare module "@auth/core/types" {
  interface User {
    id: string;
    role: Role;
    locale: string;
  }

  interface Session {
    user: User & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    locale: string;
  }
}

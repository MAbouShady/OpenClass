import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { canAccess } from "@/modules/auth/application/can-access";
import type { Role } from "@/modules/auth/domain/role";

const { auth } = NextAuth(authConfig);

const ROUTE_ROLES: Record<string, readonly Role[]> = {
  "/dashboard/admin": ["ADMIN"],
  "/dashboard/teacher": ["ADMIN", "TEACHER"],
  "/dashboard/student": ["STUDENT"],
  "/dashboard/parent": ["PARENT"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const matchedPrefix = Object.keys(ROUTE_ROLES).find((prefix) => pathname.startsWith(prefix));
  if (!matchedPrefix) return NextResponse.next();

  const allowedRoles = ROUTE_ROLES[matchedPrefix];
  const role = req.auth?.user.role;

  if (!allowedRoles || !canAccess(role, allowedRoles)) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};

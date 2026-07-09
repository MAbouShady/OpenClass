import type { Role } from "@/modules/auth/domain/role";

export function canAccess(userRole: Role | undefined, allowedRoles: readonly Role[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

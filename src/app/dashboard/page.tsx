import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@/modules/auth/domain/role";

const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/dashboard/admin",
  TEACHER: "/dashboard/teacher",
  STUDENT: "/dashboard/student",
  PARENT: "/dashboard/parent",
  SECRETARY: "/dashboard/secretary",
};

export default async function DashboardIndexPage() {
  const session = await auth();
  if (!session) redirect("/login");
  redirect(ROLE_HOME[session.user.role]);
}

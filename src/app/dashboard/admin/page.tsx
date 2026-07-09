import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { DashboardShell } from "@/modules/auth/presentation/dashboard-shell";
import { LinkButton } from "@/components/common/link-button";

export default async function AdminDashboardPage() {
  const session = await auth();
  const t = await getTranslations("dashboard");

  return (
    <div className="flex flex-col space-y-6">
      <DashboardShell title={t("adminTitle")} email={session?.user.email ?? ""} />
      <div>
        <LinkButton href="/dashboard/admin/levels" variant="outline">
          Manage levels
        </LinkButton>
      </div>
    </div>
  );
}

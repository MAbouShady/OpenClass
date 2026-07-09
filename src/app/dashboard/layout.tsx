import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { DashboardChrome } from "@/modules/auth/presentation/dashboard-chrome";
import type { Locale } from "@/i18n/locale";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const locale = (await getLocale()) as Locale;

  return (
    <DashboardChrome
      role={session?.user.role ?? "TEACHER"}
      email={session?.user.email ?? ""}
      locale={locale}
    >
      {children}
    </DashboardChrome>
  );
}

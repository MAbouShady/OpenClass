import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { BookOpen, ChevronRight, Layers, Link2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LinkButton } from "@/components/common/link-button";

function QuickActionCard({
  icon,
  title,
  description,
  href,
  cta,
  color,
}: {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly cta: string;
  readonly color: string;
}) {
  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <div className={`absolute inset-0 opacity-[0.04] ${color}`} />
      <CardContent className="flex flex-col gap-4 p-6">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${color} text-white shadow-sm`}
        >
          {icon}
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="font-semibold leading-snug">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        <LinkButton
          href={href}
          variant="outline"
          className="self-start gap-1.5 text-xs"
        >
          {cta}
          <ChevronRight className="h-3.5 w-3.5" />
        </LinkButton>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const [session, t, tAdmin] = await Promise.all([
    auth(),
    getTranslations("dashboard"),
    getTranslations("admin"),
  ]);

  const greeting = session?.user.name?.split(" ")[0] ?? session?.user.email?.split("@")[0] ?? "";

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome header */}
      <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold shadow-sm">
            {greeting.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-semibold">
              {tAdmin("welcomeTitle")}, {greeting}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {tAdmin("welcomeSubtitle")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              {t("signedInAs", { email: session?.user.email ?? "" })}
            </p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {tAdmin("quickActions")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            icon={<Layers className="h-5 w-5" />}
            title={tAdmin("levelsTitle")}
            description={tAdmin("levelsDesc")}
            href="/dashboard/admin/levels"
            cta={tAdmin("goToLevels")}
            color="bg-indigo-500"
          />
          <QuickActionCard
            icon={<Link2 className="h-5 w-5" />}
            title={tAdmin("parentLinksTitle")}
            description={tAdmin("parentLinksDesc")}
            href="/dashboard/admin/parent-links"
            cta={tAdmin("goToParentLinks")}
            color="bg-emerald-500"
          />
          <QuickActionCard
            icon={<BookOpen className="h-5 w-5" />}
            title={tAdmin("coursesTitle")}
            description={tAdmin("coursesDesc")}
            href="/dashboard/teacher/courses"
            cta={tAdmin("goToCourses")}
            color="bg-violet-500"
          />
        </div>
      </section>
    </div>
  );
}

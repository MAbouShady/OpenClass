import { getTranslations } from "next-intl/server";

type DashboardShellProps = {
  readonly title: string;
  readonly email: string;
};

export async function DashboardShell({ title, email }: DashboardShellProps) {
  const t = await getTranslations("dashboard");

  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-1">{t("signedInAs", { email })}</p>

      <div className="mt-6 rounded-xl border bg-card p-6">
        <p className="text-muted-foreground text-sm">
          This dashboard is a placeholder — real widgets arrive as later tasks build them out.
        </p>
      </div>
    </div>
  );
}

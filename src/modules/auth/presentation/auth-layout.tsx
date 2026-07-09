import { getLocale, getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import type { Locale } from "@/i18n/locale";
import { cn } from "@/shared/lib/utils";

type AuthLayoutProps = {
  readonly title: string;
  readonly description: string;
  readonly children: React.ReactNode;
  readonly footer: React.ReactNode;
};

export async function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");
  const features = [t("heroFeature1"), t("heroFeature2"), t("heroFeature3")];

  return (
    <div className={cn("min-h-svh flex")}>
      {/* Left hero panel — hidden on mobile */}
      <aside className="hidden md:flex w-[45%] flex-col justify-between bg-primary text-primary-foreground p-16">
        <p className="text-xl font-bold tracking-tight">{tCommon("appName")}</p>

        <div>
          <h1 className="text-3xl font-semibold leading-snug mb-8">
            {t("heroHeadline")}
          </h1>
          <ul className="space-y-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-base">
                <span className="mt-0.5 shrink-0 opacity-80">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm opacity-70">{t("heroFooter")}</p>
      </aside>

      {/* Right form panel */}
      <main className="relative flex flex-1 flex-col items-center justify-center bg-background p-8">
        {/* Language switcher — logical end for RTL support */}
        <div className="absolute top-4 end-4">
          <LanguageSwitcher currentLocale={locale} />
        </div>

        <div className="w-full max-w-[400px]">
          {/* App name shown only on mobile (left panel hidden) */}
          <p className="mb-2 text-lg font-bold text-primary md:hidden">
            {tCommon("appName")}
          </p>

          <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 mb-8 text-sm text-muted-foreground">{description}</p>

          {children}

          <div className="mt-6">{footer}</div>
        </div>
      </main>
    </div>
  );
}

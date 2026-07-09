import { getLocale, getTranslations } from "next-intl/server";
import { LinkButton } from "@/components/common/link-button";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import type { Locale } from "@/i18n/locale";

export default async function Home() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("common");
  const tHome = await getTranslations("home");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header */}
      <header className="flex justify-between items-center px-8 py-4 border-b">
        <span className="text-xl font-bold text-primary tracking-tight">
          {t("appName")}
        </span>
        <LanguageSwitcher currentLocale={locale} />
      </header>

      {/* Hero section */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            {t("appName")}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {tHome("tagline")}
          </p>
          <div className="flex gap-4 justify-center">
            <LinkButton href="/login" variant="default" size="lg">
              {t("signIn")}
            </LinkButton>
            <LinkButton href="/register" variant="outline" size="lg">
              {t("register")}
            </LinkButton>
          </div>
        </div>
      </main>
    </div>
  );
}

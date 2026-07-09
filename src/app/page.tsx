import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  BookOpen,
  QrCode,
  CreditCard,
  Users,
  BarChart3,
  UserCheck,
  Mail,
  CheckCircle2,
  ArrowRight,
  Star,
  Zap,
  Shield,
} from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.207 11.387.6.113.793-.26.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { cn } from "@/shared/lib/utils";
import type { Locale } from "@/i18n/locale";

export default async function Home() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("common");
  const tHome = await getTranslations("home");

  const features = [
    {
      icon: QrCode,
      title: tHome("feature1Title"),
      desc: tHome("feature1Desc"),
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      icon: BookOpen,
      title: tHome("feature2Title"),
      desc: tHome("feature2Desc"),
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: CheckCircle2,
      title: tHome("feature3Title"),
      desc: tHome("feature3Desc"),
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      icon: CreditCard,
      title: tHome("feature4Title"),
      desc: tHome("feature4Desc"),
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      icon: BarChart3,
      title: tHome("feature5Title"),
      desc: tHome("feature5Desc"),
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      icon: Users,
      title: tHome("feature6Title"),
      desc: tHome("feature6Desc"),
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
  ];

  const steps = [
    {
      num: "01",
      icon: BookOpen,
      title: tHome("how1Title"),
      desc: tHome("how1Desc"),
    },
    {
      num: "02",
      icon: UserCheck,
      title: tHome("how2Title"),
      desc: tHome("how2Desc"),
    },
    {
      num: "03",
      icon: QrCode,
      title: tHome("how3Title"),
      desc: tHome("how3Desc"),
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">{t("appName")}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              {tHome("navFeatures")}
            </a>
            <a href="#how" className="hover:text-foreground transition-colors">
              {tHome("navHowItWorks")}
            </a>
            <a href="#opensource" className="hover:text-foreground transition-colors">
              {tHome("navOpenSource")}
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher currentLocale={locale} />
            <Link
              href="/login"
              className="hidden sm:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("signIn")}
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              {t("register")}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden pt-24 pb-20 px-6">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            aria-hidden="true"
          >
            <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground mb-6">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>{tHome("mitBadge")}</span>
              <span className="h-3.5 w-px bg-border" />
              <span className="text-primary font-semibold">Free forever</span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
              {tHome("heroHeadline")}
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              {tHome("heroSubheadline")}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                {tHome("heroCta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://github.com/vlancy/openclass"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border bg-background px-7 py-3.5 text-base font-semibold hover:bg-accent transition-colors"
              >
                <GithubIcon className="h-5 w-5" />
                {tHome("heroCtaSecondary")}
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span>MIT License</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Self-hostable</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-500" />
                <span>Multi-role</span>
              </div>
              <div className="flex items-center gap-1.5">
                <QrCode className="h-4 w-4 text-violet-500" />
                <span>QR Attendance</span>
              </div>
            </div>
          </div>

          {/* Feature preview strip */}
          <div className="max-w-5xl mx-auto mt-20 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Teachers", value: "✓ Dashboard" },
              { label: "Students", value: "✓ Enrollment" },
              { label: "Parents", value: "✓ Tracking" },
              { label: "Payments", value: "✓ Cash + Online" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl border bg-card p-4 text-center shadow-sm"
              >
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className="text-sm font-semibold text-primary">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="py-24 px-6 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                {tHome("featuresTitle")}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {tHome("featuresSubtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map(({ icon: Icon, title, desc, color, bg }) => (
                <div
                  key={title}
                  className="group rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <div className={cn("inline-flex rounded-lg p-3 mb-4", bg)}>
                    <Icon className={cn("h-6 w-6", color)} />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                {tHome("howTitle")}
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                {tHome("howSubtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {steps.map(({ num, icon: Icon, title, desc }, i) => (
                <div key={num} className="relative flex flex-col">
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-5 start-full w-full h-px bg-border -translate-y-px ms-4" />
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-3xl font-black text-muted-foreground/20 leading-none">
                      {num}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Open Source ── */}
        <section id="opensource" className="py-24 px-6 bg-muted/30">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-6 mx-auto">
              <GithubIcon className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {tHome("openSourceTitle")}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {tHome("openSourceDesc")}
            </p>

            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-5 py-2 text-sm font-medium mb-8">
              <Shield className="h-4 w-4 text-emerald-500" />
              <span>{tHome("mitBadge")}</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://github.com/vlancy/openclass"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                <GithubIcon className="h-4 w-4" />
                {tHome("viewGitHub")}
              </a>
              <a
                href="https://www.vlancy.com/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border bg-background px-6 py-3 text-sm font-semibold hover:bg-accent transition-colors"
              >
                <Mail className="h-4 w-4" />
                {tHome("contactUs")}
              </a>
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="relative rounded-2xl bg-primary px-8 py-16 text-center overflow-hidden">
              <div
                className="pointer-events-none absolute inset-0"
                aria-hidden="true"
              >
                <div className="absolute -top-20 -end-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-20 -start-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              </div>
              <h2 className="relative text-3xl font-bold text-primary-foreground mb-3">
                {tHome("ctaBannerTitle")}
              </h2>
              <p className="relative text-primary-foreground/75 mb-8 text-lg">
                {tHome("ctaBannerDesc")}
              </p>
              <Link
                href="/register"
                className="relative inline-flex items-center gap-2 rounded-lg bg-white text-primary px-8 py-3.5 text-base font-semibold shadow-lg hover:bg-white/90 transition-all active:scale-[0.98]"
              >
                {tHome("ctaBannerBtn")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t bg-muted/30 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
                  <BookOpen className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="font-bold">{t("appName")}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tHome("footerTagline")}
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                {tHome("footerLicense")}
              </p>
            </div>

            {/* Quick links */}
            <div>
              <p className="text-sm font-semibold mb-3">{tHome("footerLinks")}</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors">
                    {t("signIn")}
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-foreground transition-colors">
                    {t("register")}
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/vlancy/openclass"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-sm font-semibold mb-3">{tHome("footerContact")}</p>
              <a
                href="https://www.vlancy.com/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                www.vlancy.com/contact
              </a>
            </div>
          </div>

          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>
              {tHome("poweredBy")}{" "}
              <a
                href="https://www.vlancy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                Vlancy LTD
              </a>
            </p>
            <p>{tHome("footerRights")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

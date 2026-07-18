import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { RegisterServiceWorker } from "@/shared/infrastructure/pwa/register-service-worker";
import { PwaInstallBanner } from "@/shared/infrastructure/pwa/pwa-install-banner";
import type { Locale } from "@/i18n/locale";

export const metadata: Metadata = {
  title: "OpenClass",
  description: "Teacher-centered course, attendance & payment management",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <RegisterServiceWorker />
          <PwaInstallBanner />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  LayoutDashboard,
  Layers,
  Link2,
  Menu,
  QrCode,
  User,
  Users,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SignOutButton } from "@/modules/auth/presentation/sign-out-button";
import { NotificationOptInButton } from "@/modules/notifications/presentation/notification-opt-in-button";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { signOutAction } from "@/app/dashboard/actions";
import { cn } from "@/shared/lib/utils";
import type { Role } from "@/modules/auth/domain/role";
import type { Locale } from "@/i18n/locale";

type NavItem = {
  readonly labelKey: string;
  readonly href: string;
  readonly icon: React.ReactNode;
};

function getNavItems(role: Role): NavItem[] {
  const items: NavItem[] = [
    {
      labelKey: "dashboard",
      href: `/dashboard/${role.toLowerCase()}`,
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
    },
  ];

  if (role === "ADMIN") {
    items.push({
      labelKey: "levels",
      href: "/dashboard/admin/levels",
      icon: <Layers className="h-4 w-4 shrink-0" />,
    });
    items.push({
      labelKey: "parentLinks",
      href: "/dashboard/admin/parent-links",
      icon: <Link2 className="h-4 w-4 shrink-0" />,
    });
  }

  if (role === "ADMIN" || role === "TEACHER") {
    items.push({
      labelKey: "levels",
      href: "/dashboard/teacher/levels",
      icon: <Layers className="h-4 w-4 shrink-0" />,
    });
    items.push({
      labelKey: "courses",
      href: "/dashboard/teacher/courses",
      icon: <BookOpen className="h-4 w-4 shrink-0" />,
    });
  }

  if (role === "TEACHER") {
    items.push({
      labelKey: "students",
      href: "/dashboard/teacher/students",
      icon: <Users className="h-4 w-4 shrink-0" />,
    });
    items.push({
      labelKey: "profile",
      href: "/dashboard/teacher/profile",
      icon: <User className="h-4 w-4 shrink-0" />,
    });
  }

  if (role === "STUDENT") {
    items.push({
      labelKey: "courses",
      href: "/dashboard/student/courses",
      icon: <BookOpen className="h-4 w-4 shrink-0" />,
    });
    items.push({
      labelKey: "qrCodes",
      href: "/dashboard/student/qr-codes",
      icon: <QrCode className="h-4 w-4 shrink-0" />,
    });
  }

  return items;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return ((parts[0][0] ?? "") + (parts[1][0] ?? "")).toUpperCase();
  }
  return (parts[0] ?? "").slice(0, 2).toUpperCase();
}

// ── Sub-components (defined at module level to avoid reconciliation issues) ──

type NavListProps = {
  readonly navItems: NavItem[];
  readonly pathname: string;
  readonly t: (key: string) => string;
  readonly onNavigate?: () => void;
};

function NavList({ navItems, pathname, t, onNavigate }: NavListProps) {
  return (
    <nav
      className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3"
      aria-label="Main navigation"
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-100",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            )}
          >
            {item.icon}
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

type UserFooterProps = {
  readonly name: string;
  readonly email: string | null;
  readonly initials: string;
};

function UserFooter({ name, email, initials }: UserFooterProps) {
  const label = email ?? name;
  return (
    <div className="flex shrink-0 items-center gap-3 p-4">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback className="bg-sidebar-accent text-[11px] font-semibold text-sidebar-accent-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      <p
        className="min-w-0 flex-1 truncate text-xs text-sidebar-foreground/50"
        title={label}
      >
        {label}
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type DashboardChromeProps = {
  readonly role: Role;
  readonly name: string;
  readonly email: string | null;
  readonly locale: Locale;
  readonly children: React.ReactNode;
};

export function DashboardChrome({ role, name, email, locale, children }: DashboardChromeProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const navItems = getNavItems(role);
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const initials = getInitials(name);

  const logoMark = (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
      <BookOpen className="h-3.5 w-3.5 text-sidebar-primary-foreground" />
    </div>
  );

  return (
    <TooltipProvider>
      <div className="flex min-h-full">
        {/* ── Desktop sidebar ──────────────────────────────────────────── */}
        <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-sidebar-border bg-sidebar md:flex">
          {/* Logo */}
          <div className="flex h-14 shrink-0 items-center gap-2.5 px-5">
            {logoMark}
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              {tCommon("appName")}
            </span>
          </div>

          <Separator className="bg-sidebar-border" />

          <NavList navItems={navItems} pathname={pathname} t={t} />

          <Separator className="bg-sidebar-border" />

          <UserFooter name={name} email={email} initials={initials} />
        </aside>

        {/* ── Mobile overlay drawer ────────────────────────────────────── */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Panel */}
            <aside className="absolute inset-y-0 start-0 flex w-64 flex-col border-e border-sidebar-border bg-sidebar shadow-2xl">
              {/* Logo row + close */}
              <div className="flex h-14 shrink-0 items-center justify-between px-5">
                <div className="flex items-center gap-2.5">
                  {logoMark}
                  <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
                    {tCommon("appName")}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  className="h-8 w-8 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close menu</span>
                </Button>
              </div>

              <Separator className="bg-sidebar-border" />

              <NavList
                navItems={navItems}
                pathname={pathname}
                t={t}
                onNavigate={() => setMobileOpen(false)}
              />

              <Separator className="bg-sidebar-border" />

              <UserFooter name={name} email={email} initials={initials} />
            </aside>
          </div>
        )}

        {/* ── Content column ───────────────────────────────────────────── */}
        <div className="flex min-h-full flex-1 flex-col md:ps-64">
          {/* Header */}
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 shadow-sm">
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>

            <div className="flex-1" />

            {/* Right-side actions */}
            <div className="flex items-center gap-1.5">
              <span className="mr-1 hidden text-sm text-muted-foreground sm:block">
                {email ?? name}
              </span>
              <LanguageSwitcher currentLocale={locale} />
              <NotificationOptInButton />
              <SignOutButton action={signOutAction} label={tCommon("signOut")} />
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setLocaleAction } from "@/i18n/actions";
import type { Locale } from "@/i18n/locale";

type LanguageSwitcherProps = { readonly currentLocale: Locale; };

const LOCALES: { value: Locale; label: string; ariaLabel: string }[] = [
  { value: "en", label: "EN", ariaLabel: "English" },
  { value: "ar", label: "AR", ariaLabel: "Arabic" },
];

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSelect(next: Locale) {
    if (next === currentLocale) return;
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  return (
    <div className="flex" role="group" aria-label="language">
      {LOCALES.map(({ value, label, ariaLabel }, index) => (
        <Button
          key={value}
          variant={value === currentLocale ? "default" : "outline"}
          size="sm"
          disabled={pending}
          aria-label={ariaLabel}
          aria-pressed={value === currentLocale}
          onClick={() => handleSelect(value)}
          className={
            index === 0
              ? "rounded-e-none border-e-0"
              : "rounded-s-none"
          }
        >
          {label}
        </Button>
      ))}
    </div>
  );
}

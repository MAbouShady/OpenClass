"use client";

import NextLink from "next/link";
import { cn } from "@/shared/lib/utils";

type LinkTextProps = {
  readonly href: string;
  readonly children?: React.ReactNode;
  readonly className?: string;
} & Omit<React.ComponentPropsWithoutRef<typeof NextLink>, "href">;

export function LinkText({ href, children, className, ...rest }: LinkTextProps) {
  return (
    <NextLink
      className={cn(
        "text-primary underline underline-offset-4 hover:text-primary/80 font-medium",
        className
      )}
      href={href}
      {...rest}
    >
      {children}
    </NextLink>
  );
}

"use client";

import Link from "next/link";
import { Button, type buttonVariants } from "@/components/ui/button";
import { type VariantProps } from "class-variance-authority";

type LinkButtonProps = VariantProps<typeof buttonVariants> & {
  readonly href: string;
  readonly children?: React.ReactNode;
  readonly className?: string;
};

export function LinkButton({
  href,
  children,
  className,
  variant = "default",
  size,
}: LinkButtonProps) {
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}

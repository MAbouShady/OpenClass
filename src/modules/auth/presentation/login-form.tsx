"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/shared/domain/action-state";

type LoginFormProps = {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
};

export function LoginForm({ action }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const t = useTranslations("common");
  const tAuth = useTranslations("auth");

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? tAuth("signingIn") : t("signIn")}
      </Button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/shared/domain/action-state";

type RegisterFormProps = {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
};

export function RegisterForm({ action }: RegisterFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const t = useTranslations("common");
  const tAuth = useTranslations("auth");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="role" value="TEACHER" />
      <div className="space-y-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" name="name" type="text" required autoComplete="name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? tAuth("creatingAccount") : tAuth("createAccountButton")}
      </Button>
    </form>
  );
}

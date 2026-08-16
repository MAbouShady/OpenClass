"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/shared/domain/action-state";

type AddSecretaryFormProps = {
  readonly action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
};

export function AddSecretaryForm({ action }: AddSecretaryFormProps) {
  const t = useTranslations("secretaries");
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="sec-name">{t("nameLabel")}</Label>
          <Input id="sec-name" name="name" required minLength={2} maxLength={120} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sec-email">{t("emailLabel")}</Label>
          <Input id="sec-email" name="email" type="email" required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sec-password">{t("passwordLabel")}</Label>
        <Input id="sec-password" name="password" type="password" required minLength={8} />
      </div>
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.message && (
        <Alert>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? t("creating") : t("createBtn")}
      </Button>
    </form>
  );
}

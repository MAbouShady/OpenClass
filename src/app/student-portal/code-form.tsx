"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/shared/domain/action-state";

type CodeFormProps = {
  readonly action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
};

export function CodeForm({ action }: CodeFormProps) {
  const t = useTranslations("studentPortal");
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="code" className="text-base font-semibold">
          {t("codeLabel")}
        </Label>
        <p className="text-sm text-muted-foreground">{t("codeHint")}</p>
      </div>

      <div className="flex gap-3">
        <Input
          id="code"
          name="code"
          type="number"
          inputMode="numeric"
          min={1}
          required
          autoFocus
          placeholder={t("codePlaceholder")}
          className="h-11 max-w-[220px] text-base"
        />
        <Button type="submit" size="lg" className="gap-2 px-6" disabled={pending}>
          <Search className="h-4 w-4" />
          {pending ? t("checking") : t("enterBtn")}
        </Button>
      </div>

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}

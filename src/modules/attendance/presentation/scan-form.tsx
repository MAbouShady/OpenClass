"use client";

import { useActionState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrScannerButton } from "@/modules/attendance/presentation/qr-scanner-button";
import type { ActionState } from "@/shared/domain/action-state";

type ScanFormProps = {
  readonly label: string;
  readonly action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
};

export function ScanForm({ label, action }: ScanFormProps) {
  const t = useTranslations("attendance");
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleScan(value: string) {
    if (!inputRef.current || !formRef.current) return;
    inputRef.current.value = value;
    formRef.current.requestSubmit();
  }

  return (
    <form ref={formRef} action={formAction}>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          name="qrToken"
          placeholder={t("pasteScanPlaceholder")}
          required
        />
        <QrScannerButton onScan={handleScan} label={label} />
        <Button type="submit" disabled={pending}>
          {pending ? t("working") : label}
        </Button>
      </div>
      {state.error ? (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}

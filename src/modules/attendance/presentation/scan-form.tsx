"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/shared/domain/action-state";

type ScanFormProps = {
  readonly label: string;
  readonly action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
};

export function ScanForm({ label, action }: ScanFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction}>
      <div className="flex gap-2">
        <Input
          name="qrToken"
          placeholder="Paste the student's scanned QR code content"
          required
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Working…" : label}
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

"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/shared/domain/action-state";

type SubmitPaymentFormProps = {
  readonly action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
};

export function SubmitPaymentForm({ action }: SubmitPaymentFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="mt-1 flex flex-row items-start gap-2">
      <Input name="proofUrl" placeholder="Payment proof URL" required className="h-8" />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Submitting…" : "Submit payment"}
      </Button>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}

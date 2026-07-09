"use client";

import { useActionState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/shared/domain/action-state";

type EnrollButtonProps = {
  readonly semesterId: string;
  readonly enrolled: boolean;
  readonly action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
};

export function EnrollButton({ semesterId, enrolled, action }: EnrollButtonProps) {
  const [state, formAction, pending] = useActionState(action, {});

  if (enrolled) {
    return <Badge variant="success">Enrolled</Badge>;
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="semesterId" value={semesterId} />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Enrolling…" : "Enroll"}
      </Button>
      {state.error ? (
        <p className="mt-1 text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}

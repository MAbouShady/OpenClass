"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/shared/domain/action-state";

type ParentLinkFormProps = {
  readonly action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
};

export function ParentLinkForm({ action }: ParentLinkFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="parentEmail">Parent email</Label>
        <Input id="parentEmail" name="parentEmail" type="email" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="studentEmail">Student email</Label>
        <Input id="studentEmail" name="studentEmail" type="email" required />
      </div>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Linking…" : "Link parent to student"}
      </Button>
    </form>
  );
}

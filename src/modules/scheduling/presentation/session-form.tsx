"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/shared/domain/action-state";

type SessionFormProps = {
  readonly action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly courseId: string;
};

export function SessionForm({ action, courseId }: SessionFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="courseId" value={courseId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="startTime">Start time</Label>
        <Input id="startTime" name="startTime" type="datetime-local" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="endTime">End time</Label>
        <Input id="endTime" name="endTime" type="datetime-local" required />
      </div>

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Scheduling…" : "Add session"}
      </Button>
    </form>
  );
}

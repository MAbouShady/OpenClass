"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/shared/domain/action-state";

type SemesterFormProps = {
  readonly action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly courseId: string;
};

export function SemesterForm({ action, courseId }: SemesterFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="courseId" value={courseId} />

      <div className="grid gap-1.5">
        <Label htmlFor="startDate">Start date</Label>
        <Input
          id="startDate"
          name="startDate"
          type="date"
          required
          className="[color-scheme:light] dark:[color-scheme:dark]"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="endDate">End date</Label>
        <Input
          id="endDate"
          name="endDate"
          type="date"
          required
          className="[color-scheme:light] dark:[color-scheme:dark]"
        />
      </div>

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Creating…" : "Add semester"}
      </Button>
    </form>
  );
}

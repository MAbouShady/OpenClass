"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/shared/domain/action-state";

type LevelFormDefaults = {
  readonly id?: string;
  readonly name?: string;
  readonly order?: number;
  readonly description?: string | null;
};

type LevelFormProps = {
  readonly action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly defaultValues?: LevelFormDefaults;
  readonly submitLabel: string;
};

export function LevelForm({ action, defaultValues, submitLabel }: LevelFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {defaultValues?.id ? <input type="hidden" name="id" value={defaultValues.id} /> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="order">Order</Label>
        <Input id="order" name="order" type="number" defaultValue={defaultValues?.order} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Input id="description" name="description" defaultValue={defaultValues?.description ?? ""} />
      </div>

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

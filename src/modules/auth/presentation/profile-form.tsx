"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/shared/domain/action-state";

type ProfileFormDefaults = {
  readonly name: string;
  readonly bio: string | null;
};

type ProfileFormProps = {
  readonly action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly defaultValues: ProfileFormDefaults;
};

export function ProfileForm({ action, defaultValues }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={defaultValues.name} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio">Bio (optional)</Label>
        <Textarea id="bio" name="bio" defaultValue={defaultValues.bio ?? ""} rows={3} />
      </div>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

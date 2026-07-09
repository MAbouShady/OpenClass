"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SESSION_TYPES } from "@/modules/courses/domain/session-type";
import type { Level } from "@/modules/levels/domain/level";
import type { ActionState } from "@/shared/domain/action-state";

type CourseFormDefaults = {
  readonly id?: string;
  readonly title?: string;
  readonly description?: string | null;
  readonly sessionType?: string;
  readonly levelId?: string;
};

type CourseFormProps = {
  readonly action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly levels: readonly Level[];
  readonly defaultValues?: CourseFormDefaults;
  readonly submitLabel: string;
};

export function CourseForm({ action, levels, defaultValues, submitLabel }: CourseFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [sessionType, setSessionType] = useState(defaultValues?.sessionType ?? "ONLINE");
  const [levelId, setLevelId] = useState(defaultValues?.levelId ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {defaultValues?.id ? <input type="hidden" name="id" value={defaultValues.id} /> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={defaultValues?.title}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          name="description"
          defaultValue={defaultValues?.description ?? ""}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sessionType">Session type</Label>
        <input type="hidden" name="sessionType" value={sessionType} />
        <Select value={sessionType} onValueChange={setSessionType}>
          <SelectTrigger id="sessionType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SESSION_TYPES.map((st) => (
              <SelectItem key={st} value={st}>
                {st.charAt(0) + st.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="levelId">Level</Label>
        <input type="hidden" name="levelId" value={levelId} />
        <Select value={levelId} onValueChange={setLevelId}>
          <SelectTrigger id="levelId">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {levels.map((level) => (
              <SelectItem key={level.id} value={level.id}>
                {level.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

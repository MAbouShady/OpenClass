"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LevelForm } from "@/modules/levels/presentation/level-form";
import type { Level } from "@/modules/levels/domain/level";
import type { ActionState } from "@/shared/domain/action-state";
import { cn } from "@/shared/lib/utils";

type LevelRowProps = {
  readonly level: Level;
  readonly updateAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly deleteAction: (id: string) => Promise<void>;
};

export function LevelRow({ level, updateAction, deleteAction }: LevelRowProps) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className={cn("border-b py-3")}>
        <LevelForm action={updateAction} defaultValues={level} submitLabel="Save changes" />
        <Button size="sm" variant="outline" className="mt-2" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b py-3">
      <div>
        <p className="text-sm font-medium">
          {level.name}{" "}
          <span className="text-muted-foreground font-normal">(order {level.order})</span>
        </p>
        {level.description ? (
          <p className="text-sm text-muted-foreground">{level.description}</p>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <form action={deleteAction.bind(null, level.id)}>
          <Button type="submit" size="sm" variant="destructive">
            Delete
          </Button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { LevelForm } from "@/modules/levels/presentation/level-form";
import { AddLevelModal } from "@/modules/levels/presentation/add-level-modal";
import { cn } from "@/shared/lib/utils";
import type { Level } from "@/modules/levels/domain/level";
import type { ActionState } from "@/shared/domain/action-state";

export type LevelNode = Level & { readonly children: readonly Level[] };

type SubLevelRowProps = {
  readonly level: Level;
  readonly updateAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly deleteAction: (id: string) => Promise<void>;
};

function SubLevelRow({ level, updateAction, deleteAction }: SubLevelRowProps) {
  const [editing, setEditing] = useState(false);
  const t = useTranslations("levels");

  if (editing) {
    return (
      <div className="ms-8 border-s-2 border-primary/20 ps-4 py-3">
        <LevelForm action={updateAction} defaultValues={level} submitLabel={t("saveLabel")} />
        <Button size="sm" variant="outline" className="mt-2" onClick={() => setEditing(false)}>
          {t("cancelLabel")}
        </Button>
      </div>
    );
  }

  return (
    <div className="ms-8 flex items-center justify-between gap-4 border-s-2 border-primary/20 ps-4 py-2.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
          {level.order}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{level.name}</p>
          {level.description && (
            <p className="text-xs text-muted-foreground truncate">{level.description}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          {t("editLabel")}
        </Button>
        <ConfirmDeleteDialog
          title={t("deleteConfirmTitle")}
          description={t("deleteConfirmDesc")}
          onConfirm={() => deleteAction(level.id)}
          confirmLabel={t("deleteLabel")}
        >
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
          >
            {t("deleteLabel")}
          </Button>
        </ConfirmDeleteDialog>
      </div>
    </div>
  );
}

type LevelRowProps = {
  readonly level: LevelNode;
  readonly updateAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly deleteAction: (id: string) => Promise<void>;
  readonly createAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
};

export function LevelRow({ level, updateAction, deleteAction, createAction }: LevelRowProps) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const t = useTranslations("levels");
  const isGroup = level.children.length > 0;

  if (editing) {
    return (
      <div className="rounded-xl border p-4">
        <LevelForm action={updateAction} defaultValues={level} submitLabel={t("saveLabel")} />
        <Button size="sm" variant="outline" className="mt-2" onClick={() => setEditing(false)}>
          {t("cancelLabel")}
        </Button>
      </div>
    );
  }

  const sortedChildren = [...level.children].sort((a, b) => a.order - b.order);

  return (
    <div className={cn("rounded-xl border", isGroup && "bg-muted/30")}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3 min-w-0">
          {isGroup ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
              {level.order}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold truncate">{level.name}</p>
              {isGroup && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {t("groupBadge")}
                </Badge>
              )}
            </div>
            {level.description && (
              <p className="text-xs text-muted-foreground truncate">{level.description}</p>
            )}
            {isGroup && (
              <p className="text-xs text-muted-foreground">
                {sortedChildren.length} {t("subLevels")}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {isGroup && (
            <AddLevelModal
              createAction={createAction}
              parentId={level.id}
              parentName={level.name}
            />
          )}
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            {t("editLabel")}
          </Button>
          <ConfirmDeleteDialog
            title={t("deleteConfirmTitle")}
            description={isGroup ? t("deleteGroupConfirmDesc") : t("deleteConfirmDesc")}
            onConfirm={() => deleteAction(level.id)}
            confirmLabel={t("deleteLabel")}
          >
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
            >
              {t("deleteLabel")}
            </Button>
          </ConfirmDeleteDialog>
        </div>
      </div>

      {/* Sub-levels */}
      {isGroup && expanded && (
        <div className="pb-3 space-y-0">
          {sortedChildren.length === 0 ? (
            <p className="ms-8 ps-4 text-xs text-muted-foreground py-2">
              {t("noSubLevels")}
            </p>
          ) : (
            sortedChildren.map((child) => (
              <SubLevelRow
                key={child.id}
                level={child}
                updateAction={updateAction}
                deleteAction={deleteAction}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

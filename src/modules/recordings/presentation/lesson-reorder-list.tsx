"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { GripVertical, Loader2, Pencil, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProcessingStatusBadge } from "@/modules/recordings/presentation/processing-status-badge";
import {
  RecordedVideoForm,
  type CourseOption,
} from "@/modules/recordings/presentation/recorded-video-form";
import type { ActionState } from "@/shared/domain/action-state";
import {
  formatDuration,
  type RecordedVideoItem,
} from "@/modules/recordings/presentation/recorded-video-item";

type LessonReorderListProps = {
  readonly courseId: string;
  readonly videos: readonly RecordedVideoItem[];
  readonly courses: readonly CourseOption[];
  readonly reorderAction: (courseId: string, orderedIds: string[]) => Promise<{ error?: string }>;
  readonly updateAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly deleteAction: (id: string) => Promise<void>;
};

/**
 * Drag-and-drop ordering. The new order is sent to the server and persisted as
 * `position`; the list re-renders from whatever the server returns, so the
 * database — not this component — remains the source of truth for lesson order.
 */
export function LessonReorderList({
  courseId,
  videos,
  courses,
  reorderAction,
  updateAction,
  deleteAction,
}: LessonReorderListProps) {
  const t = useTranslations("recordings");
  const [items, setItems] = useState<readonly RecordedVideoItem[]>(videos);
  const [syncedFrom, setSyncedFrom] = useState(videos);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [editing, setEditing] = useState<RecordedVideoItem | null>(null);
  const [deleting, setDeleting] = useState<RecordedVideoItem | null>(null);
  const [pending, startTransition] = useTransition();

  // Re-sync during render when the server sends a new order (after a save or a
  // revalidation) instead of chasing it from an effect.
  if (syncedFrom !== videos) {
    setSyncedFrom(videos);
    setItems(videos);
    setDirty(false);
  }

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    setItems(next);
    setDirty(true);
  }

  function save() {
    setError(undefined);
    startTransition(async () => {
      const result = await reorderAction(
        courseId,
        items.map((item) => item.id),
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setDirty(false);
    });
  }

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{t("noVideos")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {items.map((video, index) => (
          <li
            key={video.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragEnd={() => setDragIndex(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (dragIndex !== null) move(dragIndex, index);
              setDragIndex(null);
            }}
            className={`flex items-center gap-3 rounded-lg border bg-card p-3 ${
              dragIndex === index ? "opacity-50" : ""
            }`}
          >
            <GripVertical
              className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground"
              aria-hidden="true"
            />
            <span className="w-6 shrink-0 text-sm tabular-nums text-muted-foreground">
              {index + 1}.
            </span>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{video.title}</div>
              <div className="text-xs text-muted-foreground">
                {formatDuration(video.durationSeconds)}
              </div>
            </div>

            <Badge variant={video.status === "PUBLISHED" ? "success" : "outline"}>
              {video.status === "PUBLISHED" ? t("statusPublished") : t("statusDraft")}
            </Badge>
            <ProcessingStatusBadge status={video.processingStatus} />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              aria-label={t("editLabel")}
              onClick={() => setEditing(video)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label={t("deleteLabel")}
              onClick={() => setDeleting(video)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>

            {/* Keyboard-accessible equivalent of dragging. */}
            <div className="flex shrink-0 flex-col">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                aria-label={t("moveUp")}
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
              >
                ↑
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                aria-label={t("moveDown")}
                disabled={index === items.length - 1}
                onClick={() => move(index, index + 1)}
              >
                ↓
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {dirty ? (
        <Button onClick={save} disabled={pending} className="gap-2 self-start">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("saveOrder")}
        </Button>
      ) : null}

      <Dialog open={editing !== null} onOpenChange={(next) => !next && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("editModalTitle")}</DialogTitle>
          </DialogHeader>
          {editing ? (
            <RecordedVideoForm
              action={updateAction}
              courses={courses}
              submitLabel={t("saveLabel")}
              onSuccess={() => setEditing(null)}
              defaultValues={{
                id: editing.id,
                courseId: editing.courseId,
                title: editing.title,
                description: editing.description,
                status: editing.status,
                videoAssetId: editing.videoAssetId,
                originalFilename: editing.originalFilename,
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(next) => !next && setDeleting(null)}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDesc")}
        confirmLabel={t("deleteLabel")}
        onConfirm={() => {
          const target = deleting;
          setDeleting(null);
          if (target) startTransition(() => void deleteAction(target.id));
        }}
      />
    </div>
  );
}

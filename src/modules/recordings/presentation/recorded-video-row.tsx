"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertTriangle, Eye, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TableCell, TableRow } from "@/components/ui/table";
import { ProcessingStatusBadge } from "@/modules/recordings/presentation/processing-status-badge";
import {
  RecordedVideoForm,
  type CourseOption,
} from "@/modules/recordings/presentation/recorded-video-form";
import {
  formatDuration,
  type RecordedVideoItem,
} from "@/modules/recordings/presentation/recorded-video-item";
import type { ActionState } from "@/shared/domain/action-state";

export type RecordedVideoRowActions = {
  readonly updateAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly deleteAction: (id: string) => Promise<void>;
  readonly toggleStatusAction: (id: string, status: "DRAFT" | "PUBLISHED") => Promise<void>;
  readonly retryProcessingAction: (id: string) => Promise<void>;
};

type RecordedVideoRowProps = RecordedVideoRowActions & {
  readonly video: RecordedVideoItem;
  readonly courses: readonly CourseOption[];
};

export function RecordedVideoRow({
  video,
  courses,
  updateAction,
  deleteAction,
  toggleStatusAction,
  retryProcessingAction,
}: RecordedVideoRowProps) {
  const t = useTranslations("recordings");
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const published = video.status === "PUBLISHED";

  return (
    <>
      <TableRow>
        <TableCell className="max-w-[16rem]">
          <div className="truncate font-medium">{video.title}</div>
          <div className="truncate text-xs text-muted-foreground">
            {formatDuration(video.durationSeconds)}
          </div>
        </TableCell>

        <TableCell className="max-w-[12rem] truncate text-muted-foreground">
          {video.courseTitle}
        </TableCell>

        <TableCell className="tabular-nums">{video.position}</TableCell>

        <TableCell>
          <Badge variant={published ? "success" : "outline"}>
            {published ? t("statusPublished") : t("statusDraft")}
          </Badge>
        </TableCell>

        <TableCell>
          <div className="flex flex-col items-start gap-1">
            <ProcessingStatusBadge status={video.processingStatus} />
            {video.processingStatus === "FAILED" && video.processingError ? (
              <span
                className="flex max-w-[14rem] items-center gap-1 truncate text-xs text-destructive"
                title={video.processingError}
              >
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {video.processingError}
              </span>
            ) : null}
          </div>
        </TableCell>

        <TableCell>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link href={`/dashboard/teacher/courses/${video.courseId}/recordings`}>
                <Eye className="h-3.5 w-3.5" />
                {t("viewLabel")}
              </Link>
            </Button>

            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              {t("editLabel")}
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await toggleStatusAction(video.id, published ? "DRAFT" : "PUBLISHED");
                })
              }
            >
              {published ? t("unpublishLabel") : t("publishLabel")}
            </Button>

            {video.processingStatus === "FAILED" || video.processingStatus === "PROCESSING" ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await retryProcessingAction(video.id);
                  })
                }
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t("retryLabel")}
              </Button>
            ) : null}

            <ConfirmDeleteDialog
              title={t("deleteConfirmTitle")}
              description={t("deleteConfirmDesc")}
              confirmLabel={t("deleteLabel")}
              onConfirm={() => deleteAction(video.id)}
            >
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {t("deleteLabel")}
              </Button>
            </ConfirmDeleteDialog>
          </div>
        </TableCell>
      </TableRow>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("editModalTitle")}</DialogTitle>
          </DialogHeader>
          {editing ? (
            <RecordedVideoForm
              action={updateAction}
              courses={courses}
              submitLabel={t("saveLabel")}
              onSuccess={() => setEditing(false)}
              defaultValues={{
                id: video.id,
                courseId: video.courseId,
                title: video.title,
                description: video.description,
                status: video.status,
                videoAssetId: video.videoAssetId,
                originalFilename: video.originalFilename,
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

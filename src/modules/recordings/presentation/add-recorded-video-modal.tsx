"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  RecordedVideoForm,
  type CourseOption,
} from "@/modules/recordings/presentation/recorded-video-form";
import type { ActionState } from "@/shared/domain/action-state";

type AddRecordedVideoModalProps = {
  readonly createAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly courses: readonly CourseOption[];
  readonly lockedCourseId?: string;
};

export function AddRecordedVideoModal({
  createAction,
  courses,
  lockedCourseId,
}: AddRecordedVideoModalProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("recordings");

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2" disabled={courses.length === 0}>
        <Plus className="h-4 w-4" />
        {t("addVideo")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("addModalTitle")}</DialogTitle>
          </DialogHeader>
          {open ? (
            <RecordedVideoForm
              action={createAction}
              courses={courses}
              lockedCourseId={lockedCourseId}
              submitLabel={t("addVideo")}
              onSuccess={() => setOpen(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

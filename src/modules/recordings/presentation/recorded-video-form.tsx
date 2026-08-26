"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VideoUploadField } from "@/modules/recordings/presentation/video-upload-field";
import { RECORDED_VIDEO_STATUSES } from "@/modules/recordings/domain/recorded-video";
import type { ActionState } from "@/shared/domain/action-state";

export type CourseOption = {
  readonly id: string;
  readonly title: string;
};

export type RecordedVideoFormDefaults = {
  readonly id?: string;
  readonly courseId?: string;
  readonly title?: string;
  readonly description?: string | null;
  readonly status?: string;
  readonly videoAssetId?: string | null;
  readonly originalFilename?: string | null;
};

type RecordedVideoFormProps = {
  readonly action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly courses: readonly CourseOption[];
  readonly defaultValues?: RecordedVideoFormDefaults;
  readonly submitLabel: string;
  readonly onSuccess?: () => void;
  /** Locks the course picker when the form is opened from inside one course. */
  readonly lockedCourseId?: string;
};

export function RecordedVideoForm({
  action,
  courses,
  defaultValues,
  submitLabel,
  onSuccess,
  lockedCourseId,
}: RecordedVideoFormProps) {
  const t = useTranslations("recordings");
  const [state, formAction, pending] = useActionState(action, {});
  const [courseId, setCourseId] = useState(
    lockedCourseId ?? defaultValues?.courseId ?? courses[0]?.id ?? "",
  );
  const [status, setStatus] = useState(defaultValues?.status ?? "DRAFT");
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) onSuccess?.();
    wasPending.current = pending;
  }, [pending, state.error, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {defaultValues?.id ? <input type="hidden" name="id" value={defaultValues.id} /> : null}
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="status" value={status} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="recording-title">{t("titleLabel")}</Label>
        <Input
          id="recording-title"
          name="title"
          defaultValue={defaultValues?.title}
          required
          maxLength={160}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="recording-description">{t("descriptionLabel")}</Label>
        <Textarea
          id="recording-description"
          name="description"
          defaultValue={defaultValues?.description ?? ""}
          rows={3}
          maxLength={2000}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>{t("courseLabel")}</Label>
          <Select value={courseId} onValueChange={setCourseId} disabled={Boolean(lockedCourseId)}>
            <SelectTrigger>
              <SelectValue placeholder={t("selectCourse")} />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t("statusLabel")}</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECORDED_VIDEO_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(value === "PUBLISHED" ? "statusPublished" : "statusDraft")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <VideoUploadField
        name="videoAssetId"
        initialAssetId={defaultValues?.videoAssetId ?? null}
        initialFilename={defaultValues?.originalFilename ?? null}
      />

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={pending || !courseId} className="self-start">
        {pending ? t("saving") : submitLabel}
      </Button>
    </form>
  );
}

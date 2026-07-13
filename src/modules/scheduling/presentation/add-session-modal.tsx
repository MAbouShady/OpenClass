"use client";

import { useState, useTransition, useRef } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ActionState } from "@/shared/domain/action-state";

type SerializedSemester = {
  readonly id: string;
  readonly startDate: string;
  readonly endDate: string;
};

type AddSessionModalProps = {
  readonly createAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly courseId: string;
  readonly semesters: readonly SerializedSemester[];
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toDatetimeLocal(iso: string) {
  // "YYYY-MM-DDTHH:MM" — trim to match datetime-local format
  return iso.slice(0, 16);
}

export function AddSessionModal({ createAction, courseId, semesters }: AddSessionModalProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>(
    semesters[0]?.id ?? "",
  );
  const formRef = useRef<HTMLFormElement>(null);
  const t = useTranslations("sessions");
  const tCommon = useTranslations("common");

  const selectedSemester = semesters.find((s) => s.id === selectedSemesterId);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setError(undefined);
  }

  function handleAction(formData: FormData) {
    formData.set("semesterId", selectedSemesterId);
    setError(undefined);
    startTransition(async () => {
      const result = await createAction({}, formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2" disabled={semesters.length === 0}>
        <Plus className="h-4 w-4" />
        {t("addSession")}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("addModalTitle")}</DialogTitle>
          </DialogHeader>

          <form ref={formRef} action={handleAction} className="flex flex-col gap-4 pt-1">
            <input type="hidden" name="courseId" value={courseId} />

            {/* Semester selector */}
            {semesters.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <Label>{t("semesterLabel")}</Label>
                <Select value={selectedSemesterId} onValueChange={setSelectedSemesterId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectSemester")} />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {fmtDate(s.startDate)} — {fmtDate(s.endDate)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-sm text-destructive">
                No semesters yet — create a semester first.
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="modal-start-time">{t("startTimeLabel")}</Label>
              <Input
                id="modal-start-time"
                name="startTime"
                type="datetime-local"
                min={selectedSemester ? toDatetimeLocal(selectedSemester.startDate) : undefined}
                max={selectedSemester ? toDatetimeLocal(selectedSemester.endDate) : undefined}
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="modal-end-time">{t("endTimeLabel")}</Label>
              <Input
                id="modal-end-time"
                name="endTime"
                type="datetime-local"
                min={selectedSemester ? toDatetimeLocal(selectedSemester.startDate) : undefined}
                max={selectedSemester ? toDatetimeLocal(selectedSemester.endDate) : undefined}
                required
              />
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => handleOpenChange(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isPending || semesters.length === 0}>
                {isPending ? t("scheduling") : t("addSession")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ActionState } from "@/shared/domain/action-state";

type AddSemesterModalProps = {
  readonly createAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly courseId: string;
};

export function AddSemesterModal({ createAction, courseId }: AddSemesterModalProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const t = useTranslations("semesters");
  const tCommon = useTranslations("common");

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setError(undefined);
  }

  function handleAction(formData: FormData) {
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
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        {t("addSemester")}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("addModalTitle")}</DialogTitle>
          </DialogHeader>

          <form ref={formRef} action={handleAction} className="flex flex-col gap-4 pt-1">
            <input type="hidden" name="courseId" value={courseId} />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="modal-start-date">{t("startDateLabel")}</Label>
              <Input
                id="modal-start-date"
                name="startDate"
                type="date"
                required
                autoFocus
                className="[color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="modal-end-date">{t("endDateLabel")}</Label>
              <Input
                id="modal-end-date"
                name="endDate"
                type="date"
                required
                className="[color-scheme:light] dark:[color-scheme:dark]"
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
              <Button type="submit" disabled={isPending}>
                {isPending ? t("creating") : t("addSemester")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

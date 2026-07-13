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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SESSION_TYPES } from "@/modules/courses/domain/session-type";
import { PAYMENT_FREQUENCIES, PAYMENT_FREQUENCY_LABELS } from "@/modules/courses/domain/payment-frequency";
import type { Level } from "@/modules/levels/domain/level";
import type { ActionState } from "@/shared/domain/action-state";

type AddCourseModalProps = {
  readonly createAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly levels: readonly Level[];
};

export function AddCourseModal({ createAction, levels }: AddCourseModalProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const [sessionType, setSessionType] = useState("ONLINE");
  const [paymentFrequency, setPaymentFrequency] = useState("MONTHLY");
  const [levelId, setLevelId] = useState(levels[0]?.id ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  const t = useTranslations("courses");
  const tCommon = useTranslations("common");

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(undefined);
      setSessionType("ONLINE");
      setPaymentFrequency("MONTHLY");
      setLevelId(levels[0]?.id ?? "");
    }
  }

  function handleAction(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      const result = await createAction({}, formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        setSessionType("ONLINE");
        setPaymentFrequency("MONTHLY");
        setLevelId(levels[0]?.id ?? "");
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2" disabled={levels.length === 0}>
        <Plus className="h-4 w-4" />
        {t("addCourse")}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("addModalTitle")}</DialogTitle>
          </DialogHeader>

          <form ref={formRef} action={handleAction} className="flex flex-col gap-4 pt-1">
            <input type="hidden" name="sessionType" value={sessionType} />
            <input type="hidden" name="paymentFrequency" value={paymentFrequency} />
            <input type="hidden" name="levelId" value={levelId} />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="modal-course-title">{t("titleLabel")}</Label>
              <Input id="modal-course-title" name="title" required autoFocus />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="modal-course-desc">{t("descriptionLabel")}</Label>
              <Input id="modal-course-desc" name="description" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>{t("sessionTypeLabel")}</Label>
                <Select value={sessionType} onValueChange={setSessionType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SESSION_TYPES.map((st) => (
                      <SelectItem key={st} value={st}>{st.charAt(0) + st.slice(1).toLowerCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("paymentFrequencyLabel")}</Label>
                <Select value={paymentFrequency} onValueChange={setPaymentFrequency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_FREQUENCIES.map((f) => (
                      <SelectItem key={f} value={f}>{PAYMENT_FREQUENCY_LABELS[f]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t("levelLabel")}</Label>
              <Select value={levelId} onValueChange={setLevelId}>
                <SelectTrigger>
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
                {isPending ? t("saving") : t("addCourse")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

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

type AddLevelModalProps = {
  readonly createAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly parentId?: string;
  readonly parentName?: string;
};

export function AddLevelModal({ createAction, parentId, parentName }: AddLevelModalProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const t = useTranslations("levels");

  const isSubLevel = Boolean(parentId);

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
      {isSubLevel ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
          className="gap-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("addSubLevel")}
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("addLevel")}
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {isSubLevel
                ? `${t("addSubLevelModalTitle")} "${parentName}"`
                : t("addModalTitle")}
            </DialogTitle>
          </DialogHeader>

          <form ref={formRef} action={handleAction} className="flex flex-col gap-4 pt-1">
            {parentId && (
              <input type="hidden" name="parentLevelId" value={parentId} />
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="modal-level-name">{t("nameLabel")}</Label>
              <Input id="modal-level-name" name="name" required autoFocus />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="modal-level-order">{t("orderNumLabel")}</Label>
              <Input id="modal-level-order" name="order" type="number" min={1} required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="modal-level-description">{t("descriptionLabel")}</Label>
              <Input id="modal-level-description" name="description" />
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
                {t("cancelLabel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t("saving") : isSubLevel ? t("addSubLevel") : t("addLevel")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

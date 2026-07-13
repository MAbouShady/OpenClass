"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
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
import type { Level } from "@/modules/levels/domain/level";
import type { ParentOption } from "@/modules/students/domain/student-repository";
import type { StudentWithCourses } from "@/modules/students/domain/student";
import type { ActionState } from "@/shared/domain/action-state";

type EditStudentModalProps = {
  readonly student: StudentWithCourses;
  readonly levels: readonly Level[];
  readonly parents: readonly ParentOption[];
  readonly updateAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
};

export function EditStudentModal({ student, levels, parents, updateAction }: EditStudentModalProps) {
  const t = useTranslations("students");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const [levelId, setLevelId] = useState(student.levelId ?? "none");
  const [parentId, setParentId] = useState(student.parentId ?? "none");

  function handleAction(formData: FormData) {
    setError(undefined);
    formData.set("id", student.id);
    formData.set("levelId", levelId === "none" ? "" : levelId);
    formData.set("parentId", parentId === "none" ? "" : parentId);
    startTransition(async () => {
      const result = await updateAction({}, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="h-7 px-2">
        <Pencil className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("editTitle")}</DialogTitle>
          </DialogHeader>

          <form action={handleAction} className="flex flex-col gap-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="e-name">{t("nameLabel")}</Label>
                <Input id="e-name" name="name" defaultValue={student.name} required autoFocus />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="e-idnumber">{t("idNumberLabel")}</Label>
                <Input
                  id="e-idnumber"
                  name="idNumber"
                  type="number"
                  min="1"
                  defaultValue={student.idNumber ?? ""}
                  placeholder={t("idNumberPlaceholder")}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="e-phone">{t("phoneLabel")}</Label>
              <Input id="e-phone" name="phone" type="tel" defaultValue={student.phone ?? ""} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>{t("levelLabel")}</Label>
                <Select value={levelId} onValueChange={setLevelId}>
                  <SelectTrigger><SelectValue placeholder={tCommon("none")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{tCommon("none")}</SelectItem>
                    {levels.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("parentLabel")}</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger><SelectValue placeholder={tCommon("none")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{tCommon("none")}</SelectItem>
                    {parents.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t("saving") : t("saveChanges")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

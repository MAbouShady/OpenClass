"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Copy, Check } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import type { ActionState } from "@/shared/domain/action-state";

export type CourseOption = {
  readonly id: string;
  readonly title: string;
  readonly latestSemesterId: string | null;
};

type AddStudentModalProps = {
  readonly createAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly levels: readonly Level[];
  readonly parents: readonly ParentOption[];
  readonly courseOptions: readonly CourseOption[];
};

export function AddStudentModal({ createAction, levels, parents, courseOptions }: AddStudentModalProps) {
  const t = useTranslations("students");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ActionState>({});
  const [isPending, startTransition] = useTransition();
  const [levelId, setLevelId] = useState("");
  const [parentId, setParentId] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function reset() {
    setState({});
    setLevelId("");
    setParentId("");
    setSelectedCourseIds(new Set());
    setCopied(false);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  function toggleCourse(courseId: string) {
    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  }

  function handleAction(formData: FormData) {
    setState({});
    formData.set("levelId", levelId);
    formData.set("parentId", parentId);
    // Append semesterIds for each selected course
    for (const courseId of selectedCourseIds) {
      const course = courseOptions.find((c) => c.id === courseId);
      if (course?.latestSemesterId) {
        formData.append("semesterIds", course.latestSemesterId);
      }
    }
    startTransition(async () => {
      const result = await createAction({}, formData);
      setState(result);
      if (!result.error) {
        formRef.current?.reset();
        setLevelId("");
        setParentId("");
        setSelectedCourseIds(new Set());
        router.refresh();
      }
    });
  }

  function copyPassword() {
    const pwd = state.message?.match(/Password: (.+)$/)?.[1];
    if (pwd) {
      void navigator.clipboard.writeText(pwd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const tempPassword = state.message?.match(/Password: (.+)$/)?.[1];
  const connectedStudent = state.message?.startsWith("connected:") ? state.message.slice("connected:".length) : null;

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        {t("addStudent")}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("addModalTitle")}</DialogTitle>
          </DialogHeader>

          {connectedStudent ? (
            <div className="flex flex-col gap-3">
              <Alert>
                <AlertDescription className="text-sm">
                  {t("connectedMsg", { student: connectedStudent })}
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { reset(); formRef.current?.reset(); }}>
                  {tCommon("addAnother")}
                </Button>
                <Button onClick={() => handleOpenChange(false)}>{tCommon("done")}</Button>
              </div>
            </div>
          ) : tempPassword ? (
            <div className="flex flex-col gap-3">
              <Alert>
                <AlertDescription className="text-sm">
                  {t("createdMsg")}
                </AlertDescription>
              </Alert>
              <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2">
                <code className="flex-1 text-sm font-mono">{tempPassword}</code>
                <Button type="button" size="sm" variant="ghost" onClick={copyPassword} className="h-7 px-2">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { reset(); formRef.current?.reset(); }}>
                  {tCommon("addAnother")}
                </Button>
                <Button onClick={() => handleOpenChange(false)}>{tCommon("done")}</Button>
              </div>
            </div>
          ) : (
            <form ref={formRef} action={handleAction} className="flex flex-col gap-4 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="s-name">{t("nameLabel")}</Label>
                  <Input id="s-name" name="name" required autoFocus />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="s-idnumber">{t("idNumberLabel")}</Label>
                  <Input id="s-idnumber" name="idNumber" type="number" min="1" placeholder={t("idNumberPlaceholder")} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="s-phone">{t("phoneLabel")}</Label>
                <Input id="s-phone" name="phone" required />
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

              {courseOptions.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <Label>{t("coursesLabel")}</Label>
                  <div className="flex flex-col gap-1.5 rounded-md border p-3">
                    {courseOptions.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox
                          checked={selectedCourseIds.has(c.id)}
                          onCheckedChange={() => toggleCourse(c.id)}
                          disabled={c.latestSemesterId === null}
                        />
                        <span className={c.latestSemesterId === null ? "text-muted-foreground" : ""}>
                          {c.title}
                          {c.latestSemesterId === null ? " (no semester)" : ""}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{t("noCoursesHint")}</p>
              )}

              {state.error ? (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
                  {tCommon("cancel")}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? t("creating") : t("createBtn")}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

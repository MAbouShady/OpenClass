"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  Check,
  CreditCard,
  Layers,
  Link2,
  MoreHorizontal,
  Pencil,
  Users,
  Trash2,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CourseForm } from "@/modules/courses/presentation/course-form";
import type { PaymentFrequency } from "@/modules/courses/domain/payment-frequency";
import { cn } from "@/shared/lib/utils";
import type { Course } from "@/modules/courses/domain/course";
import type { Level } from "@/modules/levels/domain/level";
import type { ActionState } from "@/shared/domain/action-state";

type CourseCardProps = {
  readonly course: Course;
  /** Paid / enrolled student counts. Absent while a course has no enrolments. */
  readonly counts?: { readonly enrolled: number; readonly paid: number };
  readonly levels: readonly Level[];
  readonly teacherId: string;
  readonly updateAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly deleteAction: (id: string) => Promise<void>;
};

/** The hardcoded label map is English-only; these keys are translated. */
const FREQUENCY_KEYS: Record<PaymentFrequency, string> = {
  ONE_TIME: "freqOneTime",
  MONTHLY: "freqMonthly",
  PER_SEMESTER: "freqPerSemester",
};

/** The four places a course leads to, kept visible so they stay one click away. */
const SECTIONS = [
  { key: "sessionsLabel", segment: "sessions", icon: CalendarDays },
  { key: "semestersLabel", segment: "semesters", icon: Layers },
  { key: "paymentsLabel", segment: "payments", icon: CreditCard },
  { key: "recordingsLabel", segment: "recordings", icon: Video },
] as const;

export function CourseCard({
  course,
  counts,
  levels,
  teacherId,
  updateAction,
  deleteAction,
}: CourseCardProps) {
  const t = useTranslations("courses");
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  const levelName = levels.find((level) => level.id === course.levelId)?.name ?? "—";

  function handleCopyLink() {
    const url = `${window.location.origin}/t/${teacherId}/courses/${course.id}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <Card
        className={cn(
          "flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md",
          !course.isActive && "border-dashed opacity-75",
        )}
      >
        {/* A thin status rail reads faster than a badge when scanning a grid. */}
        <div className={cn("h-1 w-full", course.isActive ? "bg-primary" : "bg-border")} />

        <CardContent className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {/* Wraps to two lines instead of truncating the title away. */}
              <h3 className="line-clamp-2 font-semibold leading-snug" title={course.title}>
                {course.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">{levelName}</p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">{t("moreActions")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => setEditing(true)}>
                  <Pencil className="h-4 w-4" />
                  {t("editLabel")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleCopyLink}>
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  {copied ? t("shareLinkCopied") : t("shareLinkLabel")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onSelect={() => setConfirmingDelete(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  {t("deleteLabel")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {!course.isActive && (
              <Badge variant="outline" className="border-destructive/40 text-destructive">
                {t("inactiveLabel")}
              </Badge>
            )}
            <Badge variant={course.sessionType === "ONLINE" ? "default" : "secondary"}>
              {t(course.sessionType === "ONLINE" ? "sessionOnline" : "sessionOffline")}
            </Badge>
            <Badge variant="outline" className="font-normal">
              {t(FREQUENCY_KEYS[course.paymentFrequency])}
            </Badge>
            {/* A price of 0 is "free", not a number worth showing bare. */}
            {course.price !== null && course.price > 0 && (
              <Badge variant="outline" className="font-normal tabular-nums">
                {t("pricePerPayment", { price: course.price })}
              </Badge>
            )}
          </div>

          <p
            className={cn(
              "line-clamp-2 flex-1 text-sm",
              course.description ? "text-muted-foreground" : "text-muted-foreground/60 italic",
            )}
          >
            {course.description || t("noDescription")}
          </p>

          {/* Paid students — the number a teacher actually scans a course for.
              Unpaid students are called out only when there are some. */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
            <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
            {counts && counts.enrolled > 0 ? (
              <p className="text-sm">
                <span className="font-semibold tabular-nums">{counts.paid}</span>
                <span className="text-muted-foreground">
                  {" / "}
                  <span className="tabular-nums">{counts.enrolled}</span> {t("paidStudents")}
                </span>
                {counts.enrolled > counts.paid ? (
                  <span className="ms-2 text-xs font-medium text-amber-600">
                    {t("unpaidCount", { count: counts.enrolled - counts.paid })}
                  </span>
                ) : null}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noStudentsYet")}</p>
            )}
          </div>

          {/* Navigation, evenly weighted — no single action visually dominates. */}
          <div className="-mx-1 grid grid-cols-4 gap-1 border-t pt-3">
            {SECTIONS.map(({ key, segment, icon: Icon }) => (
              <Link
                key={segment}
                href={`/dashboard/teacher/courses/${course.id}/${segment}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "h-auto flex-col gap-1 px-1 py-2 text-[11px] font-medium leading-tight",
                )}
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="w-full truncate text-center">{t(key)}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[90vh] max-w-sm overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("editLabel")}</DialogTitle>
          </DialogHeader>
          {editing ? (
            <CourseForm
              action={updateAction}
              levels={levels}
              defaultValues={course}
              submitLabel={t("saveLabel")}
              onSuccess={() => setEditing(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Controlled: the menu item that opens this unmounts itself on select. */}
      <ConfirmDeleteDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDesc")}
        confirmLabel={t("deleteLabel")}
        onConfirm={() => startTransition(() => void deleteAction(course.id))}
      />
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Copy,
  Check,
  Monitor,
  MapPin,
  Calendar,
  ChevronRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import type { Course } from "@/modules/courses/domain/course";
import type { Level } from "@/modules/levels/domain/level";
import {
  bookAsGuestAction,
  enrollLoggedInAction,
} from "@/app/t/[teacherId]/actions";

type SerializedSemester = {
  readonly id: string;
  readonly courseId: string;
  readonly startDate: string;
  readonly endDate: string;
};

type Props = {
  courses: readonly Course[];
  levels: readonly Level[];
  semestersByCourse: Record<string, SerializedSemester[]>;
  accent: string;
  teacherLocale: string;
  teacherId: string;
  isLoggedIn: boolean;
  enrolledCourseIds: readonly string[];
  paymentDetails: string | null;
};

type Step = "semester" | "guest" | "confirm" | "success";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BookingFlow({
  courses,
  levels,
  semestersByCourse,
  accent,
  teacherId,
  isLoggedIn,
  enrolledCourseIds,
  paymentDetails,
}: Props) {
  const t = useTranslations("booking");

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("semester");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<SerializedSemester | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [studentIdNumber, setStudentIdNumber] = useState<number | null>(null);
  const [localEnrolled, setLocalEnrolled] = useState<Set<string>>(new Set(enrolledCourseIds));
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const openBooking = (course: Course) => {
    setSelectedCourse(course);
    setError(null);
    setStudentIdNumber(null);
    setOpen(true);
    const courseSemesters = semestersByCourse[course.id] ?? [];
    if (courseSemesters.length === 1) {
      setSelectedSemester(courseSemesters[0]!);
      setStep(isLoggedIn ? "confirm" : "guest");
    } else {
      setSelectedSemester(null);
      setStep("semester");
    }
  };

  const close = () => setOpen(false);

  const selectSemester = (sem: SerializedSemester) => {
    setSelectedSemester(sem);
    setError(null);
    setStep(isLoggedIn ? "confirm" : "guest");
  };

  const handleGuestSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSemester) return;
    const fd = new FormData(e.currentTarget);
    fd.set("semesterId", selectedSemester.id);
    setError(null);

    startTransition(async () => {
      const result = await bookAsGuestAction({}, fd);
      if (result.error) {
        setError(result.error);
      } else if (result.studentIdNumber != null) {
        setStudentIdNumber(result.studentIdNumber);
        if (selectedCourse) setLocalEnrolled((prev) => new Set([...prev, selectedCourse.id]));
        setStep("success");
      }
    });
  };

  const handleConfirmEnroll = () => {
    if (!selectedSemester) return;
    const fd = new FormData();
    fd.set("semesterId", selectedSemester.id);
    setError(null);

    startTransition(async () => {
      const result = await enrollLoggedInAction({}, fd);
      if (result.error) {
        setError(result.error);
      } else if (result.studentIdNumber != null) {
        setStudentIdNumber(result.studentIdNumber);
        if (selectedCourse) setLocalEnrolled((prev) => new Set([...prev, selectedCourse.id]));
        setStep("success");
      }
    });
  };

  const copyId = () => {
    if (studentIdNumber == null) return;
    navigator.clipboard.writeText(String(studentIdNumber)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const semesters = selectedCourse ? (semestersByCourse[selectedCourse.id] ?? []) : [];

  return (
    <>
      {/* Courses section */}
      <section>
        <div
          className="mb-4 rounded-lg border-s-4 bg-muted/40 px-4 py-2.5"
          style={{ borderColor: accent }}
        >
          <h2 className="text-base font-semibold tracking-tight">{t("coursesSection")}</h2>
        </div>

        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noCourses")}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {courses.map((course) => {
              const levelName = levels.find((l) => l.id === course.levelId)?.name ?? "—";
              const isOnline = course.sessionType === "ONLINE";
              const hasSemesters = (semestersByCourse[course.id]?.length ?? 0) > 0;
              const isEnrolled = localEnrolled.has(course.id);

              return (
                <div
                  key={course.id}
                  className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base leading-snug">{course.title}</h3>
                      {course.price != null && (
                        <p className="mt-0.5 text-sm font-bold" style={{ color: accent }}>
                          {course.paymentFrequency === "MONTHLY"
                            ? t("pricePerMonth", { price: course.price })
                            : t("pricePerSession", { price: course.price })}
                        </p>
                      )}
                      {course.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {course.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{levelName}</Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {isOnline ? (
                            <><Monitor size={10} /> {t("onlineBadge")}</>
                          ) : (
                            <><MapPin size={10} /> {t("offlineBadge")}</>
                          )}
                        </Badge>
                      </div>
                    </div>
                    {isEnrolled ? (
                      <Badge className="shrink-0 text-white font-semibold gap-1" style={{ backgroundColor: accent }}>
                        <CheckCircle2 size={12} /> {t("enrolledBadge")}
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => openBooking(course)}
                        disabled={!hasSemesters}
                        className="shrink-0 text-white font-semibold"
                        style={{ backgroundColor: accent }}
                        title={!hasSemesters ? t("noSemesters") : undefined}
                      >
                        {t("bookBtn")} <ChevronRight size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Booking dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full max-h-[90dvh] overflow-y-auto">

          {/* Step: semester selection */}
          {step === "semester" && selectedCourse && (
            <>
              <DialogHeader>
                <DialogTitle>{t("selectSemesterTitle")}</DialogTitle>
                <p className="text-sm text-muted-foreground">{selectedCourse.title}</p>
                {selectedCourse.price != null && (
                  <p className="text-sm font-bold" style={{ color: accent }}>
                    {selectedCourse.paymentFrequency === "MONTHLY"
                      ? t("pricePerMonth", { price: selectedCourse.price })
                      : t("pricePerSession", { price: selectedCourse.price })}
                  </p>
                )}
              </DialogHeader>

              {semesters.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">{t("noSemesters")}</p>
              ) : (
                <div className="flex flex-col gap-3 py-2">
                  {semesters.map((sem) => (
                    <button
                      key={sem.id}
                      type="button"
                      onClick={() => selectSemester(sem)}
                      className="flex items-center justify-between rounded-xl border bg-card p-4 text-start hover:border-primary/60 hover:bg-muted/30 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-muted-foreground shrink-0" />
                        <p className="text-sm font-medium">
                          {fmt(sem.startDate)} — {fmt(sem.endDate)}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Step: guest form */}
          {step === "guest" && selectedCourse && selectedSemester && (
            <>
              <DialogHeader>
                <DialogTitle>{t("guestTitle")}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedCourse.title} · {fmt(selectedSemester.startDate)} — {fmt(selectedSemester.endDate)}
                </p>
                {selectedCourse.price != null && (
                  <p className="text-sm font-bold" style={{ color: accent }}>
                    {selectedCourse.paymentFrequency === "MONTHLY"
                      ? t("pricePerMonth", { price: selectedCourse.price })
                      : t("pricePerSession", { price: selectedCourse.price })}
                  </p>
                )}
              </DialogHeader>

              <form onSubmit={handleGuestSubmit} className="flex flex-col gap-3">
                <input type="hidden" name="teacherId" value={teacherId} />
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">{t("nameLabel")}</Label>
                  <Input id="name" name="name" required autoComplete="name" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">{t("phoneLabel")}</Label>
                  <Input id="phone" name="phone" type="tel" required autoComplete="tel" />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => setStep("semester")} className="flex items-center gap-1">
                    <ArrowLeft size={14} /> {t("back")}
                  </Button>
                  <Button type="submit" disabled={isPending} className="flex-1 text-white" style={{ backgroundColor: accent }}>
                    {isPending ? <><Loader2 size={14} className="animate-spin me-1" /> {t("loading")}</> : t("bookBtn")}
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* Step: confirm (logged in) */}
          {step === "confirm" && selectedCourse && selectedSemester && (
            <>
              <DialogHeader>
                <DialogTitle>{t("confirmTitle")}</DialogTitle>
              </DialogHeader>

              <div className="rounded-xl border bg-muted/30 p-4 flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("confirmCourse")}</span>
                  <span className="font-medium">{selectedCourse.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("confirmSemester")}</span>
                  <span className="font-medium">
                    {fmt(selectedSemester.startDate)} — {fmt(selectedSemester.endDate)}
                  </span>
                </div>
                {selectedCourse.price != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("confirmPrice")}</span>
                    <span className="font-bold" style={{ color: accent }}>
                      {selectedCourse.paymentFrequency === "MONTHLY"
                        ? t("pricePerMonth", { price: selectedCourse.price })
                        : t("pricePerSession", { price: selectedCourse.price })}
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("semester")} className="flex items-center gap-1">
                  <ArrowLeft size={14} /> {t("back")}
                </Button>
                <Button onClick={handleConfirmEnroll} disabled={isPending} className="flex-1 text-white" style={{ backgroundColor: accent }}>
                  {isPending ? <><Loader2 size={14} className="animate-spin me-1" /> {t("loading")}</> : t("confirmBtn")}
                </Button>
              </div>
            </>
          )}

          {/* Step: success */}
          {step === "success" && selectedCourse && selectedSemester && studentIdNumber != null && (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: `${accent}22` }}>
                <CheckCircle2 size={32} style={{ color: accent }} />
              </div>

              <div>
                <h2 className="text-xl font-bold">{t("successTitle")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedCourse.title} · {fmt(selectedSemester.startDate)} — {fmt(selectedSemester.endDate)}
                </p>
              </div>

              <div className="w-full rounded-xl border-2 bg-muted/30 p-4" style={{ borderColor: accent + "44" }}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("studentIdLabel")}
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-background px-3 py-2 text-sm font-mono border break-all">
                    #{studentIdNumber}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyId} title={t("copyId")}>
                    {copied ? <Check size={14} style={{ color: accent }} /> : <Copy size={14} />}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{t("studentIdNote")}</p>
              </div>

              <div className="w-full rounded-xl border-2 bg-amber-50 dark:bg-amber-950/20 p-4 border-amber-300 dark:border-amber-700">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">{t("pendingTitle")}</p>
                {selectedCourse.price != null && (
                  <p className="text-base font-bold text-amber-900 dark:text-amber-200 mb-1">
                    {selectedCourse.paymentFrequency === "MONTHLY"
                      ? t("pricePerMonth", { price: selectedCourse.price })
                      : t("pricePerSession", { price: selectedCourse.price })}
                  </p>
                )}
                <p className="text-sm text-amber-700 dark:text-amber-400">{t("paymentNote")}</p>
                {paymentDetails && (
                  <div
                    className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800 prose prose-sm dark:prose-invert max-w-none text-amber-900 dark:text-amber-200"
                    dangerouslySetInnerHTML={{ __html: paymentDetails }}
                  />
                )}
              </div>

              <Button variant="outline" className="w-full" onClick={close}>
                {t("closeBtn")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

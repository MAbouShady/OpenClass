"use client";

import { useState, useTransition, useEffect, useRef } from "react";
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
  ChevronDown,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import { CollapsibleSection } from "@/app/t/[teacherId]/collapsible-section";
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
  autoOpenCourseId?: string;
};

type Step = "semester" | "guest" | "confirm" | "success" | "already-enrolled";

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
  autoOpenCourseId,
}: Props) {
  const t = useTranslations("booking");

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("semester");

  const coursesByLevel = levels
    .filter((l) => courses.some((c) => c.levelId === l.id))
    .map((l) => ({ level: l, courses: courses.filter((c) => c.levelId === l.id) }));
  const singleLevel = coursesByLevel.length === 1;
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(
    singleLevel ? (coursesByLevel[0]?.level.id ?? null) : null,
  );
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<SerializedSemester | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [studentIdNumber, setStudentIdNumber] = useState<number | null>(null);
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const [phoneValue, setPhoneValue] = useState("");
  const [localEnrolled, setLocalEnrolled] = useState<Set<string>>(new Set(enrolledCourseIds));
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const openBooking = (course: Course) => {
    setSelectedCourse(course);
    setError(null);
    setStudentIdNumber(null);
    setPhoneValue("");
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

  const autoOpened = useRef(false);
  useEffect(() => {
    if (!autoOpenCourseId || autoOpened.current) return;
    const course = courses.find((c) => c.id === autoOpenCourseId);
    if (!course) return;
    const hasSemesters = (semestersByCourse[course.id]?.length ?? 0) > 0;
    if (!hasSemesters) return;
    autoOpened.current = true;
    window.dispatchEvent(new CustomEvent("open-courses"));
    openBooking(course);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (result.alreadyEnrolled) {
        setStudentIdNumber(result.studentIdNumber ?? null);
        setIsPaid(result.isPaid ?? false);
        if (selectedCourse) setLocalEnrolled((prev) => new Set([...prev, selectedCourse.id]));
        setStep("already-enrolled");
      } else if (result.error) {
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
      <CollapsibleSection
        heading={t("coursesSection")}
        accent={accent}
        blink
        defaultOpen={!!autoOpenCourseId}
        listenForOpen="open-courses"
        collapsedCta={
          <div className="mt-4">
            <style>{`
              @keyframes cta-shimmer {
                0% { transform: translateX(-100%) skewX(-12deg); }
                65%, 100% { transform: translateX(250%) skewX(-12deg); }
              }
              @keyframes cta-glow {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
              }
            `}</style>

            {/* Glow halo */}
            <div
              className="absolute -inset-2 rounded-3xl blur-xl pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at center, ${accent}40 0%, transparent 70%)`,
                animation: "cta-glow 2s ease-in-out infinite",
              }}
            />

            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-courses"));
                document.getElementById("courses")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="relative w-full overflow-hidden rounded-2xl py-4 font-bold text-base text-white flex items-center justify-center gap-3 transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] select-none"
              style={{
                background: `linear-gradient(135deg, ${accent}ee 0%, ${accent} 50%, ${accent}cc 100%)`,
                boxShadow: `0 8px 32px ${accent}50, 0 2px 8px ${accent}30, inset 0 1px 0 rgba(255,255,255,0.15)`,
              }}
            >
              {/* Shimmer sweep */}
              <div
                className="absolute inset-0 w-1/3"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                  animation: "cta-shimmer 2.8s ease-in-out infinite",
                }}
              />
              <Sparkles size={17} className="shrink-0 opacity-90" />
              <span className="tracking-wide text-[15px]">{t("bookNow")}</span>
              <ChevronDown size={18} className="animate-bounce shrink-0" />
            </button>

          </div>
        }
      >
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noCourses")}</p>
        ) : selectedLevelId == null ? (
          /* Level picker */
          <div className="flex flex-col gap-3">
            {coursesByLevel.map(({ level, courses: lvCourses }) => (
              <button
                key={level.id}
                type="button"
                onClick={() => setSelectedLevelId(level.id)}
                className="flex items-center justify-between rounded-xl border bg-card px-5 py-4 hover:shadow-md transition-shadow text-start"
              >
                <div>
                  <p className="font-semibold text-base">{level.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {t("courseCount", { count: lvCourses.length })}
                  </p>
                </div>
                <ChevronRight size={18} className="text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          /* Courses for selected level */
          <div className="flex flex-col gap-4">
            {!singleLevel && (
              <button
                type="button"
                onClick={() => setSelectedLevelId(null)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                <ArrowLeft size={14} />
                {t("back")}
              </button>
            )}
            {(coursesByLevel.find((g) => g.level.id === selectedLevelId)?.courses ?? []).map((course) => {
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
      </CollapsibleSection>

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
                  <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phoneValue}
                  onChange={(e) => {
                    const normalized = e.target.value
                      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
                      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
                      .replace(/\D/g, "");
                    setPhoneValue(normalized);
                  }}
                />
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

          {/* Step: already enrolled */}
          {step === "already-enrolled" && selectedCourse && (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: isPaid ? `${accent}22` : "#f59e0b22" }}
              >
                <CheckCircle2 size={32} style={{ color: isPaid ? accent : "#f59e0b" }} />
              </div>

              <div>
                <h2 className="text-xl font-bold">{t("alreadyEnrolledTitle")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{selectedCourse.title}</p>
              </div>

              {studentIdNumber != null && (
                <div className="w-full rounded-xl border-2 bg-muted/30 p-4" style={{ borderColor: accent + "44" }}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("studentIdLabel")}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-background px-3 py-2 text-sm font-mono border">
                      #{studentIdNumber}
                    </code>
                    <Button variant="outline" size="icon" onClick={copyId} title={t("copyId")}>
                      {copied ? <Check size={14} style={{ color: accent }} /> : <Copy size={14} />}
                    </Button>
                  </div>
                </div>
              )}

              {isPaid ? (
                <div className="w-full rounded-xl border-2 p-4" style={{ borderColor: accent + "66", backgroundColor: `${accent}11` }}>
                  <p className="font-semibold" style={{ color: accent }}>{t("alreadyPaid")}</p>
                </div>
              ) : (
                <div className="w-full rounded-xl border-2 bg-amber-50 dark:bg-amber-950/20 p-4 border-amber-300 dark:border-amber-700">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">{t("alreadyUnpaid")}</p>
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
              )}

              <Button variant="outline" className="w-full" onClick={close}>
                {t("closeBtn")}
              </Button>
            </div>
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

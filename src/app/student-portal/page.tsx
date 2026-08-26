import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BookOpen, Lock, LogOut, PlayCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listStudentCourses } from "@/modules/recordings/application/list-student-courses";
import { recordings } from "@/modules/recordings/infrastructure/container";
import { resolveStudentPortalActor } from "@/modules/recordings/infrastructure/recording-actor";
import { Badge } from "@/components/ui/badge";
import { CourseAccessNotice } from "@/modules/recordings/presentation/course-access-notice";
import { CourseProgressBar } from "@/modules/recordings/presentation/course-progress-bar";
import { CodeForm } from "@/app/student-portal/code-form";
import { StudentPortalShell } from "@/app/student-portal/student-portal-shell";
import { signInWithCodeAction, signOutOfPortalAction } from "@/app/student-portal/actions";

export const metadata: Metadata = { title: "Student Portal — OpenClass" };
export const dynamic = "force-dynamic";

export default async function StudentPortalPage() {
  const [actor, t, tRecordings] = await Promise.all([
    resolveStudentPortalActor(),
    getTranslations("studentPortal"),
    getTranslations("recordings"),
  ]);

  if (!actor) {
    return (
      <StudentPortalShell title={t("title")}>
        <div className="bg-gradient-to-b from-primary/5 to-transparent px-4 py-10">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 text-center">
            <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <PlayCircle className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
            <p className="max-w-xs text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>

        <div className="mx-auto -mt-2 max-w-3xl px-4 pb-16">
          <Card className="shadow-md">
            <CardContent className="p-6">
              <CodeForm action={signInWithCodeAction} />
            </CardContent>
          </Card>
        </div>
      </StudentPortalShell>
    );
  }

  const student = await recordings.studentDirectory.findById(actor.userId);
  const courses = await listStudentCourses(recordings, actor.userId);

  return (
    <StudentPortalShell title={t("title")}>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-5 py-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
              {(student?.name ?? "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold leading-tight">{student?.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t("codeBadge", { code: student?.code ?? 0 })}
              </p>
            </div>
          </div>

          <form action={signOutOfPortalAction}>
            <Button type="submit" variant="ghost" size="sm" className="gap-1.5">
              <LogOut className="h-4 w-4" />
              {t("signOut")}
            </Button>
          </form>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
            <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t("noCourses")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {courses.map(({ course, lessonCount, summary, access }) => (
              <Card key={course.id}>
                <CardContent className="flex flex-col gap-4 pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold">{course.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        {t("lessonCount", { count: lessonCount })}
                      </p>
                    </div>
                    {access.granted ? null : (
                      <Badge variant="secondary" className="gap-1">
                        <Lock className="h-3 w-3" />
                        {tRecordings("lockedBadge")}
                      </Badge>
                    )}
                  </div>

                  <CourseProgressBar
                    percent={summary.percent}
                    completedLessons={summary.completedLessons}
                    totalLessons={summary.totalLessons}
                  />

                  {access.granted ? (
                    <Link
                      href={`/student-portal/courses/${course.id}/lessons`}
                      className={`${buttonVariants({ size: "sm" })} gap-1.5 self-start`}
                    >
                      <PlayCircle className="h-4 w-4" />
                      {summary.completedLessons > 0 ? t("continue") : t("start")}
                    </Link>
                  ) : (
                    <CourseAccessNotice access={access} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudentPortalShell>
  );
}

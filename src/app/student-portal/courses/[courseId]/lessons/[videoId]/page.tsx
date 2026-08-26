import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { getCourseLessons } from "@/modules/recordings/application/get-course-lessons";
import { recordings } from "@/modules/recordings/infrastructure/container";
import { resolveStudentPortalActor } from "@/modules/recordings/infrastructure/recording-actor";
import { CourseAccessNotice } from "@/modules/recordings/presentation/course-access-notice";
import { CourseProgressBar } from "@/modules/recordings/presentation/course-progress-bar";
import { LessonList } from "@/modules/recordings/presentation/lesson-list";
import { LessonNav } from "@/modules/recordings/presentation/lesson-nav";
import { VideoPlayer } from "@/modules/recordings/presentation/video-player";
import { toStudentLessons } from "@/modules/recordings/presentation/to-student-lessons";
import { StudentPortalShell } from "@/app/student-portal/student-portal-shell";

export const dynamic = "force-dynamic";

export default async function PortalLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; videoId: string }>;
}) {
  const { courseId, videoId } = await params;
  const [actor, t] = await Promise.all([
    resolveStudentPortalActor(),
    getTranslations("recordings"),
  ]);
  if (!actor) redirect("/student-portal");

  const result = await getCourseLessons(recordings, actor, courseId);
  if (!result) notFound();

  // The lesson must be one this student is entitled to see, so a swapped id in
  // the URL cannot reach another course's or an unpublished video.
  const index = result.lessons.findIndex((lesson) => lesson.video.id === videoId);
  if (index === -1) notFound();

  const current = result.lessons[index]!;
  const lessons = toStudentLessons(result.lessons);
  const ready = current.video.asset?.processingStatus === "READY";
  // The player is withheld unless access is live. `authorizePlayback` refuses
  // independently, so this is presentation, not the security boundary.
  const canWatch = result.access.granted;
  const student = await recordings.studentDirectory.findById(actor.userId);

  return (
    <StudentPortalShell title={result.course.title}>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-4">
          <Link
            href="/student-portal"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("backToCourses")}
          </Link>

          <div>
            <p className="text-sm text-muted-foreground">{result.course.title}</p>
            <h1 className="text-xl font-semibold">
              {current.video.position}. {current.video.title}
            </h1>
          </div>

          {!canWatch ? (
            <CourseAccessNotice access={result.access} />
          ) : ready ? (
            <VideoPlayer
              recordedVideoId={current.video.id}
              title={current.video.title}
              watermarkLabel={t("watermark", {
                viewer: student ? `${student.name} · ${student.code}` : t("watermarkFallback"),
              })}
            />
          ) : (
            <Alert>
              <AlertDescription>{t("lessonNotReady")}</AlertDescription>
            </Alert>
          )}

          <LessonNav
            basePath={`/student-portal/courses/${courseId}/lessons`}
            previousLessonId={result.lessons[index - 1]?.video.id ?? null}
            nextLessonId={result.lessons[index + 1]?.video.id ?? null}
          />

          {current.video.description ? (
            <Card>
              <CardContent className="pt-6">
                <h2 className="mb-2 text-sm font-medium">{t("aboutLesson")}</h2>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {current.video.description}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <CourseProgressBar
                percent={result.summary.percent}
                completedLessons={result.summary.completedLessons}
                totalLessons={result.summary.totalLessons}
              />
              <LessonList
                basePath={`/student-portal/courses/${courseId}/lessons`}
                lessons={lessons}
                activeLessonId={videoId}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </StudentPortalShell>
  );
}
